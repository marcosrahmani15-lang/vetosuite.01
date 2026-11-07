import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateStaff } from '../middleware/auth';

export const vaccinationsRouter = Router();

// GET /api/vaccinations - List vaccinations with filters
vaccinationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { animal_id, owner_id, overdue } = req.query;
    let queryText = `
      SELECT v.*, 
        a.name as animal_name, 
        a.species as animal_species, 
        o.name as owner_name, 
        o.phone as owner_phone,
        o.phone_normalized as owner_phone_normalized,
        o.sms_consent as owner_sms_consent
      FROM vaccinations v
      JOIN animals a ON a.id = v.animal_id
      JOIN owners o ON o.id = v.owner_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (animal_id) {
      params.push(animal_id);
      queryText += ` AND v.animal_id = $${params.length}`;
    }

    if (owner_id) {
      params.push(owner_id);
      queryText += ` AND v.owner_id = $${params.length}`;
    }

    if (overdue === 'true') {
      queryText += ` AND v.next_due_date < CURRENT_DATE AND v.status != 'Effectué'`;
    }

    queryText += ` ORDER BY v.next_due_date ASC`;

    const { rows } = await db.query(queryText, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch vaccinations', details: err.message });
  }
});

// POST /api/vaccinations - Register a vaccination and schedule automated reminders (Staff only)
vaccinationsRouter.post('/', authenticateStaff, async (req: Request, res: Response) => {
  try {
    const {
      animal_id,
      vaccine_name,
      administered_date,
      next_due_date,
      lot_number = '',
      veterinarian = 'Dr. Martin',
      notes = '',
      status = 'À planifier'
    } = req.body;

    if (!animal_id || !vaccine_name || !administered_date || !next_due_date) {
      return res.status(400).json({
        error: "L'animal, le nom du vaccin, la date d'administration et la prochaine date d'échéance sont obligatoires."
      });
    }

    // Resolve owner_id through animal relation
    const animalRes = await db.query(`SELECT id, owner_id FROM animals WHERE id = $1`, [animal_id]);
    if (animalRes.rows.length === 0) {
      return res.status(404).json({ error: "Animal spécifié introuvable" });
    }
    const ownerId = animalRes.rows[0].owner_id;
    const vacId = req.body.id || `vac-${Date.now()}`;

    // Insert vaccination
    const { rows } = await db.query(
      `INSERT INTO vaccinations (
        id, animal_id, owner_id, vaccine_name, administered_date, next_due_date, 
        lot_number, veterinarian, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [vacId, animal_id, ownerId, vaccine_name.trim(), administered_date, next_due_date, lot_number, veterinarian, notes, status]
    );

    const savedVac = rows[0];

    // Compute and register scheduled reminder records for future SMS engine (Section 5)
    await scheduleVaccinationReminders(savedVac);

    res.status(201).json(savedVac);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to register vaccination', details: err.message });
  }
});

// PUT /api/vaccinations/:id - Update vaccination (Staff only)
vaccinationsRouter.put('/:id', authenticateStaff, async (req: Request, res: Response) => {
  try {
    const { vaccine_name, administered_date, next_due_date, lot_number, veterinarian, notes, status } = req.body;

    // Check existing
    const existing = await db.query(`SELECT * FROM vaccinations WHERE id = $1`, [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Vaccination not found' });
    }
    const oldVac = existing.rows[0];

    const { rows } = await db.query(
      `UPDATE vaccinations
       SET vaccine_name = COALESCE($1, vaccine_name),
           administered_date = COALESCE($2, administered_date),
           next_due_date = COALESCE($3, next_due_date),
           lot_number = COALESCE($4, lot_number),
           veterinarian = COALESCE($5, veterinarian),
           notes = COALESCE($6, notes),
           status = COALESCE($7, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [vaccine_name, administered_date, next_due_date, lot_number, veterinarian, notes, status, req.params.id]
    );

    const updatedVac = rows[0];

    // If next_due_date changed, cancel previous pending reminders and recalculate (Section 5 rule)
    if (next_due_date && next_due_date !== oldVac.next_due_date) {
      await db.query(
        `UPDATE sms_reminders 
         SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP 
         WHERE vaccination_id = $1 AND status = 'Scheduled'`,
        [updatedVac.id]
      );
      await scheduleVaccinationReminders(updatedVac);
    }

    res.json(updatedVac);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update vaccination', details: err.message });
  }
});

// DELETE /api/vaccinations/:id - Delete vaccination (Staff only)
vaccinationsRouter.delete('/:id', authenticateStaff, async (req: Request, res: Response) => {
  try {
    // Cancel associated reminders
    await db.query(
      `UPDATE sms_reminders 
       SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE vaccination_id = $1 AND status = 'Scheduled'`,
      [req.params.id]
    );

    const { rowCount } = await db.query(`DELETE FROM vaccinations WHERE id = $1`, [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Vaccination not found' });
    }
    res.json({ success: true, message: 'Vaccination deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete vaccination', details: err.message });
  }
});

// Helper: Schedule vaccination reminders at configurable intervals (default: 7d, 3d, 1d)
async function scheduleVaccinationReminders(vac: any) {
  try {
    // Default intervals: 7 days, 3 days, 1 day prior to next_due_date
    const intervals = [7, 3, 1];
    const dueDate = new Date(vac.next_due_date);

    for (const daysBefore of intervals) {
      const scheduledDate = new Date(dueDate);
      scheduledDate.setDate(dueDate.getDate() - daysBefore);
      // Set to 09:30 AM Africa/Algiers sending hour
      scheduledDate.setHours(9, 30, 0, 0);

      const reminderId = `rem-vac-${vac.id}-${daysBefore}d`;
      const idempotencyKey = `idemp_vac_${vac.id}_${daysBefore}d_${vac.next_due_date}`;

      await db.query(
        `INSERT INTO sms_reminders (
          id, owner_id, animal_id, vaccination_id, reminder_type, scheduled_at, status, idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (idempotency_key) DO NOTHING`,
        [
          reminderId,
          vac.owner_id,
          vac.animal_id,
          vac.id,
          `VACCINATION_${daysBefore}D`,
          scheduledDate.toISOString(),
          'Scheduled',
          idempotencyKey
        ]
      );
    }
  } catch (e) {
    console.warn('[MyVet DB] Non-fatal: Reminder scheduling notice:', e);
  }
}
