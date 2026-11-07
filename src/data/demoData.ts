import { Patient, Appointment, Task, Communication, Client, StockItem } from '../types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'nina',
    name: 'Nina',
    species: 'Chat',
    breed: 'Siamois',
    color: '—',
    gender: 'Femelle',
    birthDate: '02/02/2025',
    age: '1 ans 6 mois',
    weight: '5 kg',
    microchip: '—',
    ownerId: 'c1',
    ownerName: 'Fatima Fatima',
    ownerPhone: '0555555555',
    veterinarian: '—',
    nextVisit: 'Aucune visite planifiée',
    status: 'Actif',
    avatarEmoji: '🐱',
    medicalAlerts: [
      {
        id: 'a1',
        type: 'Antécédents',
        badge: 'INFO',
        description: 'Vaccin'
      }
    ]
  },
  {
    id: 'rocky',
    name: 'Rocky',
    species: 'Chien',
    breed: 'Berger Allemand',
    color: 'Noir et feu',
    gender: 'Mâle',
    birthDate: '15/04/2021',
    age: '5 ans 4 mois',
    weight: '34 kg',
    microchip: '250269608123456',
    ownerId: 'c2',
    ownerName: 'Marc Dubois',
    ownerPhone: '0612345678',
    veterinarian: 'Dr. Martin',
    nextVisit: '15/08/2026',
    status: 'Actif',
    avatarEmoji: '🐕',
    medicalAlerts: [
      {
        id: 'a2',
        type: 'Chirurgie',
        badge: 'SURVEILLANCE',
        description: 'Laparotomie exploratrice J+2'
      }
    ]
  },
  {
    id: 'felix',
    name: 'Félix',
    species: 'Chat',
    breed: 'Européen',
    color: 'Roux tigré',
    gender: 'Mâle',
    birthDate: '10/11/2023',
    age: '2 ans 9 mois',
    weight: '4.2 kg',
    microchip: '250269608999111',
    ownerId: 'c3',
    ownerName: 'Sophie Lambert',
    ownerPhone: '0678901234',
    veterinarian: 'Dr. Leroy',
    nextVisit: '22/08/2026',
    status: 'Actif',
    avatarEmoji: '🐱',
    medicalAlerts: []
  },
  {
    id: 'maya',
    name: 'Maya',
    species: 'Chien',
    breed: 'Golden Retriever',
    color: 'Fauve clair',
    gender: 'Femelle',
    birthDate: '01/06/2022',
    age: '4 ans 2 mois',
    weight: '28 kg',
    microchip: '250269608444777',
    ownerId: 'c4',
    ownerName: 'Thomas Laurent',
    ownerPhone: '0645678901',
    veterinarian: 'Dr. Bernard',
    nextVisit: 'Aucune visite planifiée',
    status: 'Actif',
    avatarEmoji: '🦮',
    medicalAlerts: [
      {
        id: 'a3',
        type: 'Allergie',
        badge: 'ATTENTION',
        description: 'Allergie aux piqûres de puces'
      }
    ]
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Fatima Fatima',
    phone: '0555555555',
    email: 'fatima@email.com',
    address: '12 Rue des Lilas, 75011 Paris',
    animalsCount: 1
  },
  {
    id: 'c2',
    name: 'Marc Dubois',
    phone: '0612345678',
    email: 'm.dubois@email.com',
    address: '45 Avenue de la République, 75011 Paris',
    animalsCount: 1
  },
  {
    id: 'c3',
    name: 'Sophie Lambert',
    phone: '0678901234',
    email: 'sophie.lambert@email.com',
    address: '8 Boulevard Voltaire, 75011 Paris',
    animalsCount: 1
  },
  {
    id: 'c4',
    name: 'Thomas Laurent',
    phone: '0645678901',
    email: 't.laurent@email.com',
    address: '19 Rue Saint-Maur, 75011 Paris',
    animalsCount: 1
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    patientId: 'rocky',
    patientName: 'Rocky',
    clientId: 'c2',
    clientName: 'Marc Dubois',
    date: '2026-08-13',
    startTime: '09:00',
    endTime: '09:30',
    type: 'Consultation',
    reason: 'Allergie',
    veterinarian: 'Dr. Martin',
    status: 'En attente',
    notes: 'Prurit intense depuis 3 jours'
  },
  {
    id: 'apt-2',
    patientId: 'felix',
    patientName: 'Félix',
    clientId: 'c3',
    clientName: 'Sophie Lambert',
    date: '2026-08-13',
    startTime: '10:00',
    endTime: '10:30',
    type: 'Vaccin',
    reason: 'Vaccin',
    veterinarian: 'Dr. Leroy',
    status: 'En attente',
    notes: 'Rappel Typhus Coryza'
  },
  {
    id: 'apt-3',
    patientId: 'nina',
    patientName: 'Nina',
    clientId: 'c1',
    clientName: 'Fatima Fatima',
    date: '2026-08-14',
    startTime: '09:00',
    endTime: '09:30',
    type: 'Vaccin',
    reason: 'Vaccination annuelle...',
    veterinarian: 'Dr. Vétérinaire',
    status: 'Confirmé',
    notes: 'Rappel annuel de vaccin'
  },
  {
    id: 'apt-4',
    patientId: 'nina',
    patientName: 'Nina',
    clientId: 'c1',
    clientName: 'Fatima Fatima',
    date: '2026-08-14',
    startTime: '11:00',
    endTime: '11:30',
    type: 'Consultation',
    reason: 'Douleur abdominale...',
    veterinarian: 'Dr. Martin',
    status: 'Confirmé',
    notes: 'Vérification suite vomissements matinaux'
  },
  {
    id: 'apt-5',
    patientId: 'maya',
    patientName: 'Maya',
    clientId: 'c4',
    clientName: 'Thomas Laurent',
    date: '2026-08-14',
    startTime: '15:00',
    endTime: '15:30',
    type: 'Contrôle',
    reason: 'Contrôle dermatologique',
    veterinarian: 'Dr. Bernard',
    status: 'En attente',
    notes: 'Évolution du traitement antiparasitaire'
  },
  {
    id: 'apt-6',
    patientId: 'rocky',
    patientName: 'Rocky',
    clientId: 'c2',
    clientName: 'Marc Dubois',
    date: '2026-08-11',
    startTime: '14:00',
    endTime: '14:30',
    type: 'Contrôle',
    reason: 'Bilan pré-opératoire',
    veterinarian: 'Dr. Martin',
    status: 'Confirmé',
    notes: 'Bilan sanguin complet'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Commande vaccins rage',
    description: 'Stock critique — passer commande BioVet (min. 10 doses).',
    priority: 'Urgente',
    category: 'Administrative',
    assignedTo: 'Dr. Bernard',
    createdBy: 'Dr. Martin',
    dueDate: '2026-08-12',
    dueDateFormatted: 'Aug 12, 2026',
    completed: false,
    comments: []
  },
  {
    id: 'task-2',
    title: 'Pansement Rocky — Box H2',
    description: "Changer le pansement abdominal et noter l'état de la cicatrisation.",
    priority: 'Haute',
    category: 'Médicale',
    assignedTo: 'Dr. Martin',
    createdBy: 'Dr. Leroy',
    dueDate: '2026-08-13',
    dueDateFormatted: 'Aug 13, 2026',
    completed: false,
    boxNumber: 'Box H2',
    relatedPatientId: 'rocky',
    comments: [
      {
        id: 'c-1',
        author: 'Dr. Martin',
        avatar: 'DM',
        text: 'Pansement vérifié ce matin à 10h, plaie nette sans exsudat.',
        date: 'Aug 13, 2026'
      }
    ]
  },
  {
    id: 'task-3',
    title: 'Contrôle post-op Rocky',
    description: "Vérifier la température et l'appétit post-intervention.",
    priority: 'Normale',
    category: 'Médicale',
    assignedTo: 'Dr. Martin',
    createdBy: 'Dr. Leroy',
    dueDate: '2026-08-15',
    dueDateFormatted: 'Aug 15, 2026',
    completed: false,
    relatedPatientId: 'rocky',
    comments: []
  },
  {
    id: 'task-4',
    title: 'Mise à jour dossiers anesthésie',
    description: "Numériser et archiver les fiches d'anesthésie de la semaine écoulée.",
    priority: 'Normale',
    category: 'Administrative',
    assignedTo: 'Dr. Leroy',
    createdBy: 'Dr. Bernard',
    dueDate: '2026-08-16',
    dueDateFormatted: 'Aug 16, 2026',
    completed: false,
    comments: []
  }
];

