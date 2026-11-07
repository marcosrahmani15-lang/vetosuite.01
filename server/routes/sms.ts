import { Router, Request, Response } from 'express';
import { db } from '../db';
import { calculateSmsSegments } from '../utils/smsSegmentation';
import { normalizeAlgerianPhone } from '../utils/phone';
import { authenticateStaff, requireAdminRole } from '../middleware/auth';

export const smsRouter = Router();

// GET /api/sms/config - Get current SMS gateway and reminder configuration
smsRouter.get('/config', async (req: Request, res: Response) => {
  try {
    const resConfig = await db.query(`SELECT * FROM sms_config WHERE id = 'default'`);
    const config = resConfig.rows[0];
    if (!config || Object.keys(config).length === 0) {
      return res.json({
        id: 'default',
        provider_mode: 'TEST',
        active_provider: 'Ooredoo_Business_Algeria',
        api_key_configured: false,
        enable_vaccination_reminders: true,
        vaccination_intervals: '7,3,1',
        enable_appointment_reminders: true,
        appointment_interval_hours: 24,
        sending_start_hour: 8,
        sending_end_hour: 20,
        timezone: 'Africa/Algiers'
      });
    }
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch SMS config', details: err.message });
  }
});

// PUT /api/sms/config - Update SMS gateway config (Restricted to Admin)
smsRouter.put('/config', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const {
      provider_mode,
      active_provider,
      enable_vaccination_reminders,
      vaccination_intervals,
      enable_appointment_reminders,
      appointment_interval_hours,
      sending_start_hour,
      sending_end_hour
    } = req.body;

    await db.query(
      `INSERT INTO sms_config (
        id, provider_mode, active_provider, enable_vaccination_reminders,
        vaccination_intervals, enable_appointment_reminders, appointment_interval_hours,
        sending_start_hour, sending_end_hour, updated_at
      ) VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        provider_mode = EXCLUDED.provider_mode,
        active_provider = EXCLUDED.active_provider,
        enable_vaccination_reminders = EXCLUDED.enable_vaccination_reminders,
        vaccination_intervals = EXCLUDED.vaccination_intervals,
        enable_appointment_reminders = EXCLUDED.enable_appointment_reminders,
        appointment_interval_hours = EXCLUDED.appointment_interval_hours,
        sending_start_hour = EXCLUDED.sending_start_hour,
        sending_end_hour = EXCLUDED.sending_end_hour,
        updated_at = CURRENT_TIMESTAMP`,
      [
        provider_mode || 'TEST',
        active_provider || 'Ooredoo_Business_Algeria',
        enable_vaccination_reminders ?? true,
        vaccination_intervals || '7,3,1',
        enable_appointment_reminders ?? true,
        appointment_interval_hours || 24,
        sending_start_hour || 8,
        sending_end_hour || 20
      ]
    );

    res.json({ success: true, message: 'Configuration SMS mise à jour' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update SMS config', details: err.message });
  }
});

// GET /api/sms/templates - Get template library
smsRouter.get('/templates', async (req: Request, res: Response) => {
  try {
    const result = await db.query(`SELECT * FROM sms_templates ORDER BY category, title`);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch SMS templates', details: err.message });
  }
});

// POST /api/sms/templates - Create or update template (Admin only)
smsRouter.post('/templates', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { id, category, title, content, language = 'fr' } = req.body;
    const templateId = id || `tpl_${Date.now()}`;

    await db.query(
      `INSERT INTO sms_templates (id, category, title, content, language, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         language = EXCLUDED.language,
         updated_at = CURRENT_TIMESTAMP`,
      [templateId, category || 'VACCINATION', title, content, language]
    );

    res.json({ success: true, id: templateId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save template', details: err.message });
  }
});

// GET /api/sms/logs - Retrieve SMS audit history (Staff only)
smsRouter.get('/logs', authenticateStaff, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const result = await db.query(
      `SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch SMS logs', details: err.message });
  }
});

// GET /api/sms/queue - View scheduled/pending reminders (Staff only)
smsRouter.get('/queue', authenticateStaff, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT r.*, o.name as owner_name, o.phone as owner_phone, o.phone_normalized, a.name as animal_name, a.species
       FROM sms_reminders r
       LEFT JOIN owners o ON r.owner_id = o.id
       LEFT JOIN animals a ON r.animal_id = a.id
       ORDER BY r.scheduled_at ASC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch reminder queue', details: err.message });
  }
});

// POST /api/sms/calculate-segments - Live character & GSM-7 segmentation inspection
smsRouter.post('/calculate-segments', (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (typeof message !== 'string') {
      return res.status(400).json({ error: 'message string is required' });
    }
    const calculation = calculateSmsSegments(message);
    res.json(calculation);
  } catch (err: any) {
    res.status(500).json({ error: 'Segmentation calculation error', details: err.message });
  }
});

// POST /api/sms/preview - Compose preview with placeholders and recipient phone check
smsRouter.post('/preview', async (req: Request, res: Response) => {
  try {
    const { template, ownerId, animalId, appointmentId, vaccinationId, customVars = {} } = req.body;

    let ownerName = 'M./Mme Propriétaire';
    let ownerPhone = '0555555555';
    let animalName = 'Votre animal';
    let dateStr = 'JJ/MM/AAAA';
    let timeStr = '09:00';
    let vaccineName = 'Vaccin annuel';

    if (ownerId) {
      const oRes = await db.query(`SELECT name, phone, phone_normalized FROM owners WHERE id = $1`, [ownerId]);
      if (oRes.rows[0]) {
        ownerName = oRes.rows[0].name;
        ownerPhone = oRes.rows[0].phone;
      }
    }
    if (animalId) {
      const aRes = await db.query(`SELECT name FROM animals WHERE id = $1`, [animalId]);
      if (aRes.rows[0]) animalName = aRes.rows[0].name;
    }
    if (appointmentId) {
      const aptRes = await db.query(`SELECT date, start_time FROM appointments WHERE id = $1`, [appointmentId]);
      if (aptRes.rows[0]) {
        dateStr = aptRes.rows[0].date;
        timeStr = aptRes.rows[0].start_time;
      }
    }
    if (vaccinationId) {
      const vRes = await db.query(`SELECT vaccine_name, next_due_date FROM vaccinations WHERE id = $1`, [vaccinationId]);
      if (vRes.rows[0]) {
        vaccineName = vRes.rows[0].vaccine_name;
        dateStr = vRes.rows[0].next_due_date;
      }
    }

    // Merge placeholders
    let content = template || "Cabinet My Vet: Rappel pour {animal}. Rdv le {date}.";
    content = content.replace(/{proprietaire}/gi, ownerName);
    content = content.replace(/{animal}/gi, animalName);
    content = content.replace(/{date}/gi, dateStr);
    content = content.replace(/{heure}/gi, timeStr);
    content = content.replace(/{vaccin}/gi, vaccineName);
    content = content.replace(/{cabinet}/gi, 'Cabinet My Vet');
    content = content.replace(/{telephone_cabinet}/gi, '0797 63 87 04');

    const phoneInfo = normalizeAlgerianPhone(ownerPhone);
    const segmentation = calculateSmsSegments(content);

    res.json({
      renderedMessage: content,
      recipient: {
        raw: ownerPhone,
        normalized: phoneInfo.e164,
        carrier: phoneInfo.carrier,
        isValid: phoneInfo.isValid
      },
      segmentation
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Preview failed', details: err.message });
  }
});
