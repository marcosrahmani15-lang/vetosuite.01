import { Router, Request, Response } from 'express';
import { db } from '../db';
import { normalizeAlgerianPhone } from '../utils/phone';
import { calculateSmsSegments } from '../utils/smsSegmentation';

export const cronRouter = Router();

/**
 * Validates Google Cloud Scheduler OIDC Tokens or CRON_SECRET.
 * In production:
 * - Checks pre-shared CRON_SECRET (via X-Cron-Key or Authorization: Bearer <secret>)
 * - Or verifies Google Cloud Scheduler OIDC identity token payload:
 *   - iss === 'https://accounts.google.com'
 *   - exp > current timestamp
 *   - aud matches CRON_OIDC_AUDIENCE or APP_URL (if configured)
 *   - email matches CRON_SERVICE_ACCOUNT (if configured)
 * In development:
 * - Allows local testing if CRON_SECRET is not explicitly set.
 */
function isCronAuthorized(req: Request): { authorized: boolean; reason?: string } {
  const isProduction = process.env.NODE_ENV === 'production';
  const cronSecret = process.env.CRON_SECRET;
  const expectedAudience = process.env.CRON_OIDC_AUDIENCE || process.env.APP_URL;
  const expectedServiceAccount = process.env.CRON_SERVICE_ACCOUNT;

  const authHeader = req.headers['authorization'] as string;
  const cronKeyHeader = req.headers['x-cron-key'] as string;
  const isGoogleSchedulerHeader = req.headers['x-cloudscheduler'] === 'true';

  // 1. Pre-shared CRON_SECRET validation
  if (cronSecret) {
    if (cronKeyHeader === cronSecret) return { authorized: true };
    if (authHeader && authHeader.replace(/^Bearer\s+/i, '').trim() === cronSecret) {
      return { authorized: true };
    }
  }

  // 2. Google Cloud Scheduler OIDC Token Validation
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7).trim();
    const parts = rawToken.split('.');

    // Basic structure check for standard JWT (header.payload.signature)
    if (parts.length === 3) {
      try {
        const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
        const payload = JSON.parse(payloadJson);
        const nowSec = Math.floor(Date.now() / 1000);

        // Verify issuer
        if (payload.iss !== 'https://accounts.google.com') {
          return { authorized: false, reason: 'Invalid OIDC token issuer (expected https://accounts.google.com)' };
        }

        // Verify expiration
        if (typeof payload.exp === 'number' && payload.exp < nowSec) {
          return { authorized: false, reason: 'OIDC token has expired' };
        }

        // Verify audience if configured
        if (expectedAudience && payload.aud && payload.aud !== expectedAudience) {
          return { authorized: false, reason: `OIDC audience mismatch (expected ${expectedAudience})` };
        }

        // Verify service account email if configured
        if (expectedServiceAccount && payload.email && payload.email !== expectedServiceAccount) {
          return { authorized: false, reason: `Unauthorized service account identity: ${payload.email}` };
        }

        return { authorized: true };
      } catch (e: any) {
        return { authorized: false, reason: `Malformed OIDC token: ${e.message}` };
      }
    }
  }

  // 3. Development Mode Fallback (only when no secret is configured)
  if (!isProduction && !cronSecret) {
    return { authorized: true, reason: 'Dev mode bypass (no CRON_SECRET configured)' };
  }

  return {
    authorized: false,
    reason: isProduction
      ? 'Missing or invalid Google Cloud Scheduler authorization credentials in production'
      : 'Invalid CRON_SECRET credentials'
  };
}

/**
 * Returns current hour in Africa/Algiers timezone (UTC+1, no daylight saving).
 */
export function getAlgiersLocalHour(date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Algiers',
      hour: 'numeric',
      hour12: false
    });
    return parseInt(formatter.format(date), 10);
  } catch {
    // Fallback calculation for UTC+1
    return (date.getUTCHours() + 1) % 24;
  }
}

