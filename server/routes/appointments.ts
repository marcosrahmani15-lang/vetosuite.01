import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateStaff } from '../middleware/auth';

export const appointmentsRouter = Router();

// GET /api/appointments - List appointments
appointmentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { date, animal_id, status } = req.query;
    let queryText = `
      SELECT ap.*, 
        a.species as animal_species,
        o.phone as owner_phone,
        o.phone_normalized as owner_phone_normalized,
        o.sms_consent as owner_sms_consent
      FROM appointments ap
      LEFT JOIN animals a ON a.id = ap.animal_id
      LEFT JOIN owners o ON o.id = ap.owner_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      params.push(date);
      queryText += ` AND ap.date = $${params.length}`;
    }

    if (animal_id) {
      params.push(animal_id);
      queryText += ` AND ap.animal_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      queryText += ` AND ap.status = $${params.length}`;
    }

    queryText += ` ORDER BY ap.date ASC, ap.start_time ASC`;

    const { rows } = await db.query(queryText, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch appointments', details: err.message });
  }
});

// POST /api/appointments - Book appointment (Staff only)
appointmentsRouter.post('/', authenticateStaff, async (req: Request, res: Response) => {
  try {
    const {
      animal_id,
      animal_name,
      owner_id,
      owner_name,
      date,
      start_time,
      end_time,
      type = 'Consultation',
      reason,
      veterinarian = 'Dr. Martin',
      status = 'Confirmé',
      notes = ''
    } = req.body;

    if (!animal_name || !owner_name || !date || !start_time || !end_time || !reason) {
      return res.status(400).json({
        error: "L'animal, le propriétaire, la date, l'heure et le motif sont requis."
      });
    }

    const id = req.body.id || `apt-${Date.now()}`;

    const { rows } = await db.query(
      `INSERT INTO appointments (
        id, animal_id, animal_name, owner_id, owner_name, date, start_time, end_time, 
        type, reason, veterinarian, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        id, animal_id || null, animal_name, owner_id || null, owner_name, 
        date, start_time, end_time, type, reason, veterinarian, status, notes
      ]
    );

    const savedApt = rows[0];

    // Automatically schedule appointment reminder 24 hours prior (Section 6)
    if (status !== 'Annulé' && owner_id) {
      await scheduleAppointmentReminder(savedApt);
    }

    res.status(201).json(savedApt);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create appointment', details: err.message });
  }
});

// PUT /api/appointments/:id - Update appointment (Staff only)
appointmentsRouter.put('/:id', authenticateStaff, async (req: Request, res: Response) => {
  try {
    const {
      animal_name, owner_name, date, start_time, end_time,
      type, reason, veterinarian, status, notes
    } = req.body;

    // Fetch existing
    const existing = await db.query(`SELECT * FROM appointments WHERE id = $1`, [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    const oldApt = existing.rows[0];

    const { rows } = await db.query(
      `UPDATE appointments
       SET animal_name = COALESCE($1, animal_name),
           owner_name = COALESCE($2, owner_name),
           date = COALESCE($3, date),
           start_time = COALESCE($4, start_time),
           end_time = COALESCE($5, end_time),
           type = COALESCE($6, type),
           reason = COALESCE($7, reason),
           veterinarian = COALESCE($8, veterinarian),
           status = COALESCE($9, status),
           notes = COALESCE($10, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        animal_name, owner_name, date, start_time, end_time,
        type, reason, veterinarian, status, notes, req.params.id
      ]
    );

    const updatedApt = rows[0];

    // Critical Rules from Section 6:
    // 1. Cancelled appointments must never trigger reminders
    // 2. Completed appointments must not receive future appointment reminders
    if (status === 'Annulé' || status === 'Terminé' || status === 'Manqué') {
      await db.query(
        `UPDATE sms_reminders 
         SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP 
         WHERE appointment_id = $1 AND status = 'Scheduled'`,
        [updatedApt.id]
      );
    } else if (date && (date !== oldApt.date || start_time !== oldApt.start_time)) {
      // 3. Rescheduled appointments must have their old reminders cancelled and rescheduled
      await db.query(
        `UPDATE sms_reminders 
         SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP 
         WHERE appointment_id = $1 AND status = 'Scheduled'`,
        [updatedApt.id]
      );
      if (updatedApt.owner_id) {
        await scheduleAppointmentReminder(updatedApt);
      }
    }

    res.json(updatedApt);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update appointment', details: err.message });
  }
});

// DELETE /api/appointments/:id - Delete appointment (Staff only)
appointmentsRouter.delete('/:id', authenticateStaff, async (req: Request, res: Response) => {
  try {
    // Cancel any pending reminders
    await db.query(
      `UPDATE sms_reminders 
       SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE appointment_id = $1 AND status = 'Scheduled'`,
      [req.params.id]
    );

    const { rowCount } = await db.query(`DELETE FROM appointments WHERE id = $1`, [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete appointment', details: err.message });
  }
});

// Helper: Schedule 24h appointment reminder
async function scheduleAppointmentReminder(apt: any) {
  try {
    const aptDateTime = new Date(`${apt.date}T${apt.start_time}:00`);
    const scheduledDate = new Date(aptDateTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours prior

    const reminderId = `rem-apt-${apt.id}-24h`;
    const idempotencyKey = `idemp_apt_${apt.id}_${apt.date}_${apt.start_time}`;

    await db.query(
      `INSERT INTO sms_reminders (
        id, owner_id, animal_id, appointment_id, reminder_type, scheduled_at, status, idempotency_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        reminderId,
        apt.owner_id,
        apt.animal_id,
        apt.id,
        'APPOINTMENT_24H',
        scheduledDate.toISOString(),
        'Scheduled',
        idempotencyKey
      ]
    );
  } catch (e) {
    console.warn('[MyVet DB] Non-fatal appointment reminder scheduling notice:', e);
  }
}
