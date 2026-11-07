import { Pool, PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeAlgerianPhone } from './utils/phone';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DbStatus {
  provider: 'PostgreSQL' | 'In-Memory Relational Engine';
  connected: boolean;
  databaseUrlConfigured: boolean;
  tables: Record<string, number>;
  error?: string;
}

// ----------------------------------------------------------------------------
// PostgreSQL Pool & Environment Safety
// ----------------------------------------------------------------------------
let pool: Pool | null = null;
const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';
let productionConfigError: string | null = null;

if (databaseUrl) {
  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    console.log('[MyVet DB] PostgreSQL pool configured with DATABASE_URL.');
  } catch (err: any) {
    console.error('[MyVet DB] Failed to initialize PostgreSQL pool:', err);
    pool = null;
    if (isProduction) {
      productionConfigError = `Production PostgreSQL initialization failed: ${err.message}`;
    }
  }
} else if (isProduction) {
  productionConfigError = 'FATAL: DATABASE_URL environment variable is missing in production mode. Silent fallback to temporary in-memory engine is strictly disabled to prevent patient data loss.';
  console.error(`[MyVet DB] ${productionConfigError}`);
}

const SNAPSHOT_FILE = path.resolve(__dirname, '..', '.dev_db_snapshot.json');

// ----------------------------------------------------------------------------
// In-Memory Relational Fallback (for zero-config local dev & initial testing)
// ----------------------------------------------------------------------------
interface InMemoryStore {
  owners: Map<string, any>;
  animals: Map<string, any>;
  vaccinations: Map<string, any>;
  appointments: Map<string, any>;
  tasks: Map<string, any>;
  stocks: Map<string, any>;
  sms_reminders: Map<string, any>;
  sms_logs: Map<string, any>;
  sms_templates: Map<string, any>;
  sms_config: Map<string, any>;
}

const memoryStore: InMemoryStore = {
  owners: new Map(),
  animals: new Map(),
  vaccinations: new Map(),
  appointments: new Map(),
  tasks: new Map(),
  stocks: new Map(),
  sms_reminders: new Map(),
  sms_logs: new Map(),
  sms_templates: new Map(),
  sms_config: new Map(),
};

function cloneMemoryStore(): InMemoryStore {
  return {
    owners: new Map(memoryStore.owners),
    animals: new Map(memoryStore.animals),
    vaccinations: new Map(memoryStore.vaccinations),
    appointments: new Map(memoryStore.appointments),
    tasks: new Map(memoryStore.tasks),
    stocks: new Map(memoryStore.stocks),
    sms_reminders: new Map(memoryStore.sms_reminders),
    sms_logs: new Map(memoryStore.sms_logs),
    sms_templates: new Map(memoryStore.sms_templates),
    sms_config: new Map(memoryStore.sms_config),
  };
}

function restoreMemoryStore(snapshot: InMemoryStore) {
  memoryStore.owners = new Map(snapshot.owners);
  memoryStore.animals = new Map(snapshot.animals);
  memoryStore.vaccinations = new Map(snapshot.vaccinations);
  memoryStore.appointments = new Map(snapshot.appointments);
  memoryStore.tasks = new Map(snapshot.tasks);
  memoryStore.stocks = new Map(snapshot.stocks);
  memoryStore.sms_reminders = new Map(snapshot.sms_reminders);
  memoryStore.sms_logs = new Map(snapshot.sms_logs);
  memoryStore.sms_templates = new Map(snapshot.sms_templates);
  memoryStore.sms_config = new Map(snapshot.sms_config);
}

export function saveLocalDevSnapshot() {
  if (pool || isProduction) return;
  try {
    const data = {
      owners: Array.from(memoryStore.owners.entries()),
      animals: Array.from(memoryStore.animals.entries()),
      vaccinations: Array.from(memoryStore.vaccinations.entries()),
      appointments: Array.from(memoryStore.appointments.entries()),
      tasks: Array.from(memoryStore.tasks.entries()),
      stocks: Array.from(memoryStore.stocks.entries()),
      sms_reminders: Array.from(memoryStore.sms_reminders.entries()),
      sms_logs: Array.from(memoryStore.sms_logs.entries()),
      sms_templates: Array.from(memoryStore.sms_templates.entries()),
      sms_config: Array.from(memoryStore.sms_config.entries()),
    };
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err: any) {
    // Non-blocking
  }
}