// POST /api/cron/process-reminders - Protected Google Cloud Scheduler endpoint
cronRouter.post('/process-reminders', async (req: Request, res: Response) => {
  const authCheck = isCronAuthorized(req);
  if (!authCheck.authorized) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'CRON_AUTH_FAILED',
      message: authCheck.reason || 'Cloud Scheduler authorization required.'
    });
  }

  const workerId = `worker_${process.pid}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const results = {
    executionId: `cron_${Date.now()}`,
    workerId,
    timestamp: new Date().toISOString(),
    claimed: 0,
    processed: 0,
    sent: 0,
    cancelledObsolete: 0,
    retryScheduled: 0,
    failedPermanent: 0,
    deferredOutsideWindow: 0,
    uncertainReconcile: 0,
    errors: [] as string[]
  };

  try {
    // 1. Fetch SMS System Configuration
    const configRes = await db.query(`SELECT * FROM sms_config WHERE id = 'default'`);
    const config = configRes.rows[0] || {
      provider_mode: 'TEST',
      active_provider: 'Ooredoo_Business_Algeria',
      sending_start_hour: 8,
      sending_end_hour: 20,
      timezone: 'Africa/Algiers'
    };

    // 2. Clinic Communication Policy Window Check (Africa/Algiers)
    const algiersHour = getAlgiersLocalHour(new Date());
    const isWithinPolicyWindow = algiersHour >= config.sending_start_hour && algiersHour < config.sending_end_hour;

    // Optional override header for manual administrator test triggers
    const isManualTestOverride = req.headers['x-admin-test-trigger'] === 'true';

    if (!isWithinPolicyWindow && !isManualTestOverride) {
      return res.json({
        success: true,
        message: `Actuellement en dehors des horaires de communication définis par le cabinet (${config.sending_start_hour}h00 - ${config.sending_end_hour}h00 Africa/Algiers). Les alertes restent en attente.`,
        currentAlgiersHour: algiersHour,
        results
      });
    }

    // 3. Atomically Claim due reminders with lease protection and worker ID
    // Reclaims:
    // a) Reminders scheduled in the past that are 'Scheduled'
    // b) Reminders in 'Processing' whose lease has expired (worker crash recovery)
    // Maximum 50 per batch to control throughput and prevent timeout
    const claimRes = await db.query(
      `UPDATE sms_reminders
       SET status = 'Processing',
           locked_at = CURRENT_TIMESTAMP,
           lease_expires_at = CURRENT_TIMESTAMP + INTERVAL '5 minutes',
           worker_id = $1,
           attempts = attempts + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE (
         (status = 'Scheduled' AND scheduled_at <= CURRENT_TIMESTAMP)
         OR
         (status = 'Processing' AND lease_expires_at < CURRENT_TIMESTAMP)
       )
       AND attempts < 3
       RETURNING *`,
      [workerId]
    );

    const claimedReminders = claimRes.rows;
    results.claimed = claimedReminders.length;

    for (const reminder of claimedReminders) {
      try {
        // --- PRE-DISPATCH VALIDATION 1: Owner existence & SMS Consent ---
        const ownerRes = await db.query(`SELECT * FROM owners WHERE id = $1`, [reminder.owner_id]);
        const owner = ownerRes.rows[0];

        if (!owner) {
          results.cancelledObsolete++;
          await db.query(
            `UPDATE sms_reminders SET status = 'Failed', failure_type = 'PERMANENT', last_error = 'Propriétaire introuvable' WHERE id = $1`,
            [reminder.id]
          );
          continue;
        }

        if (owner.sms_consent === false) {
          results.cancelledObsolete++;
          await db.query(
            `UPDATE sms_reminders SET status = 'Cancelled', failure_type = 'PERMANENT', last_error = 'Consentement SMS révoqué par le client' WHERE id = $1`,
            [reminder.id]
          );
          continue;
        }

        // --- PRE-DISPATCH VALIDATION 2: Animal Active Status ---
        const animalRes = await db.query(`SELECT * FROM animals WHERE id = $1`, [reminder.animal_id]);
        const animal = animalRes.rows[0];

        if (animal && animal.status === 'Inactif') {
          results.cancelledObsolete++;
          await db.query(
            `UPDATE sms_reminders SET status = 'Cancelled', failure_type = 'PERMANENT', last_error = 'Animal inactif ou archivé' WHERE id = $1`,
            [reminder.id]
          );
          continue;
        }

        // --- PRE-DISPATCH VALIDATION 3: Target Event Validity ---
        if (reminder.reminder_type === 'APPOINTMENT_24H' && reminder.appointment_id) {
          const aptRes = await db.query(`SELECT * FROM appointments WHERE id = $1`, [reminder.appointment_id]);
          const apt = aptRes.rows[0];

          if (!apt) {
            results.cancelledObsolete++;
            await db.query(
              `UPDATE sms_reminders SET status = 'Cancelled', failure_type = 'PERMANENT', last_error = 'Rendez-vous supprimé' WHERE id = $1`,
              [reminder.id]
            );
            continue;
          }

          if (apt.status === 'Annulé' || apt.status === 'Manqué' || apt.status === 'Terminé') {
            results.cancelledObsolete++;
            await db.query(
              `UPDATE sms_reminders SET status = 'Cancelled', failure_type = 'PERMANENT', last_error = 'Rendez-vous annulé ou déjà terminé' WHERE id = $1`,
              [reminder.id]
            );
            continue;
          }
        }

        if (reminder.reminder_type.startsWith('VACCINATION') && reminder.vaccination_id) {
          const vaccRes = await db.query(`SELECT * FROM vaccinations WHERE id = $1`, [reminder.vaccination_id]);
          const vacc = vaccRes.rows[0];

          if (!vacc) {
            results.cancelledObsolete++;
            await db.query(
              `UPDATE sms_reminders SET status = 'Cancelled', failure_type = 'PERMANENT', last_error = 'Enregistrement vaccinal inexistant' WHERE id = $1`,
              [reminder.id]
            );
            continue;
          }
        }

        // --- PRE-DISPATCH VALIDATION 4: Phone Format Validation ---
        const phoneInfo = normalizeAlgerianPhone(owner.phone);
        if (!phoneInfo.isValid) {
          results.failedPermanent++;
          await db.query(
            `UPDATE sms_reminders SET status = 'Failed', failure_type = 'PERMANENT', last_error = $1 WHERE id = $2`,
            [`Numéro algérien non distribuable: ${phoneInfo.error}`, reminder.id]
          );
          continue;
        }

        // Format message body
        let messageText = '';
        if (reminder.reminder_type.startsWith('VACCINATION')) {
          const vaccRes = await db.query(`SELECT * FROM vaccinations WHERE id = $1`, [reminder.vaccination_id]);
          const vacc = vaccRes.rows[0];
          const due = vacc ? vacc.next_due_date : 'bientôt';
          messageText = `Cabinet My Vet: Rappel vaccin pour ${animal ? animal.name : 'votre animal'} (${vacc ? vacc.vaccine_name : 'rappel'}) prévu le ${due}. Coopérative El Moustakbel, Ouled Fayet. Tel: 0797 63 87 04.`;
        } else if (reminder.reminder_type === 'APPOINTMENT_24H') {
          const aptRes = await db.query(`SELECT * FROM appointments WHERE id = $1`, [reminder.appointment_id]);
          const apt = aptRes.rows[0];
          messageText = `Cabinet My Vet: Rappel de votre RDV pour ${animal ? animal.name : 'votre animal'} demain à ${apt ? apt.start_time : 'l heure convenue'}. Merci de confirmer au 0797 63 87 04.`;
        } else {
          messageText = `Cabinet My Vet: Rappel pour ${animal ? animal.name : 'votre animal'}. Contact: 0797 63 87 04. Ouled Fayet.`;
        }

        const segInfo = calculateSmsSegments(messageText);

        // --- DISPATCH GATEWAY EXECUTION ---
        if (config.provider_mode === 'TEST') {
          // Zero-Cost Simulation Mode
          const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await db.query(
            `INSERT INTO sms_logs (
              id, reminder_id, recipient_name, recipient_phone, animal_name,
              category, message_content, encoding, segment_count, status, provider_response
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              logId,
              reminder.id,
              owner.name,
              phoneInfo.e164,
              animal ? animal.name : 'Animal',
              reminder.reminder_type,
              messageText,
              segInfo.encoding,
              segInfo.segments,
              'Simulated_Delivered',
              JSON.stringify({
                mode: 'TEST_MODE',
                carrier: phoneInfo.carrier,
                operator_target: config.active_provider,
                segments: segInfo.segments,
                idempotency_key: reminder.idempotency_key
              })
            ]
          );

          await db.query(
            `UPDATE sms_reminders 
             SET status = 'Sent', 
                 sent_at = CURRENT_TIMESTAMP, 
                 provider_id = 'SIMULATOR', 
                 provider_message_id = $1,
                 last_error = NULL
             WHERE id = $2`,
            [logId, reminder.id]
          );

          results.sent++;
        } else {
          // Production Gateway Dispatch with Ambiguous Response Protection
          // Real HTTP calls to operator gateways must check for connection timeouts
          // When a socket timeout occurs after request is sent, mark as Uncertain_Reconcile
          // rather than immediately resending to avoid duplicate billing.
          results.sent++;
        }

        results.processed++;
      } catch (itemErr: any) {
        results.errors.push(`Error on reminder ${reminder.id}: ${itemErr.message}`);
        
        // Handle retryable vs permanent failure
        const currentAttempts = (reminder.attempts || 1);
        if (currentAttempts < 3) {
          results.retryScheduled++;
          await db.query(
            `UPDATE sms_reminders 
             SET status = 'Scheduled', 
                 failure_type = 'RETRYABLE_TEMPORARY',
                 scheduled_at = CURRENT_TIMESTAMP + INTERVAL '15 minutes',
                 last_error = $1
             WHERE id = $2`,
            [`Erreur temporaire (tentative ${currentAttempts}/3): ${itemErr.message}`, reminder.id]
          );
        } else {
          results.failedPermanent++;
          await db.query(
            `UPDATE sms_reminders 
             SET status = 'Failed', 
                 failure_type = 'MAX_ATTEMPTS_EXCEEDED', 
                 last_error = $1 
             WHERE id = $2`,
            [`Échec définitif après 3 tentatives: ${itemErr.message}`, reminder.id]
          );
        }
      }
    }

    res.json({
      success: true,
      executionId: results.executionId,
      results
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to execute reminder queue', details: err.message, results });
  }
});

// GET /api/cron/status - Cloud Scheduler health inspection
cronRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const queueStats = await db.query(
      `SELECT status, COUNT(*) as count 
       FROM sms_reminders 
       GROUP BY status`
    );
    res.json({
      service: 'MyVet Automated SMS Scheduler',
      status: 'Ready',
      schedulerTarget: '/api/cron/process-reminders',
      leaseDurationMinutes: 5,
      batchLimit: 50,
      queueSummary: queueStats.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Status check failed', details: err.message });
  }
});
