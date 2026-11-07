import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateStaff } from '../middleware/auth';

export const stocksRouter = Router();

stocksRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(`SELECT * FROM stocks ORDER BY name ASC`);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch stocks', details: err.message });
  }
});

// POST /api/stocks/adjust (Staff only)
stocksRouter.post('/adjust', authenticateStaff, async (req: Request, res: Response) => {
  try {
    const { id, delta } = req.body;
    const { rows } = await db.query(
      `UPDATE stocks
       SET quantity = GREATEST(0, quantity + $1),
           status = CASE WHEN (quantity + $1) <= min_threshold THEN 'Critique' ELSE 'Normal' END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [delta, id]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to adjust stock', details: err.message });
  }
});
