import { Router, Request, Response } from 'express';
import { db } from '../db';
import { normalizeAlgerianPhone } from '../utils/phone';
import { authenticateStaff } from '../middleware/auth';

export const ownersRouter = Router();

// GET /api/owners - List all owners
ownersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*, 
        COUNT(a.id)::int as animals_count 
       FROM owners o
       LEFT JOIN animals a ON a.owner_id = o.id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch owners', details: err.message });
  }
});

// GET /api/owners/:id - Get owner with animals
ownersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(`SELECT * FROM owners WHERE id = $1`, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Owner not found' });
    }
    const owner = rows[0];

    // Fetch animals for this owner
    const animalsRes = await db.query(`SELECT * FROM animals WHERE owner_id = $1 ORDER BY created_at DESC`, [owner.id]);
    owner.animals = animalsRes.rows;

    res.json(owner);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch owner', details: err.message });
  }
});

// POST /api/owners - Create owner with Algerian phone normalization (Staff only)
ownersRouter.post('/', authenticateStaff, async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address, preferred_language = 'fr', sms_consent = true, notes = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom du propriétaire est obligatoire' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Le numéro de téléphone est obligatoire' });
    }

    // Validate & normalize Algerian phone number to E.164
    const phoneNorm = normalizeAlgerianPhone(phone);
    if (!phoneNorm.isValid) {
      return res.status(400).json({ error: `Numéro algérien invalide: ${phoneNorm.error}` });
    }

    const id = req.body.id || `c-${Date.now()}`;

    const { rows } = await db.query(
      `INSERT INTO owners (id, name, phone, phone_normalized, email, address, preferred_language, sms_consent, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, name.trim(), phone.trim(), phoneNorm.e164, email?.trim() || null, address?.trim() || null, preferred_language, sms_consent, notes]
    );

    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create owner', details: err.message });
  }
});

// PUT /api/owners/:id - Update owner
ownersRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address, preferred_language, sms_consent, notes } = req.body;
    let phoneNormalized: string | null = null;

    if (phone) {
      const norm = normalizeAlgerianPhone(phone);
      if (norm.isValid) phoneNormalized = norm.e164;
    }

    const { rows } = await db.query(
      `UPDATE owners 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           phone_normalized = COALESCE($3, phone_normalized),
           email = COALESCE($4, email),
           address = COALESCE($5, address),
           preferred_language = COALESCE($6, preferred_language),
           sms_consent = COALESCE($7, sms_consent),
           notes = COALESCE($8, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [name, phone, phoneNormalized, email, address, preferred_language, sms_consent, notes, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update owner', details: err.message });
  }
});

// DELETE /api/owners/:id - Delete owner
ownersRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rowCount } = await db.query(`DELETE FROM owners WHERE id = $1`, [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Owner not found' });
    }
    res.json({ success: true, message: 'Owner deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete owner', details: err.message });
  }
});
