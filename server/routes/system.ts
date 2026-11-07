import { Router, Request, Response } from 'express';
import { db } from '../db';
import { normalizeAlgerianPhone } from '../utils/phone';
import { requireAdminRole } from '../middleware/auth';

export const systemRouter = Router();

// GET /api/system/status - Returns DB provider, connection status, table record counts
systemRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await db.getStatus();
    res.json({
      application: 'MyVet Veterinary Management System',
      country: 'Algeria',
      clinic: 'Cabinet Vétérinaire My Vet (Ouled Fayet)',
      environment: process.env.NODE_ENV || 'development',
      database: status,
      scheduling: {
        mode: process.env.ENABLE_DEV_SCHEDULER === 'true' ? 'Hybrid (Cloud Scheduler + Local Dev Worker)' : 'Cloud Scheduler Only',
        cloudSchedulerEndpoint: '/api/cron/process-reminders',
        timezone: 'Africa/Algiers'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to inspect system status', details: err.message });
  }
});

// POST /api/system/migrate - Safe idempotent migration from browser localStorage to PostgreSQL
// Protected by requireAdminRole
systemRouter.post('/migrate', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { clients = [], patients = [], appointments = [], tasks = [] } = req.body;

    // Execute within a transaction for atomic all-or-nothing safety
    const result = await db.withTransaction(async (client) => {
      let importedOwners = 0;
      let importedAnimals = 0;
      let importedAppointments = 0;
      let importedTasks = 0;

      // 1. Migrate Clients -> Owners (Idempotent ON CONFLICT)
      for (const c of clients) {
        if (!c.id || !c.name) continue;
        const phoneNorm = normalizeAlgerianPhone(c.phone);

        const resOwner = await client.query(
          `INSERT INTO owners (id, name, phone, phone_normalized, email, address, preferred_language, sms_consent)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE 
           SET name = EXCLUDED.name,
               phone = EXCLUDED.phone,
               phone_normalized = EXCLUDED.phone_normalized,
               updated_at = CURRENT_TIMESTAMP
           RETURNING id`,
          [
            c.id,
            c.name,
            c.phone || '0555555555',
            phoneNorm.e164 || null,
            c.email || null,
            c.address || null,
            'fr',
            true
          ]
        );
        if (resOwner.rowCount > 0) importedOwners++;
      }

      // 2. Migrate Patients -> Animals (Idempotent ON CONFLICT)
      for (const p of patients) {
        if (!p.id || !p.name) continue;

        let ownerId = p.ownerId || 'c1';
        const ownerCheck = await client.query(`SELECT id FROM owners WHERE id = $1`, [ownerId]);
        if (ownerCheck.rows.length === 0) {
          await client.query(
            `INSERT INTO owners (id, name, phone, phone_normalized) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (id) DO NOTHING`,
            [ownerId, p.ownerName || 'Client Inconnu', p.ownerPhone || '0555555555', normalizeAlgerianPhone(p.ownerPhone || '0555555555').e164]
          );
        }

        const resAnimal = await client.query(
          `INSERT INTO animals (
            id, name, species, breed, color, gender, birth_date, age, weight, 
            microchip, owner_id, veterinarian, status, avatar_emoji
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE 
          SET name = EXCLUDED.name,
              breed = EXCLUDED.breed,
              weight = EXCLUDED.weight,
              updated_at = CURRENT_TIMESTAMP
          RETURNING id`,
          [
            p.id,
            p.name,
            p.species || 'Chat',
            p.breed || 'Européen',
            p.color || '—',
            p.gender || 'Femelle',
            p.birthDate || '01/01/2025',
            p.age || '1 an',
            p.weight || '4 kg',
            p.microchip || '—',
            ownerId,
            p.veterinarian || 'Dr. Martin',
            p.status || 'Actif',
            p.avatarEmoji || (p.species === 'Chien' ? '🐕' : '🐱')
          ]
        );
        if (resAnimal.rowCount > 0) importedAnimals++;
      }

      // 3. Migrate Appointments (Idempotent ON CONFLICT)
      for (const a of appointments) {
        if (!a.id || !a.date) continue;
        const resApt = await client.query(
          `INSERT INTO appointments (
            id, animal_id, animal_name, owner_id, owner_name, date, start_time, end_time, 
            type, reason, veterinarian, status, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO UPDATE 
          SET date = EXCLUDED.date,
              start_time = EXCLUDED.start_time,
              status = EXCLUDED.status,
              updated_at = CURRENT_TIMESTAMP
          RETURNING id`,
          [
            a.id,
            a.patientId || null,
            a.patientName || 'Animal',
            a.clientId || null,
            a.clientName || 'Propriétaire',
            a.date,
            a.startTime || '09:00',
            a.endTime || '09:30',
            a.type || 'Consultation',
            a.reason || 'Consultation générale',
            a.veterinarian || 'Dr. Martin',
            a.status || 'Confirmé',
            a.notes || ''
          ]
        );
        if (resApt.rowCount > 0) importedAppointments++;
      }

      // 4. Migrate Tasks (Idempotent ON CONFLICT)
      for (const t of tasks) {
        if (!t.id || !t.title) continue;
        const resTask = await client.query(
          `INSERT INTO tasks (
            id, title, description, priority, category, assigned_to, created_by,
            due_date, due_date_formatted, completed
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE
          SET title = EXCLUDED.title,
              completed = EXCLUDED.completed,
              updated_at = CURRENT_TIMESTAMP
          RETURNING id`,
          [
            t.id,
            t.title,
            t.description || '',
            t.priority || 'Normale',
            t.category || 'Médicale',
            t.assignedTo || 'Dr. Martin',
            t.createdBy || 'Dr. Vétérinaire',
            t.dueDate || '2026-08-14',
            t.dueDateFormatted || 'Aug 14, 2026',
            Boolean(t.completed)
          ]
        );
        if (resTask.rowCount > 0) importedTasks++;
      }

      return {
        importedOwners,
        importedAnimals,
        importedAppointments,
        importedTasks
      };
    });

    res.json({
      success: true,
      summary: result,
      message: 'Migration localStorage vers PostgreSQL effectuée avec succès et garantie d\'idempotence.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Migration failed', details: err.message });
  }
});
