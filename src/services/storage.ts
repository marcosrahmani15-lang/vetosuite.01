import { Appointment, Task, Patient, Communication, VitalSign, MedicalConsultation, PatientDocument, PatientNote, PatientReminder, PatientTreatment, Client, StockItem } from '../types';
import { INITIAL_APPOINTMENTS, INITIAL_TASKS, INITIAL_PATIENTS, INITIAL_COMMUNICATIONS, INITIAL_CLIENTS, INITIAL_STOCK } from '../data/demoData';

const STORAGE_KEYS = {
  APPOINTMENTS: 'vetosuite_appointments',
  TASKS: 'vetosuite_tasks',
  PATIENTS: 'vetosuite_patients',
  CLIENTS: 'vetosuite_clients',
  COMMUNICATIONS: 'vetosuite_communications',
  VITALS: 'vetosuite_vitals',
  CONSULTATIONS: 'vetosuite_consultations',
  DOCUMENTS: 'vetosuite_documents',
  NOTES: 'vetosuite_notes',
  REMINDERS: 'vetosuite_reminders',
  TREATMENTS: 'vetosuite_treatments',
  STOCKS: 'vetosuite_stocks',
};

// Fixed reference date: August 14, 2026 (matches reference screenshots)
export const REFERENCE_DATE = new Date('2026-08-14T09:00:00');

function getStored<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Error loading key ${key}`, e);
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key ${key}`, e);
  }
}

