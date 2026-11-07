-- ============================================================================
-- MYVET CABINET VÉTÉRINAIRE — POSTGRESQL RELATIONAL SCHEMA
-- Production database schema supporting multi-table relational integrity,
-- cascading constraints, and automated reminder scheduling.
-- ============================================================================

-- 1. OWNERS (Clients)
CREATE TABLE IF NOT EXISTS owners (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    phone_normalized VARCHAR(32), -- E.164: +213...
    email VARCHAR(255),
    address TEXT,
    preferred_language VARCHAR(8) DEFAULT 'fr',
    sms_consent BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_owners_phone ON owners(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_owners_name ON owners(name);

-- 2. ANIMALS (Patients)
CREATE TABLE IF NOT EXISTS animals (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(64) NOT NULL, -- 'Chat', 'Chien', 'Autre'
    breed VARCHAR(128),
    color VARCHAR(128),
    gender VARCHAR(32) DEFAULT 'Femelle', -- 'Femelle', 'Mâle'
    birth_date VARCHAR(64),
    age VARCHAR(64),
    weight VARCHAR(64),
    microchip VARCHAR(128),
    owner_id VARCHAR(64) NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    veterinarian VARCHAR(128) DEFAULT 'Dr. Martin',
    status VARCHAR(32) DEFAULT 'Actif', -- 'Actif', 'Inactif'
    avatar_emoji VARCHAR(16) DEFAULT '🐱',
    medical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_animals_owner ON animals(owner_id);
CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);

-- 3. VACCINATIONS
CREATE TABLE IF NOT EXISTS vaccinations (
    id VARCHAR(64) PRIMARY KEY,
    animal_id VARCHAR(64) NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    owner_id VARCHAR(64) NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(255) NOT NULL,
    administered_date DATE NOT NULL,
    next_due_date DATE NOT NULL,
    lot_number VARCHAR(128),
    veterinarian VARCHAR(128) NOT NULL,
    notes TEXT,
    status VARCHAR(32) DEFAULT 'Effectué', -- 'Effectué', 'À planifier', 'En retard'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vaccinations_animal ON vaccinations(animal_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_owner ON vaccinations(owner_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_next_due ON vaccinations(next_due_date);

-- 4. APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(64) PRIMARY KEY,
    animal_id VARCHAR(64) REFERENCES animals(id) ON DELETE SET NULL,
    animal_name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(64) REFERENCES owners(id) ON DELETE SET NULL,
    owner_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time VARCHAR(16) NOT NULL,
    end_time VARCHAR(16) NOT NULL,
    type VARCHAR(64) NOT NULL, -- 'Urgence', 'Consultation', 'Vaccin', 'Contrôle'
    reason TEXT NOT NULL,
    veterinarian VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Confirmé', -- 'Confirmé', 'En attente', 'Terminé', 'Annulé', 'Manqué'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_animal ON appointments(animal_id);
CREATE INDEX IF NOT EXISTS idx_appointments_owner ON appointments(owner_id);

-- 5. TEAM TASKS
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(32) NOT NULL DEFAULT 'Normale', -- 'Normale', 'Haute', 'Urgente'
    category VARCHAR(64) NOT NULL DEFAULT 'Médicale', -- 'Médicale', 'Administrative'
    assigned_to VARCHAR(128) NOT NULL,
    created_by VARCHAR(128) NOT NULL,
    due_date DATE NOT NULL,
    due_date_formatted VARCHAR(64),
    completed BOOLEAN DEFAULT FALSE,
    comments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- 6. STOCK / PHARMACY ITEMS
CREATE TABLE IF NOT EXISTS stocks (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    supplier VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 0,
    min_threshold INTEGER NOT NULL DEFAULT 5,
    unit VARCHAR(32) DEFAULT 'boîtes',
    status VARCHAR(32) DEFAULT 'Normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. SMS REMINDER QUEUE (Section 5 & 13)
CREATE TABLE IF NOT EXISTS sms_reminders (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) REFERENCES owners(id) ON DELETE CASCADE,
    animal_id VARCHAR(64) REFERENCES animals(id) ON DELETE CASCADE,
    vaccination_id VARCHAR(64) REFERENCES vaccinations(id) ON DELETE CASCADE,
    appointment_id VARCHAR(64) REFERENCES appointments(id) ON DELETE CASCADE,
    reminder_type VARCHAR(64) NOT NULL, -- 'VACCINATION_7D', 'VACCINATION_3D', 'VACCINATION_1D', 'APPOINTMENT_24H', 'CUSTOM'
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Scheduled', -- 'Scheduled', 'Processing', 'Sent', 'Delivered', 'Failed', 'Cancelled'
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    provider_id VARCHAR(64),
    provider_message_id VARCHAR(128),
    attempts INTEGER DEFAULT 0,
    locked_at TIMESTAMP WITH TIME ZONE,
    lease_expires_at TIMESTAMP WITH TIME ZONE,
    worker_id VARCHAR(128),
    failure_type VARCHAR(32), -- 'PERMANENT', 'RETRYABLE_TEMPORARY', 'MAX_ATTEMPTS'
    is_ambiguous BOOLEAN DEFAULT FALSE,
    last_error TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sms_reminders_status_scheduled ON sms_reminders(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sms_reminders_lease ON sms_reminders(status, lease_expires_at);
CREATE INDEX IF NOT EXISTS idx_sms_reminders_key ON sms_reminders(idempotency_key);

-- 8. SMS AUDIT LOGS
CREATE TABLE IF NOT EXISTS sms_logs (
    id VARCHAR(64) PRIMARY KEY,
    reminder_id VARCHAR(64),
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(64) NOT NULL,
    animal_name VARCHAR(255),
    category VARCHAR(64) NOT NULL,
    message_content TEXT NOT NULL,
    encoding VARCHAR(32) DEFAULT 'GSM-7',
    segment_count INTEGER DEFAULT 1,
    status VARCHAR(32) NOT NULL,
    provider_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON sms_logs(created_at);

-- 9. SMS TEMPLATES
CREATE TABLE IF NOT EXISTS sms_templates (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(64) NOT NULL, -- 'VACCINATION', 'APPOINTMENT'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(8) DEFAULT 'fr',
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. SMS SYSTEM CONFIGURATION
CREATE TABLE IF NOT EXISTS sms_config (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
    provider_mode VARCHAR(32) DEFAULT 'TEST', -- 'TEST', 'PRODUCTION'
    active_provider VARCHAR(128) DEFAULT 'Ooredoo_Business_Algeria',
    api_key_configured BOOLEAN DEFAULT FALSE,
    enable_vaccination_reminders BOOLEAN DEFAULT TRUE,
    vaccination_intervals VARCHAR(64) DEFAULT '7,3,1',
    enable_appointment_reminders BOOLEAN DEFAULT TRUE,
    appointment_interval_hours INTEGER DEFAULT 24,
    sending_start_hour INTEGER DEFAULT 8,
    sending_end_hour INTEGER DEFAULT 20,
    timezone VARCHAR(64) DEFAULT 'Africa/Algiers',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
