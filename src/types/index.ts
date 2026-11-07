export type AppointmentType = 'Urgence' | 'Consultation' | 'Vaccin' | 'Contrôle';
export type AppointmentStatus = 'Confirmé' | 'En attente' | 'Annulé';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  clientId: string;
  clientName: string;
  date: string; // YYYY-MM-DD, e.g., '2026-08-13'
  startTime: string; // '09:00', '10:00', etc.
  endTime: string; // '09:30', '10:30', etc.
  type: AppointmentType;
  reason: string;
  veterinarian: string;
  status: AppointmentStatus;
  notes?: string;
}

export type TaskPriority = 'Normale' | 'Haute' | 'Urgente';
export type TaskCategory = 'Médicale' | 'Administrative';
export type TeamMember = 'Dr. Martin' | 'Dr. Leroy' | 'Dr. Bernard' | 'Dr. Vétérinaire';

export interface TaskComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  date: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  assignedTo: TeamMember;
  createdBy: string;
  dueDate: string; // e.g. 'Aug 12, 2026' or '2026-08-12'
  dueDateFormatted: string; // 'Aug 12, 2026'
  completed: boolean;
  comments: TaskComment[];
  relatedPatientId?: string;
  boxNumber?: string;
}

export interface MedicalAlert {
  id: string;
  type: string; // 'Antécédents' | 'Allergie'
  badge: string; // 'INFO' | 'URGENT'
  description: string; // 'Vaccin'
}

export interface Patient {
  id: string;
  name: string;
  species: 'Chat' | 'Chien' | 'Autre';
  breed: string;
  color: string;
  gender: 'Femelle' | 'Mâle';
  birthDate: string; // '02/02/2025'
  age: string; // '1 ans 6 mois'
  weight: string; // '5 kg'
  microchip: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  veterinarian: string;
  nextVisit: string;
  status: 'Actif' | 'Inactif';
  avatarEmoji?: string;
  medicalAlerts: MedicalAlert[];
}

export interface Communication {
  id: string;
  patientId: string;
  channel: 'WhatsApp' | 'SMS' | 'Email';
  date: string;
  recipient: string;
  message: string;
}

export interface VitalSign {
  id: string;
  patientId: string;
  date: string;
  weight: string;
  temperature: string;
  heartRate: string;
  notes?: string;
}

export interface MedicalConsultation {
  id: string;
  patientId: string;
  date: string;
  veterinarian: string;
  type: string;
  diagnosis: string;
  treatment: string;
  notes: string;
}

export interface PatientDocument {
  id: string;
  patientId: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
}

export interface PatientNote {
  id: string;
  patientId: string;
  date: string;
  author: string;
  content: string;
}

export interface PatientReminder {
  id: string;
  patientId: string;
  date: string;
  title: string;
  completed: boolean;
}

export interface PatientTreatment {
  id: string;
  patientId: string;
  name: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  instructions: string;
  status: 'En cours' | 'Terminé' | 'Suspendu';
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  animalsCount: number;
}

export interface StockItem {
  id: string;
  name: string;
  category: 'Vaccin' | 'Antibiotique' | 'Anti-inflammatoire' | 'Matériel' | 'Alimentation';
  supplier: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  status: 'Normal' | 'Critique' | 'Commande en cours';
}

export interface VaccinationRecord {
  id: string;
  animalId: string;
  animalName?: string;
  ownerId: string;
  ownerName?: string;
  vaccineName: string;
  administeredDate: string;
  nextDueDate: string;
  lotNumber?: string;
  veterinarian: string;
  notes?: string;
  status: 'Effectué' | 'À planifier' | 'En retard';
}

export interface SmsReminder {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerPhone?: string;
  animalId: string;
  animalName?: string;
  reminderType: string;
  scheduledAt: string;
  status: 'Scheduled' | 'Processing' | 'Sent' | 'Delivered' | 'Failed' | 'Cancelled';
  idempotencyKey: string;
  attempts?: number;
  lastError?: string;
  sentAt?: string;
}

export interface SmsLog {
  id: string;
  reminderId?: string;
  recipientName: string;
  recipientPhone: string;
  animalName: string;
  category: string;
  messageContent: string;
  encoding: string;
  segmentCount: number;
  status: string;
  providerResponse?: string;
  createdAt: string;
}

export interface SmsConfig {
  id: string;
  provider_mode: 'TEST' | 'PRODUCTION';
  active_provider: string;
  api_key_configured: boolean;
  enable_vaccination_reminders: boolean;
  vaccination_intervals: string;
  enable_appointment_reminders: boolean;
  appointment_interval_hours: number;
  sending_start_hour: number;
  sending_end_hour: number;
  timezone: string;
}

