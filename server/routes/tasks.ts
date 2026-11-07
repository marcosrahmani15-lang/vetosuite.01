import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateStaff } from '../middleware/auth';

export const tasksRouter = Router();

tasksRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(`SELECT * FROM tasks ORDER BY created_at DESC`);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
});

// POST /api/tasks (Staff only)
tasksRouter.post('/', authenticateStaff, async (req: Request, res: Response) => {
  try {
    const { title, description = '', priority = 'Normale', category = 'Médicale', assigned_to, created_by = 'Dr. Vétérinaire', due_date, due_date_formatted } = req.body;
    const id = req.body.id || `task-${Date.now()}`;

    const { rows } = await db.query(
      `INSERT INTO tasks (id, title, description, priority, category, assigned_to, created_by, due_date, due_date_formatted, completed, comments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [id, title, description, priority, category, assigned_to, created_by, due_date, due_date_formatted, false, JSON.stringify([])]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
});

// PUT /api/tasks/:id (Staff only)
tasksRouter.put('/:id', authenticateStaff, async (req: Request, res: Response) => {
  try {
    const { completed, assigned_to, comments } = req.body;
    const { rows } = await db.query(
      `UPDATE tasks
       SET completed = COALESCE($1, completed),
           assigned_to = COALESCE($2, assigned_to),
           comments = COALESCE($3, comments),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [completed, assigned_to, comments ? JSON.stringify(comments) : null, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update task', details: err.message });
  }
});