export const DataService = {
  // Appointments
  getAppointments: (): Appointment[] => {
    return getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  },
  saveAppointments: (items: Appointment[]) => {
    setStored(STORAGE_KEYS.APPOINTMENTS, items);
  },
  addAppointment: (item: Omit<Appointment, 'id'>): Appointment => {
    const list = DataService.getAppointments();
    const newItem: Appointment = {
      ...item,
      id: `apt-${Date.now()}`
    };
    const updated = [...list, newItem];
    DataService.saveAppointments(updated);
    return newItem;
  },
  updateAppointment: (id: string, updates: Partial<Appointment>): Appointment | null => {
    const list = DataService.getAppointments();
    const index = list.findIndex(a => a.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates };
    DataService.saveAppointments(list);
    return list[index];
  },
  deleteAppointment: (id: string): boolean => {
    const list = DataService.getAppointments();
    const filtered = list.filter(a => a.id !== id);
    DataService.saveAppointments(filtered);
    return filtered.length !== list.length;
  },

  // Tasks
  getTasks: (): Task[] => {
    return getStored<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  },
  saveTasks: (items: Task[]) => {
    setStored(STORAGE_KEYS.TASKS, items);
  },
  addTask: (item: Omit<Task, 'id' | 'completed' | 'comments'>): Task => {
    const list = DataService.getTasks();
    const newTask: Task = {
      ...item,
      id: `task-${Date.now()}`,
      completed: false,
      comments: []
    };
    const updated = [newTask, ...list];
    DataService.saveTasks(updated);
    return newTask;
  },
  updateTask: (id: string, updates: Partial<Task>): Task | null => {
    const list = DataService.getTasks();
    const index = list.findIndex(t => t.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates };
    DataService.saveTasks(list);
    return list[index];
  },
  toggleTaskCompletion: (id: string): Task | null => {
    const list = DataService.getTasks();
    const index = list.findIndex(t => t.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], completed: !list[index].completed };
    DataService.saveTasks(list);
    return list[index];
  },
  addTaskComment: (taskId: string, text: string, author = 'Dr. Vétérinaire', avatar = 'DV'): Task | null => {
    const list = DataService.getTasks();
    const index = list.findIndex(t => t.id === taskId);
    if (index === -1) return null;
    const newComment = {
      id: `comm-${Date.now()}`,
      author,
      avatar,
      text,
      date: 'Aug 14, 2026'
    };
    list[index].comments = [...(list[index].comments || []), newComment];
    DataService.saveTasks(list);
    return list[index];
  },

  // Patients
  getPatients: (): Patient[] => {
    return getStored<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
  },
  getPatientById: (id: string): Patient | undefined => {
    const list = DataService.getPatients();
    return list.find(p => p.id === id);
  },
  savePatients: (items: Patient[]) => {
    setStored(STORAGE_KEYS.PATIENTS, items);
  },
  updatePatient: (id: string, updates: Partial<Patient>): Patient | null => {
    const list = DataService.getPatients();
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates };
    DataService.savePatients(list);
    return list[index];
  },

  // Clients
  getClients: (): Client[] => {
    return getStored<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  },

  // Communications
  getCommunications: (patientId?: string): Communication[] => {
    const list = getStored<Communication[]>(STORAGE_KEYS.COMMUNICATIONS, INITIAL_COMMUNICATIONS);
    if (patientId) return list.filter(c => c.patientId === patientId);
    return list;
  },
  addCommunication: (comm: Omit<Communication, 'id'>): Communication => {
    const list = getStored<Communication[]>(STORAGE_KEYS.COMMUNICATIONS, INITIAL_COMMUNICATIONS);
    const newItem: Communication = { ...comm, id: `comm-${Date.now()}` };
    setStored(STORAGE_KEYS.COMMUNICATIONS, [newItem, ...list]);
    return newItem;
  },

  // Vitals
  getVitals: (patientId: string): VitalSign[] => {
    const all = getStored<VitalSign[]>(STORAGE_KEYS.VITALS, []);
    return all.filter(v => v.patientId === patientId);
  },
  addVital: (vital: Omit<VitalSign, 'id'>): VitalSign => {
    const all = getStored<VitalSign[]>(STORAGE_KEYS.VITALS, []);
    const newItem: VitalSign = { ...vital, id: `vital-${Date.now()}` };
    setStored(STORAGE_KEYS.VITALS, [newItem, ...all]);
    return newItem;
  },

  // Consultations
  getConsultations: (patientId: string): MedicalConsultation[] => {
    const all = getStored<MedicalConsultation[]>(STORAGE_KEYS.CONSULTATIONS, []);
    return all.filter(c => c.patientId === patientId);
  },
  addConsultation: (cons: Omit<MedicalConsultation, 'id'>): MedicalConsultation => {
    const all = getStored<MedicalConsultation[]>(STORAGE_KEYS.CONSULTATIONS, []);
    const newItem: MedicalConsultation = { ...cons, id: `cons-${Date.now()}` };
    setStored(STORAGE_KEYS.CONSULTATIONS, [newItem, ...all]);
    return newItem;
  },

  // Documents
  getDocuments: (patientId: string): PatientDocument[] => {
    const all = getStored<PatientDocument[]>(STORAGE_KEYS.DOCUMENTS, []);
    return all.filter(d => d.patientId === patientId);
  },
  addDocument: (doc: Omit<PatientDocument, 'id'>): PatientDocument => {
    const all = getStored<PatientDocument[]>(STORAGE_KEYS.DOCUMENTS, []);
    const newItem: PatientDocument = { ...doc, id: `doc-${Date.now()}` };
    setStored(STORAGE_KEYS.DOCUMENTS, [newItem, ...all]);
    return newItem;
  },
  deleteDocument: (id: string) => {
    const all = getStored<PatientDocument[]>(STORAGE_KEYS.DOCUMENTS, []);
    setStored(STORAGE_KEYS.DOCUMENTS, all.filter(d => d.id !== id));
  },

  // Notes
  getNotes: (patientId: string): PatientNote[] => {
    const all = getStored<PatientNote[]>(STORAGE_KEYS.NOTES, []);
    return all.filter(n => n.patientId === patientId);
  },
  addNote: (note: Omit<PatientNote, 'id'>): PatientNote => {
    const all = getStored<PatientNote[]>(STORAGE_KEYS.NOTES, []);
    const newItem: PatientNote = { ...note, id: `note-${Date.now()}` };
    setStored(STORAGE_KEYS.NOTES, [newItem, ...all]);
    return newItem;
  },

  // Reminders
  getReminders: (patientId: string): PatientReminder[] => {
    const all = getStored<PatientReminder[]>(STORAGE_KEYS.REMINDERS, []);
    return all.filter(r => r.patientId === patientId);
  },
  addReminder: (rem: Omit<PatientReminder, 'id'>): PatientReminder => {
    const all = getStored<PatientReminder[]>(STORAGE_KEYS.REMINDERS, []);
    const newItem: PatientReminder = { ...rem, id: `rem-${Date.now()}` };
    setStored(STORAGE_KEYS.REMINDERS, [newItem, ...all]);
    return newItem;
  },
  toggleReminder: (id: string) => {
    const all = getStored<PatientReminder[]>(STORAGE_KEYS.REMINDERS, []);
    const item = all.find(r => r.id === id);
    if (item) {
      item.completed = !item.completed;
      setStored(STORAGE_KEYS.REMINDERS, [...all]);
    }
  },

  // Treatments
  getTreatments: (patientId: string): PatientTreatment[] => {
    const all = getStored<PatientTreatment[]>(STORAGE_KEYS.TREATMENTS, []);
    return all.filter(t => t.patientId === patientId);
  },
  addTreatment: (treatment: Omit<PatientTreatment, 'id'>): PatientTreatment => {
    const all = getStored<PatientTreatment[]>(STORAGE_KEYS.TREATMENTS, []);
    const newItem: PatientTreatment = { ...treatment, id: `treatment-${Date.now()}` };
    setStored(STORAGE_KEYS.TREATMENTS, [newItem, ...all]);
    return newItem;
  },

  // Stocks
  getStocks: (): StockItem[] => {
    return getStored<StockItem[]>(STORAGE_KEYS.STOCKS, INITIAL_STOCK);
  },
  saveStocks: (items: StockItem[]) => {
    setStored(STORAGE_KEYS.STOCKS, items);
  },
  adjustStock: (id: string, delta: number): StockItem[] => {
    const list = DataService.getStocks();
    const updated = list.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          status: (newQty <= item.minThreshold ? 'Critique' : 'Normal') as StockItem['status']
        };
      }
      return item;
    });
    DataService.saveStocks(updated);
    return updated;
  },

  // Vaccinations
  getVaccinations: async (patientId?: string): Promise<any[]> => {
    try {
      const url = patientId ? `/api/vaccinations?patientId=${patientId}` : '/api/vaccinations';
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // Local fallback
    }
    const local = getStored<any[]>('vetosuite_vaccinations', [
      {
        id: 'vac-1',
        animalId: 'nina',
        animalName: 'Nina',
        ownerId: 'c1',
        ownerName: 'Fatima Fatima',
        vaccineName: 'Vaccin annuel (Typhus-Coryza-Leucose)',
        administeredDate: '2025-08-20',
        nextDueDate: '2026-08-20',
        lotNumber: 'BIO-2025-X8',
        veterinarian: 'Dr. Martin',
        status: 'Effectué'
      }
    ]);
    return patientId ? local.filter(v => v.animalId === patientId) : local;
  },

  addVaccination: async (data: any): Promise<any> => {
    try {
      const res = await fetch('/api/vaccinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend vaccination API unavailable, saving locally', e);
    }
    const local = getStored<any[]>('vetosuite_vaccinations', []);
    const newVac = { ...data, id: `vac-${Date.now()}` };
    setStored('vetosuite_vaccinations', [newVac, ...local]);
    return newVac;
  },

  // Backend System & PostgreSQL Status
  getBackendStatus: async (): Promise<any> => {
    try {
      const res = await fetch('/api/system/status');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return {
      application: 'MyVet Veterinary Management System',
      country: 'Algeria',
      clinic: 'Cabinet Vétérinaire My Vet (Ouled Fayet)',
      database: {
        provider: 'Fallback In-Memory / Local Storage',
        connected: true,
        tables: { owners: 4, animals: 4, appointments: 6, tasks: 4, stocks: 6, smsReminders: 3, smsLogs: 4 }
      },
      scheduling: {
        mode: 'Local Dev Worker',
        cloudSchedulerEndpoint: '/api/cron/process-reminders',
        timezone: 'Africa/Algiers'
      }
    };
  },

  // One-click Safe Data Migration from LocalStorage to PostgreSQL
  migrateToPostgres: async (): Promise<any> => {
    const clients = DataService.getClients();
    const patients = DataService.getPatients();
    const appointments = DataService.getAppointments();
    const tasks = DataService.getTasks();

    try {
      const res = await fetch('/api/system/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clients, patients, appointments, tasks })
      });
      return await res.json();
    } catch (err: any) {
      return { error: 'Failed to communicate with migration endpoint', details: err.message };
    }
  },

  // SMS Gateway & Queue APIs
  getSmsConfig: async (): Promise<any> => {
    try {
      const res = await fetch('/api/sms/config');
      if (res.ok) return await res.json();
    } catch {}
    return {
      provider_mode: 'TEST',
      active_provider: 'Ooredoo_Business_Algeria',
      enable_vaccination_reminders: true,
      vaccination_intervals: '7,3,1',
      enable_appointment_reminders: true,
      appointment_interval_hours: 24,
      sending_start_hour: 8,
      sending_end_hour: 20,
      timezone: 'Africa/Algiers'
    };
  },

  saveSmsConfig: async (config: any): Promise<any> => {
    try {
      const res = await fetch('/api/sms/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true };
  },

  getSmsLogs: async (): Promise<any[]> => {
    try {
      const res = await fetch('/api/sms/logs');
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  getSmsQueue: async (): Promise<any[]> => {
    try {
      const res = await fetch('/api/sms/queue');
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  triggerProcessReminders: async (): Promise<any> => {
    try {
      const res = await fetch('/api/cron/process-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    } catch (err: any) {
      return { error: 'Scheduler endpoint failed', details: err.message };
    }
  },

  // Reset demo data
  resetDemoData: () => {
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.PATIENTS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.COMMUNICATIONS);
    localStorage.removeItem(STORAGE_KEYS.VITALS);
    localStorage.removeItem(STORAGE_KEYS.CONSULTATIONS);
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.REMINDERS);
    localStorage.removeItem(STORAGE_KEYS.TREATMENTS);
    localStorage.removeItem(STORAGE_KEYS.STOCKS);
    localStorage.removeItem('vetosuite_vaccinations');
  }
};