export function loadLocalDevSnapshot(): boolean {
  if (pool || isProduction) return false;
  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      const content = fs.readFileSync(SNAPSHOT_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (data.owners) memoryStore.owners = new Map(data.owners);
      if (data.animals) memoryStore.animals = new Map(data.animals);
      if (data.vaccinations) memoryStore.vaccinations = new Map(data.vaccinations);
      if (data.appointments) memoryStore.appointments = new Map(data.appointments);
      if (data.tasks) memoryStore.tasks = new Map(data.tasks);
      if (data.stocks) memoryStore.stocks = new Map(data.stocks);
      if (data.sms_reminders) memoryStore.sms_reminders = new Map(data.sms_reminders);
      if (data.sms_logs) memoryStore.sms_logs = new Map(data.sms_logs);
      if (data.sms_templates) memoryStore.sms_templates = new Map(data.sms_templates);
      if (data.sms_config) memoryStore.sms_config = new Map(data.sms_config);
      return true;
    }
  } catch (err: any) {
    // Non-blocking
  }
  return false;
}

export interface IDatabaseClient {
  query<T = any>(sqlText: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }>;
  withTransaction<T>(fn: (client: any) => Promise<T>): Promise<T>;
  getStatus(): Promise<{
    provider: string;
    connected: boolean;
    tables: Record<string, number>;
    details?: string;
  }>;
  initializeDatabase(): Promise<void>;
  init?(): Promise<void>;
}

// ----------------------------------------------------------------------------
// Database Query Interface
// ----------------------------------------------------------------------------
export const db: IDatabaseClient = {
  /**
   * Execute a SQL query against PostgreSQL if DATABASE_URL is configured,
   * or against the in-memory relational engine if DATABASE_URL is absent.
   */
  async query<T = any>(sqlText: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    if (isProduction) {
      if (productionConfigError || !pool) {
        throw new Error(productionConfigError || '[MyVet DB FATAL] Production mode requires a valid DATABASE_URL and active PostgreSQL connection. Silent fallback to memory storage is blocked.');
      }
    }

    if (pool) {
      try {
        const res = await pool.query(sqlText, params);
        return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length };
      } catch (err: any) {
        console.error('[MyVet PostgreSQL Error]:', err.message, '\nQuery:', sqlText, '\nParams:', params);
        throw err;
      }
    }

    // In-Memory query simulation for standard CRUD with local snapshot persistence
    const res = executeInMemoryQuery<T>(sqlText, params);
    if (!sqlText.trim().toUpperCase().startsWith('SELECT')) {
      saveLocalDevSnapshot();
    }
    return res;
  },

  /**
   * Run a block of queries inside a transaction
   */
  async withTransaction<T>(fn: (client: PoolClient | typeof db) => Promise<T>): Promise<T> {
    if (isProduction && (!pool || productionConfigError)) {
      throw new Error(productionConfigError || '[MyVet DB] PostgreSQL connection is required in production.');
    }

    if (pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    // In-memory transaction simulation with rollback support
    const snapshot = cloneMemoryStore();
    try {
      const result = await fn(db);
      saveLocalDevSnapshot();
      return result;
    } catch (e) {
      restoreMemoryStore(snapshot);
      throw e;
    }
  },

  /**
   * Get database connection status and table statistics
   */
  async getStatus(): Promise<DbStatus> {
    if (pool) {
      try {
        await pool.query('SELECT 1');
        const ownersCount = (await pool.query('SELECT COUNT(*) FROM owners')).rows[0]?.count || 0;
        const animalsCount = (await pool.query('SELECT COUNT(*) FROM animals')).rows[0]?.count || 0;
        const vaccinationsCount = (await pool.query('SELECT COUNT(*) FROM vaccinations')).rows[0]?.count || 0;
        const appointmentsCount = (await pool.query('SELECT COUNT(*) FROM appointments')).rows[0]?.count || 0;
        const remindersCount = (await pool.query('SELECT COUNT(*) FROM sms_reminders')).rows[0]?.count || 0;

        return {
          provider: 'PostgreSQL',
          connected: true,
          databaseUrlConfigured: true,
          tables: {
            owners: parseInt(ownersCount),
            animals: parseInt(animalsCount),
            vaccinations: parseInt(vaccinationsCount),
            appointments: parseInt(appointmentsCount),
            sms_reminders: parseInt(remindersCount),
          }
        };
      } catch (err: any) {
        return {
          provider: 'PostgreSQL',
          connected: false,
          databaseUrlConfigured: true,
          tables: {},
          error: err.message
        };
      }
    }

    return {
      provider: 'In-Memory Relational Engine',
      connected: true,
      databaseUrlConfigured: false,
      tables: {
        owners: memoryStore.owners.size,
        animals: memoryStore.animals.size,
        vaccinations: memoryStore.vaccinations.size,
        appointments: memoryStore.appointments.size,
        sms_reminders: memoryStore.sms_reminders.size,
        sms_logs: memoryStore.sms_logs.size,
      }
    };
  },

  /**
   * Initialize tables and seed initial data if empty
   */
  async initializeDatabase(): Promise<void> {
    if (pool) {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const ddl = fs.readFileSync(schemaPath, 'utf-8');
        await pool.query(ddl);
        console.log('[MyVet DB] PostgreSQL schema applied successfully.');
      }
    }

    // Seed default records if empty
    await seedInitialData();
  }
};

