import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateStaff } from '../middleware/auth';

export const animalsRouter = Router();

// GET /api/animals - List animals with owner details
animalsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { species, owner_id } = req.query;
    let queryText = `
      SELECT a.*, 
        o.name as owner_name, 
        o.phone as owner_phone,
        o.phone_normalized as owner_phone_normalized,
        (
          SELECT json_build_object('vaccine_name', v.vaccine_name, 'next_due_date', v.next_due_date)
          FROM vaccinations v
          WHERE v.animal_id = a.id
          ORDER BY v.next_due_date ASC
          LIMIT 1
        ) as next_vaccination
      FROM animals a
      LEFT JOIN owners o ON o.id = a.owner_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (species && species !== 'Tous') {
      params.push(species);
      queryText += ` AND a.species = $${params.length}`;
    }

    if (owner_id) {
      params.push(owner_id);
      queryText += ` AND a.owner_id = $${params.length}`;
    }

    queryText += ` ORDER BY a.name ASC`;

    const { rows } = await db.query(queryText, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch animals', details: err.message });
  }
});

// GET /api/animals/:id - Get single animal with full medical relations
animalsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      `SELECT a.*, 
        o.name as owner_name, 
        o.phone as owner_phone,
        o.email as owner_email,
        o.address as owner_address,
        o.sms_consent as owner_sms_consent
       FROM animals a
       LEFT JOIN owners o ON o.id = a.owner_id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    const animal = rows[0];

    // Fetch vaccinations
    const vacRes = await db.query(
      `SELECT * FROM vaccinations WHERE animal_id = $1 ORDER BY next_due_date ASC`,
      [animal.id]
    );
    animal.vaccinations = vacRes.rows;

    // Fetch appointments
    const aptRes = await db.query(
      `SELECT * FROM appointments WHERE animal_id = $1 ORDER BY date DESC, start_time DESC`,
      [animal.id]
    );
    animal.appointments = aptRes.rows;

    res.json(animal);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch animal details', details: err.message });
  }
});

// POST /api/animals - Register a new animal (Staff only)
animalsRouter.post('/', authenticateStaff, async (req: Request, res: Response) => {
  try {
    const {
      name,
      species = 'Chat',
      breed = 'Européen',
      color = '—',
      gender = 'Femelle',
      birth_date = '01/01/2025',
      age = '1 an',
      weight = '4 kg',
      microchip = '—',
      owner_id,
      veterinarian = 'Dr. Martin',
      status = 'Actif',
      avatar_emoji,
      medical_notes = ''
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Le nom de l'animal est obligatoire" });
    }

    if (!owner_id) {
      return res.status(400).json({ error: 'Le propriétaire associé (owner_id) est obligatoire' });
    }

    // Verify owner exists
    const ownerCheck = await db.query(`SELECT id FROM owners WHERE id = $1`, [owner_id]);
    if (ownerCheck.rows.length === 0) {
      return res.status(400).json({ error: "Le propriétaire spécifié n'existe pas" });
    }

    const id = req.body.id || `p-${Date.now()}`;
    const emoji = avatar_emoji || (species === 'Chien' ? '🐕' : '🐱');

    const { rows } = await db.query(
      `INSERT INTO animals (
        id, name, species, breed, color, gender, birth_date, age, weight, microchip, 
        owner_id, veterinarian, status, avatar_emoji, medical_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        id, name.trim(), species, breed, color, gender, birth_date, age, weight, microchip,
        owner_id, veterinarian, status, emoji, medical_notes
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create animal', details: err.message });
  }
});

// PUT /api/animals/:id - Update animal (Staff only)
animalsRouter.put('/:id', authenticateStaff, async (req: Request, res: Response) => {
  try {
    const {
      name, species, breed, color, gender, birth_date, age, weight, microchip,
      veterinarian, status, avatar_emoji, medical_notes
    } = req.body;

    const { rows } = await db.query(
      `UPDATE animals 
       SET name = COALESCE($1, name),
           species = COALESCE($2, species),
           breed = COALESCE($3, breed),
           color = COALESCE($4, color),
           gender = COALESCE($5, gender),
           birth_date = COALESCE($6, birth_date),
           age = COALESCE($7, age),
           weight = COALESCE($8, weight),
           microchip = COALESCE($9, microchip),
           veterinarian = COALESCE($10, veterinarian),
           status = COALESCE($11, status),
           avatar_emoji = COALESCE($12, avatar_emoji),
           medical_notes = COALESCE($13, medical_notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING *`,
      [
        name, species, breed, color, gender, birth_date, age, weight, microchip,
        veterinarian, status, avatar_emoji, medical_notes, req.params.id
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update animal', details: err.message });
  }
});

// DELETE /api/animals/:id - Delete animal (Staff only)
animalsRouter.delete('/:id', authenticateStaff, async (req: Request, res: Response) => {
  try {
    const { rowCount } = await db.query(`DELETE FROM animals WHERE id = $1`, [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Animal not found' });
    }
    res.json({ success: true, message: 'Animal deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete animal', details: err.message });
  }
});
