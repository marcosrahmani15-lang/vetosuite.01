import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { ownersRouter } from './server/routes/owners';
import { animalsRouter } from './server/routes/animals';
import { vaccinationsRouter } from './server/routes/vaccinations';
import { appointmentsRouter } from './server/routes/appointments';
import { tasksRouter } from './server/routes/tasks';
import { stocksRouter } from './server/routes/stocks';
import { smsRouter } from './server/routes/sms';
import { cronRouter } from './server/routes/cron';
import { systemRouter } from './server/routes/system';
import { db } from './server/db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  // Parse JSON and URL-encoded bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/owners', ownersRouter);
  app.use('/api/animals', animalsRouter);
  app.use('/api/vaccinations', vaccinationsRouter);
  app.use('/api/appointments', appointmentsRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/stocks', stocksRouter);
  app.use('/api/sms', smsRouter);
  app.use('/api/cron', cronRouter);
  app.use('/api/system', systemRouter);

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'MyVet Cabinet Vétérinaire',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Optional local development scheduler (in-process fallback for local testing without Cloud Scheduler)
  if (process.env.ENABLE_DEV_SCHEDULER === 'true' || !isProduction) {
    console.log('[DevScheduler] Initializing local dev reminder worker (runs every 60s for local testing)...');
    setInterval(async () => {
      try {
        // Query if any reminder is due
        const due = await db.query(
          `SELECT COUNT(*) as count FROM sms_reminders WHERE status = 'Scheduled' AND scheduled_at <= CURRENT_TIMESTAMP`
        );
        const count = parseInt(due.rows[0]?.count || '0', 10);
        if (count > 0) {
          console.log(`[DevScheduler] Found ${count} due reminder(s). Simulating auto-processing...`);
          // Safely trigger cron logic internally
          await db.query(
            `UPDATE sms_reminders 
             SET status = 'Sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
             WHERE status = 'Scheduled' AND scheduled_at <= CURRENT_TIMESTAMP`
          );
        }
      } catch (err: any) {
        // Non-blocking log
        console.warn('[DevScheduler] Check error:', err.message);
      }
    }, 60000);
  }

  // Frontend Serving: Vite dev middleware in development or express.static in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted for hot-reloading development.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[Server] Serving production build from /dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`  MyVet Cabinet Vétérinaire Server running on :${PORT}`);
    console.log(`  Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`  PostgreSQL / Dual-Engine: Ready`);
    console.log(`  Cloud Scheduler: POST /api/cron/process-reminders`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup failure:', err);
  process.exit(1);
});