// ----------------------------------------------------------------------------
// Seed Initial Clinic Data (Matching Algerian Reference records)
// ----------------------------------------------------------------------------
async function seedInitialData() {
  const currentStatus = await db.getStatus();
  if (currentStatus.tables.owners && currentStatus.tables.owners > 0) {
    return; // Already seeded
  }

  console.log('[MyVet DB] Seeding initial veterinary clinic records...');

  // 1. Initial Owners (Clients)
  const owners = [
    {
      id: 'c1',
      name: 'Fatima Fatima',
      phone: '0555555555',
      email: 'fatima@example.com',
      address: 'Ouled Fayet, Alger',
      notes: 'Propriétaire fidèle'
    },
    {
      id: 'c2',
      name: 'Marc Dubois',
      phone: '0661234567',
      email: 'marc.dubois@example.com',
      address: 'Cheraga, Alger',
      notes: 'Suivi post-opératoire actif'
    },
    {
      id: 'c3',
      name: 'Sophie Lambert',
      phone: '0770987654',
      email: 'sophie.lambert@example.com',
      address: 'Dely Ibrahim, Alger',
      notes: 'Rappels vaccins prioritaires'
    },
    {
      id: 'c4',
      name: 'Thomas Laurent',
      phone: '0550112233',
      email: 'thomas.laurent@example.com',
      address: 'Zeralda, Alger',
      notes: ''
    }
  ];

  for (const o of owners) {
    const norm = normalizeAlgerianPhone(o.phone);
    if (pool) {
      await pool.query(
        `INSERT INTO owners (id, name, phone, phone_normalized, email, address, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [o.id, o.name, o.phone, norm.e164, o.email, o.address, o.notes]
      );
    } else {
      memoryStore.owners.set(o.id, {
        id: o.id,
        name: o.name,
        phone: o.phone,
        phone_normalized: norm.e164,
        email: o.email,
        address: o.address,
        preferred_language: 'fr',
        sms_consent: true,
        notes: o.notes,
        created_at: new Date()
      });
    }
  }

  // 2. Initial Animals (Patients)
  const animals = [
    {
      id: 'nina',
      name: 'Nina',
      species: 'Chat',
      breed: 'Siamois',
      color: 'Crème & Brun',
      gender: 'Femelle',
      birth_date: '02/02/2025',
      age: '1 an 6 mois',
      weight: '5 kg',
      microchip: '250269811234567',
      owner_id: 'c1',
      veterinarian: 'Dr. Martin',
      status: 'Actif',
      avatar_emoji: '🐱',
      medical_notes: 'Antécédents vaccinaux à jour'
    },
    {
      id: 'rocky',
      name: 'Rocky',
      species: 'Chien',
      breed: 'Berger Allemand',
      color: 'Noir et feu',
      gender: 'Mâle',
      birth_date: '15/03/2023',
      age: '3 ans 5 mois',
      weight: '32 kg',
      microchip: '250269811888999',
      owner_id: 'c2',
      veterinarian: 'Dr. Martin',
      status: 'Actif',
      avatar_emoji: '🐕',
      medical_notes: 'Laparotomie J+2 en convalescence'
    },
    {
      id: 'felix',
      name: 'Félix',
      species: 'Chat',
      breed: 'Européen',
      color: 'Tigré gris',
      gender: 'Mâle',
      birth_date: '10/05/2024',
      age: '2 ans 3 mois',
      weight: '4.5 kg',
      microchip: '250269811777333',
      owner_id: 'c3',
      veterinarian: 'Dr. Leroy',
      status: 'Actif',
      avatar_emoji: '🐱',
      medical_notes: 'Perfusion de réhydratation'
    },
    {
      id: 'maya',
      name: 'Maya',
      species: 'Chien',
      breed: 'Golden Retriever',
      color: 'Fauve clair',
      gender: 'Femelle',
      birth_date: '20/11/2022',
      age: '3 ans 9 mois',
      weight: '28 kg',
      microchip: '250269811555444',
      owner_id: 'c4',
      veterinarian: 'Dr. Bernard',
      status: 'Actif',
      avatar_emoji: '🐕',
      medical_notes: 'Consultation dermatologique'
    }
  ];

  for (const a of animals) {
    if (pool) {
      await pool.query(
        `INSERT INTO animals (id, name, species, breed, color, gender, birth_date, age, weight, microchip, owner_id, veterinarian, status, avatar_emoji, medical_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO NOTHING`,
        [a.id, a.name, a.species, a.breed, a.color, a.gender, a.birth_date, a.age, a.weight, a.microchip, a.owner_id, a.veterinarian, a.status, a.avatar_emoji, a.medical_notes]
      );
    } else {
      memoryStore.animals.set(a.id, { ...a, created_at: new Date() });
    }
  }

  // 3. Initial Vaccinations (Source of truth for reminders)
  const vaccinations = [
    {
      id: 'vac-1',
      animal_id: 'nina',
      owner_id: 'c1',
      vaccine_name: 'Vaccin Typhus / Coryza (RCP FeLV)',
      administered_date: '2025-08-20',
      next_due_date: '2026-08-20',
      lot_number: 'BVT-2025-88A',
      veterinarian: 'Dr. Martin',
      notes: 'Rappel annuel à effectuer',
      status: 'À planifier'
    },
    {
      id: 'vac-2',
      animal_id: 'rocky',
      owner_id: 'c2',
      vaccine_name: 'Vaccin Rage + CHPL (Rabisin / Eurican)',
      administered_date: '2025-08-18',
      next_due_date: '2026-08-18',
      lot_number: 'RAB-992-01',
      veterinarian: 'Dr. Martin',
      notes: 'Vaccination antirabique obligatoire',
      status: 'À planifier'
    },
    {
      id: 'vac-3',
      animal_id: 'felix',
      owner_id: 'c3',
      vaccine_name: 'Vaccin Leucose Féline (FeLV)',
      administered_date: '2025-08-25',
      next_due_date: '2026-08-25',
      lot_number: 'FEL-440-12',
      veterinarian: 'Dr. Leroy',
      notes: 'Surveillance sérologie préalable',
      status: 'À planifier'
    }
  ];

  for (const v of vaccinations) {
    if (pool) {
      await pool.query(
        `INSERT INTO vaccinations (id, animal_id, owner_id, vaccine_name, administered_date, next_due_date, lot_number, veterinarian, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [v.id, v.animal_id, v.owner_id, v.vaccine_name, v.administered_date, v.next_due_date, v.lot_number, v.veterinarian, v.notes, v.status]
      );
    } else {
      memoryStore.vaccinations.set(v.id, { ...v, created_at: new Date() });
    }
  }

  // 4. Initial Appointments
  const appointments = [
    {
      id: 'apt-1',
      animal_id: 'nina',
      animal_name: 'Nina',
      owner_id: 'c1',
      owner_name: 'Fatima Fatima',
      date: '2026-08-14',
      start_time: '09:00',
      end_time: '09:30',
      type: 'Vaccin',
      reason: 'Vaccination annuelle',
      veterinarian: 'Dr. Martin',
      status: 'Confirmé',
      notes: 'Vérification poids et bilan annuel'
    },
    {
      id: 'apt-2',
      animal_id: 'rocky',
      animal_name: 'Rocky',
      owner_id: 'c2',
      owner_name: 'Marc Dubois',
      date: '2026-08-14',
      start_time: '11:00',
      end_time: '11:30',
      type: 'Consultation',
      reason: 'Douleur abdominale post-op',
      veterinarian: 'Dr. Martin',
      status: 'Confirmé',
      notes: 'Contrôle pansement Box H2'
    },
    {
      id: 'apt-3',
      animal_id: 'felix',
      animal_name: 'Félix',
      owner_id: 'c3',
      owner_name: 'Sophie Lambert',
      date: '2026-08-13',
      start_time: '09:00',
      end_time: '09:30',
      type: 'Consultation',
      reason: 'Allergie',
      veterinarian: 'Dr. Leroy',
      status: 'Terminé',
      notes: 'Prurit dorsal'
    },
    {
      id: 'apt-4',
      animal_id: 'maya',
      animal_name: 'Maya',
      owner_id: 'c4',
      owner_name: 'Thomas Laurent',
      date: '2026-08-13',
      start_time: '10:00',
      end_time: '10:30',
      type: 'Vaccin',
      reason: 'Vaccin',
      veterinarian: 'Dr. Bernard',
      status: 'Confirmé',
      notes: 'Rappel CHPL'
    }
  ];

  for (const ap of appointments) {
    if (pool) {
      await pool.query(
        `INSERT INTO appointments (id, animal_id, animal_name, owner_id, owner_name, date, start_time, end_time, type, reason, veterinarian, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [ap.id, ap.animal_id, ap.animal_name, ap.owner_id, ap.owner_name, ap.date, ap.start_time, ap.end_time, ap.type, ap.reason, ap.veterinarian, ap.status, ap.notes]
      );
    } else {
      memoryStore.appointments.set(ap.id, { ...ap, created_at: new Date() });
    }
  }

  // 5. Initial SMS Templates
  const templates = [
    {
      id: 'tpl-vac-fr',
      category: 'VACCINATION',
      title: 'Rappel Vaccin — Français (Défaut)',
      content: 'Bonjour {owner_name}, nous vous rappelons que le prochain vaccin de {animal_name} ({vaccination_name}) est prévu le {vaccination_date}. Pour toute information, contactez le cabinet vétérinaire {clinic_name} au {clinic_phone}.',
      language: 'fr',
      is_default: true
    },
    {
      id: 'tpl-apt-fr',
      category: 'APPOINTMENT',
      title: 'Rappel Rendez-vous — Français (Défaut)',
      content: 'Bonjour {owner_name}, nous vous rappelons le rendez-vous de {animal_name} prévu le {appointment_date} à {appointment_time} au cabinet vétérinaire {clinic_name}. En cas d\'empêchement, merci de nous appeler au {clinic_phone}.',
      language: 'fr',
      is_default: true
    }
  ];

  for (const t of templates) {
    if (pool) {
      await pool.query(
        `INSERT INTO sms_templates (id, category, title, content, language, is_default)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [t.id, t.category, t.title, t.content, t.language, t.is_default]
      );
    } else {
      memoryStore.sms_templates.set(t.id, { ...t, created_at: new Date() });
    }
  }

  // 6. Default SMS Config
  if (pool) {
    await pool.query(
      `INSERT INTO sms_config (id, provider_mode, active_provider, api_key_configured, enable_vaccination_reminders, vaccination_intervals, enable_appointment_reminders, appointment_interval_hours, sending_start_hour, sending_end_hour, timezone)
       VALUES ('default', 'TEST', 'Ooredoo_Business_Algeria', false, true, '7,3,1', true, 24, 8, 20, 'Africa/Algiers')
       ON CONFLICT (id) DO NOTHING`
    );
  } else {
    memoryStore.sms_config.set('default', {
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

  console.log('[MyVet DB] Database seeding completed successfully.');
}

// ----------------------------------------------------------------------------
// In-Memory Relational Engine for Local Execution Without PostgreSQL
// ----------------------------------------------------------------------------
function executeInMemoryQuery<T>(sql: string, params: any[]): { rows: T[]; rowCount: number } {
  const normalized = sql.trim().toUpperCase();

  // 1. SELECT query handling
  if (normalized.startsWith('SELECT')) {
    if (normalized.includes('FROM OWNERS')) {
      let list = Array.from(memoryStore.owners.values());
      if (normalized.includes('WHERE ID = $1') && params[0]) {
        list = list.filter(o => o.id === params[0]);
      }
      return { rows: list as T[], rowCount: list.length };
    }

    if (normalized.includes('FROM ANIMALS')) {
      let list = Array.from(memoryStore.animals.values()).map(a => {
        const owner = memoryStore.owners.get(a.owner_id);
        return {
          ...a,
          owner_name: owner?.name || 'Inconnu',
          owner_phone: owner?.phone || ''
        };
      });
      if (normalized.includes('WHERE ID = $1') && params[0]) {
        list = list.filter(a => a.id === params[0]);
      } else if (normalized.includes('WHERE OWNER_ID = $1') && params[0]) {
        list = list.filter(a => a.owner_id === params[0]);
      }
      return { rows: list as T[], rowCount: list.length };
    }

    if (normalized.includes('FROM VACCINATIONS')) {
      let list = Array.from(memoryStore.vaccinations.values()).map(v => {
        const animal = memoryStore.animals.get(v.animal_id);
        const owner = memoryStore.owners.get(v.owner_id);
        return {
          ...v,
          animal_name: animal?.name || '',
          owner_name: owner?.name || '',
          owner_phone: owner?.phone || ''
        };
      });
      if (normalized.includes('WHERE ANIMAL_ID = $1') && params[0]) {
        list = list.filter(v => v.animal_id === params[0]);
      } else if (normalized.includes('WHERE OWNER_ID = $1') && params[0]) {
        list = list.filter(v => v.owner_id === params[0]);
      }
      return { rows: list as T[], rowCount: list.length };
    }

    if (normalized.includes('FROM APPOINTMENTS')) {
      let list = Array.from(memoryStore.appointments.values());
      if (normalized.includes('WHERE DATE = $1') && params[0]) {
        list = list.filter(ap => ap.date === params[0]);
      } else if (normalized.includes('WHERE ANIMAL_ID = $1') && params[0]) {
        list = list.filter(ap => ap.animal_id === params[0]);
      }
      return { rows: list as T[], rowCount: list.length };
    }

    if (normalized.includes('FROM SMS_CONFIG')) {
      const config = memoryStore.sms_config.get('default') || {};
      return { rows: [config] as T[], rowCount: 1 };
    }

    if (normalized.includes('FROM SMS_TEMPLATES')) {
      const list = Array.from(memoryStore.sms_templates.values());
      return { rows: list as T[], rowCount: list.length };
    }

    if (normalized.includes('FROM SMS_REMINDERS')) {
      let list = Array.from(memoryStore.sms_reminders.values());
      if (normalized.includes('WHERE STATUS = $1') && params[0]) {
        list = list.filter(r => r.status === params[0]);
      }
      return { rows: list as T[], rowCount: list.length };
    }

    if (normalized.includes('FROM SMS_LOGS')) {
      const list = Array.from(memoryStore.sms_logs.values());
      return { rows: list as T[], rowCount: list.length };
    }

    return { rows: [], rowCount: 0 };
  }

  // 2. INSERT query handling
  if (normalized.startsWith('INSERT INTO')) {
    if (normalized.includes('OWNERS')) {
      const item = {
        id: params[0],
        name: params[1],
        phone: params[2],
        phone_normalized: params[3],
        email: params[4],
        address: params[5],
        preferred_language: 'fr',
        sms_consent: true,
        notes: params[6],
        created_at: new Date()
      };
      memoryStore.owners.set(item.id, item);
      return { rows: [item] as T[], rowCount: 1 };
    }

    if (normalized.includes('ANIMALS')) {
      const item = {
        id: params[0],
        name: params[1],
        species: params[2],
        breed: params[3],
        color: params[4],
        gender: params[5],
        birth_date: params[6],
        age: params[7],
        weight: params[8],
        microchip: params[9],
        owner_id: params[10],
        veterinarian: params[11],
        status: params[12] || 'Actif',
        avatar_emoji: params[13] || '🐱',
        medical_notes: params[14],
        created_at: new Date()
      };
      memoryStore.animals.set(item.id, item);
      return { rows: [item] as T[], rowCount: 1 };
    }

    if (normalized.includes('VACCINATIONS')) {
      const item = {
        id: params[0],
        animal_id: params[1],
        owner_id: params[2],
        vaccine_name: params[3],
        administered_date: params[4],
        next_due_date: params[5],
        lot_number: params[6],
        veterinarian: params[7],
        notes: params[8],
        status: params[9] || 'Effectué',
        created_at: new Date()
      };
      memoryStore.vaccinations.set(item.id, item);
      return { rows: [item] as T[], rowCount: 1 };
    }

    if (normalized.includes('APPOINTMENTS')) {
      const item = {
        id: params[0],
        animal_id: params[1],
        animal_name: params[2],
        owner_id: params[3],
        owner_name: params[4],
        date: params[5],
        start_time: params[6],
        end_time: params[7],
        type: params[8],
        reason: params[9],
        veterinarian: params[10],
        status: params[11],
        notes: params[12],
        created_at: new Date()
      };
      memoryStore.appointments.set(item.id, item);
      return { rows: [item] as T[], rowCount: 1 };
    }

    if (normalized.includes('SMS_REMINDERS')) {
      const item = {
        id: params[0],
        owner_id: params[1],
        animal_id: params[2],
        vaccination_id: params[3],
        appointment_id: params[4],
        reminder_type: params[5],
        scheduled_at: params[6],
        status: params[7],
        idempotency_key: params[8],
        created_at: new Date()
      };
      memoryStore.sms_reminders.set(item.id, item);
      return { rows: [item] as T[], rowCount: 1 };
    }
  }

  // 3. UPDATE query handling
  if (normalized.startsWith('UPDATE')) {
    const now = new Date();

    if (normalized.includes('SMS_REMINDERS')) {
      // A. Atomic claim with lease duration and worker ID
      if (normalized.includes("STATUS = 'PROCESSING'") && normalized.includes('RETURNING')) {
        const workerId = params[0] || `worker_${Date.now()}`;
        const leaseDurationMs = 5 * 60 * 1000; // 5 minute lease
        const leaseExpiresAt = new Date(Date.now() + leaseDurationMs);
        const claimed: any[] = [];
        const limit = 50;

        for (const reminder of memoryStore.sms_reminders.values()) {
          const isScheduledDue = reminder.status === 'Scheduled' && new Date(reminder.scheduled_at) <= now;
          const isExpiredLease = reminder.status === 'Processing' && reminder.lease_expires_at && new Date(reminder.lease_expires_at) < now;
          const attempts = reminder.attempts || 0;

          if ((isScheduledDue || isExpiredLease) && attempts < 3) {
            reminder.status = 'Processing';
            reminder.locked_at = now.toISOString();
            reminder.lease_expires_at = leaseExpiresAt.toISOString();
            reminder.worker_id = workerId;
            reminder.attempts = attempts + 1;
            reminder.updated_at = now.toISOString();
            claimed.push({ ...reminder });
            if (claimed.length >= limit) break;
          }
        }
        return { rows: claimed as T[], rowCount: claimed.length };
      }

      // B. Update by reminder ID (status, attempts, last_error, sent_at)
      const idMatch = sqlText.match(/WHERE\s+id\s*=\s*\$(\d+)/i) || sqlText.match(/WHERE\s+id\s*=\s*'([^']+)'/i);
      let targetId = '';
      if (idMatch) {
        if (idMatch[0].includes('$')) {
          targetId = params[parseInt(idMatch[1], 10) - 1];
        } else {
          targetId = idMatch[1];
        }
      } else if (params.length > 0) {
        targetId = params[params.length - 1];
      }

      const reminder = targetId ? memoryStore.sms_reminders.get(targetId) : null;
      if (reminder) {
        if (normalized.includes("STATUS = 'SENT'") || (normalized.includes("STATUS = $1") && params[0] === 'Sent')) {
          reminder.status = 'Sent';
          reminder.sent_at = now.toISOString();
          reminder.lease_expires_at = null;
        } else if (normalized.includes("STATUS = 'CANCELLED'") || params[0] === 'Cancelled') {
          reminder.status = 'Cancelled';
          reminder.lease_expires_at = null;
        } else if (normalized.includes("STATUS = 'FAILED'") || params[0] === 'Failed') {
          reminder.status = 'Failed';
          reminder.lease_expires_at = null;
        } else if (normalized.includes("STATUS = 'UNCERTAIN_RECONCILE'") || params[0] === 'Uncertain_Reconcile') {
          reminder.status = 'Uncertain_Reconcile';
          reminder.is_ambiguous = true;
        } else if (normalized.includes("STATUS = 'SCHEDULED'") || params[0] === 'Scheduled') {
          reminder.status = 'Scheduled';
          reminder.lease_expires_at = null;
        }

        // Apply error message if present in parameters
        for (const p of params) {
          if (typeof p === 'string' && p.length > 2 && p !== targetId && p !== reminder.status) {
            reminder.last_error = p;
          }
        }
        reminder.updated_at = now.toISOString();
        return { rows: [{ ...reminder }] as T[], rowCount: 1 };
      }
    }

    if (normalized.includes('APPOINTMENTS')) {
      const id = params[params.length - 1];
      const existing = memoryStore.appointments.get(id);
      if (existing) {
        if (params.length >= 2 && typeof params[0] === 'string') {
          existing.status = params[0];
        }
        existing.updated_at = now.toISOString();
        return { rows: [{ ...existing }] as T[], rowCount: 1 };
      }
    }

    if (normalized.includes('VACCINATIONS')) {
      const id = params[params.length - 1];
      const existing = memoryStore.vaccinations.get(id);
      if (existing) {
        existing.updated_at = now.toISOString();
        return { rows: [{ ...existing }] as T[], rowCount: 1 };
      }
    }

    if (normalized.includes('ANIMALS')) {
      const id = params[params.length - 1];
      const existing = memoryStore.animals.get(id);
      if (existing) {
        existing.updated_at = now.toISOString();
        return { rows: [{ ...existing }] as T[], rowCount: 1 };
      }
    }

    return { rows: [], rowCount: 1 };
  }

  // 4. DELETE query handling
  if (normalized.startsWith('DELETE FROM')) {
    if (normalized.includes('ANIMALS') && params[0]) {
      const ok = memoryStore.animals.delete(params[0]);
      return { rows: [], rowCount: ok ? 1 : 0 };
    }
    if (normalized.includes('APPOINTMENTS') && params[0]) {
      const ok = memoryStore.appointments.delete(params[0]);
      return { rows: [], rowCount: ok ? 1 : 0 };
    }
    if (normalized.includes('VACCINATIONS') && params[0]) {
      const ok = memoryStore.vaccinations.delete(params[0]);
      return { rows: [], rowCount: ok ? 1 : 0 };
    }
  }

  return { rows: [], rowCount: 0 };
}