export const INITIAL_COMMUNICATIONS: Communication[] = [
  {
    id: 'comm-1',
    patientId: 'nina',
    channel: 'WhatsApp',
    date: '13/08/2026',
    recipient: 'Fatima Fatima',
    message: 'Bonjour Fatima Fatima, rappel de votre rendez-vous pour Nina. Merci de confirmer votre présence....'
  }
];

export const INITIAL_STOCK: StockItem[] = [
  {
    id: '1',
    name: 'Vaccin Rage (Rabisin)',
    category: 'Vaccin',
    supplier: 'BioVet Distribution',
    quantity: 2,
    minThreshold: 10,
    unit: 'doses',
    status: 'Critique'
  },
  {
    id: '2',
    name: 'Amoxicilline + Acide Clavulanique (Synulox 250mg)',
    category: 'Antibiotique',
    supplier: 'Zoetis France',
    quantity: 18,
    minThreshold: 8,
    unit: 'boîtes',
    status: 'Normal'
  },
  {
    id: '3',
    name: 'Meloxicam 1.5mg/ml (Metacam Chien)',
    category: 'Anti-inflammatoire',
    supplier: 'Boehringer Ingelheim',
    quantity: 5,
    minThreshold: 5,
    unit: 'flacons',
    status: 'Normal'
  },
  {
    id: '4',
    name: 'Fil de suture résorbable Vicryl 3-0',
    category: 'Matériel',
    supplier: 'Ethicon Vétérinaire',
    quantity: 12,
    minThreshold: 6,
    unit: 'boîtes',
    status: 'Normal'
  },
  {
    id: '5',
    name: 'Croquettes Gastrointestinal Chat 4kg',
    category: 'Alimentation',
    supplier: 'Royal Canin Vétérinaire',
    quantity: 3,
    minThreshold: 6,
    unit: 'sacs',
    status: 'Critique'
  }
];
