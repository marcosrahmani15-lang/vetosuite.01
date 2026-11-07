import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Printer,
  Trash2,
  User,
  Phone,
  Info,
  Calendar,
  FileText,
  StickyNote,
  Bell,
  Pill,
  Activity,
  Stethoscope,
  MessageSquare,
  Plus,
  Filter,
  CheckCircle2,
  ChevronDown,
  Clock
} from 'lucide-react';
import { DataService } from '../services/storage';
import { Patient, Appointment, Communication, VitalSign, MedicalConsultation, PatientDocument, PatientNote, PatientReminder, PatientTreatment } from '../types';
import { Modal } from '../components/common/Modal';
import { PrescriptionModal } from '../components/common/PrescriptionModal';
import { formatAlgerianPhone } from '../utils/phoneUtils';

export const PatientDetailsPage: React.FC = () => {
  const { id = 'nina' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | undefined>(() => DataService.getPatientById(id));
  const [activeTab, setActiveTab] = useState<'historique' | 'rdv' | 'documents' | 'notes' | 'rappels' | 'traitements'>('historique');

  // Sub-data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [consultations, setConsultations] = useState<MedicalConsultation[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [reminders, setReminders] = useState<PatientReminder[]>([]);
  const [treatments, setTreatments] = useState<PatientTreatment[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [newActionType, setNewActionType] = useState<string | null>(null);

  // Form states
  const [consultationForm, setConsultationForm] = useState({
    type: 'Consultation générale',
    diagnosis: '',
    treatment: '',
    notes: '',
    veterinarian: 'Dr. Martin'
  });
  const [vitalForm, setVitalForm] = useState({ weight: '5 kg', temperature: '38.5 °C', heartRate: '140 bpm' });
  const [noteForm, setNoteForm] = useState('');
  const [reminderForm, setReminderForm] = useState({ title: '', date: '2026-08-20' });
  const [treatmentForm, setTreatmentForm] = useState({
    name: 'Antiparasitaire',
    medication: 'Milbemax',
    dosage: '1 comprimé',
    frequency: 'Tous les 3 mois',
    startDate: '2026-08-14',
    endDate: '2026-11-14',
    instructions: 'À administrer pendant le repas'
  });
  const [vaccineForm, setVaccineForm] = useState({
    vaccineName: 'Vaccin annuel (Rage + Typhus)',
    administeredDate: '2026-08-14',
    nextDueDate: '2027-08-14',
    lotNumber: 'BIO-2026-ALG',
    veterinarian: 'Dr. Martin'
  });

  const loadData = () => {
    const currentPatient = DataService.getPatientById(id);
    setPatient(currentPatient);
    if (currentPatient) {
      const allApts = DataService.getAppointments();
      setAppointments(allApts.filter(a => a.patientId === currentPatient.id));
      setCommunications(DataService.getCommunications(currentPatient.id));
      setVitals(DataService.getVitals(currentPatient.id));
      setConsultations(DataService.getConsultations(currentPatient.id));
      setDocuments(DataService.getDocuments(currentPatient.id));
      setNotes(DataService.getNotes(currentPatient.id));
      setReminders(DataService.getReminders(currentPatient.id));
      setTreatments(DataService.getTreatments(currentPatient.id));
      DataService.getVaccinations(currentPatient.id).then(v => setVaccinations(v));
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!patient) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-[#1B2F1C]">Patient non trouvé</h2>
        <button
          onClick={() => navigate('/patients')}
          className="text-[#3A683D] font-semibold flex items-center gap-2 mx-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux fiches patients
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = () => {
    if (window.confirm(`Confirmer la suppression définitive du dossier de ${patient.name} ?`)) {
      const allPatients = DataService.getPatients().filter(p => p.id !== patient.id);
      DataService.savePatients(allPatients);
      navigate('/patients');
    }
  };

  const handleAddConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.addConsultation({
      patientId: patient.id,
      date: '14/08/2026',
      veterinarian: consultationForm.veterinarian,
      type: consultationForm.type,
      diagnosis: consultationForm.diagnosis,
      treatment: consultationForm.treatment,
      notes: consultationForm.notes
    });
    setNewActionType(null);
    loadData();
  };

  const handleAddVitals = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.addVital({
      patientId: patient.id,
      date: '14/08/2026',
      weight: vitalForm.weight,
      temperature: vitalForm.temperature,
      heartRate: vitalForm.heartRate
    });
    setNewActionType(null);
    loadData();
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.trim()) return;
    DataService.addNote({
      patientId: patient.id,
      date: '14/08/2026',
      author: 'Dr. Vétérinaire',
      content: noteForm
    });
    setNoteForm('');
    setNewActionType(null);
    loadData();
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderForm.title) return;
    DataService.addReminder({
      patientId: patient.id,
      title: reminderForm.title,
      date: reminderForm.date,
      completed: false
    });
    setReminderForm({ title: '', date: '2026-08-20' });
    setNewActionType(null);
    loadData();
  };

  const handleAddTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.addTreatment({
      patientId: patient.id,
      name: treatmentForm.name,
      medication: treatmentForm.medication,
      dosage: treatmentForm.dosage,
      frequency: treatmentForm.frequency,
      startDate: treatmentForm.startDate,
      endDate: treatmentForm.endDate,
      instructions: treatmentForm.instructions,
      status: 'En cours'
    });
    setNewActionType(null);
    loadData();
  };

  const handleAddVaccine = async (e: React.FormEvent) => {
    e.preventDefault();
    await DataService.addVaccination({
      animalId: patient.id,
      ownerId: patient.ownerId || 'c1',
      vaccineName: vaccineForm.vaccineName,
      administeredDate: vaccineForm.administeredDate,
      nextDueDate: vaccineForm.nextDueDate,
      lotNumber: vaccineForm.lotNumber,
      veterinarian: vaccineForm.veterinarian,
      status: 'Effectué'
    });
    setNewActionType(null);
    loadData();
  };

  const handleUpdatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.updatePatient(patient.id, patient);
    setIsEditModalOpen(false);
    loadData();
  };

  const openWhatsApp = () => {
    const cleanPhone = patient.ownerPhone.replace(/\D/g, '');
    const message = encodeURIComponent(`Bonjour ${patient.ownerName}, concernant votre animal ${patient.name} au Cabinet Vétérinaire My Vet : `);
    window.open(`https://wa.me/213${cleanPhone.replace(/^0/, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="p-6 lg:p-8 w-full max-w-[1240px] mx-auto space-y-6">
      {/* Back to List Button */}
      <div>
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#C7D2BA] text-[#1B2F1C] text-[13px] font-semibold rounded-lg hover:bg-[#F8F8F1] transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#52604C]" />
          <span>Retour à la liste</span>
        </button>
      </div>

      {/* Main Patient Profile Information Card */}
      <div className="bg-white rounded-2xl border border-[#C7D2BA] p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Zone A: Animal Avatar & Action Buttons */}
          <div className="flex flex-col items-center shrink-0 w-full lg:w-auto">
            {/* Square avatar container with soft botanical/peach tint */}
            <div className="w-32 h-32 rounded-2xl bg-[#E7ECD9]/60 border border-[#C7D2BA] flex items-center justify-center text-5xl shadow-2xs select-none">
              <span role="img" aria-label={patient.species}>
                {patient.avatarEmoji || (patient.species === 'Chien' ? '🐶' : '🐱')}
              </span>
            </div>

            {/* Action Buttons below avatar */}
            <div className="flex items-center flex-wrap justify-center gap-2 mt-4">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#C7D2BA] text-[#1B2F1C] text-[12.5px] font-medium rounded-xl hover:bg-[#F8F8F1] transition-colors shadow-2xs cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-[#52604C]" />
                <span>Modifier</span>
              </button>

              <button
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E7ECD9] border border-[#C7D2BA] text-[#1B2F1C] text-[12.5px] font-semibold rounded-xl hover:bg-[#DCE3CB] transition-colors shadow-2xs cursor-pointer"
                title="Rédiger une ordonnance pour ce patient"
              >
                <FileText className="w-3.5 h-3.5 text-[#3A683D]" />
                <span>Ordonnance</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#C7D2BA] text-[#1B2F1C] text-[12.5px] font-medium rounded-xl hover:bg-[#F8F8F1] transition-colors shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#52604C]" />
                <span>Imprimer</span>
              </button>

              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#FECDD3] text-[#DC2626] text-[12.5px] font-medium rounded-xl hover:bg-[#FEF2F2] transition-colors shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>

          {/* Zone B: Main Animal Info & 9-cell detail grid */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* Header row: Name + Badges */}
            <div className="flex items-center flex-wrap gap-2.5">
              <h1 className="text-[26px] font-bold text-[#1B2F1C] tracking-tight">
                {patient.name}
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[11.5px] font-semibold bg-[#E7ECD9] text-[#3A683D] border border-[#C7D2BA]">
                {patient.status}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11.5px] font-semibold bg-[#E7ECD9]/50 text-[#5A7E32]">
                {patient.species}
              </span>
            </div>

            {/* Owner & Contact Row */}
            <div className="flex items-center flex-wrap gap-3 text-[13px] text-[#52604C]">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#859766]" />
                <span className="font-medium text-[#1B2F1C]">{patient.ownerName}</span>
              </div>
              <span className="text-[#C7D2BA]">·</span>
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#859766]" />
                <span className="font-medium text-[#1B2F1C]">{formatAlgerianPhone(patient.ownerPhone).national}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  formatAlgerianPhone(patient.ownerPhone).carrier === 'Ooredoo' ? 'bg-[#ED1C24]/10 text-[#ED1C24]' :
                  formatAlgerianPhone(patient.ownerPhone).carrier === 'Mobilis' ? 'bg-[#008542]/10 text-[#008542]' :
                  formatAlgerianPhone(patient.ownerPhone).carrier === 'Djezzy' ? 'bg-[#E30613]/10 text-[#E30613]' :
                  'bg-[#E7ECD9] text-[#52604C]'
                }`}>
                  {formatAlgerianPhone(patient.ownerPhone).carrier}
                </span>
              </div>

              {/* Real WhatsApp link button */}
              <button
                onClick={openWhatsApp}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#22C55E] hover:bg-[#16A34A] text-white text-[11.5px] font-semibold rounded-md transition-colors shadow-2xs cursor-pointer"
              >
                <span>WhatsApp</span>
              </button>
            </div>

            {/* 9-Cell Animal Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 pt-2">
              <div>
                <span className="block text-[11px] font-bold text-[#859766] tracking-wider uppercase">
                  RACE
                </span>
                <span className="text-[13.5px] font-bold text-[#1B2F1C]">
                  {patient.breed || '—'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-[#859766] tracking-wider uppercase">
                  COULEUR
                </span>
                <span className="text-[13.5px] font-bold text-[#1B2F1C]">
                  {patient.color || '—'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-[#859766] tracking-wider uppercase">
                  SEXE
                </span>
                <span className="text-[13.5px] font-bold text-[#1B2F1C]">
                  {patient.gender || '—'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-[#859766] tracking-wider uppercase">
                  ÂGE
                </span>
                <span className="text-[13.5px] font-bold text-[#1B2F1C]">
                  {patient.age || '—'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-[#859766] tracking-wider uppercase">
                  NÉ LE
                </span>
                <span className="text-[13.5px] font-bold text-[#1B2F1C]">
                  {patient.birthDate || '—'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-[#859766] tracking-wider uppercase">
                  POIDS
                </span>
                <span className="text-[13.5px] font-bold text-[#1B2F1C]">
                  {patient.weight || '—'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-[#859766] tracking-wider uppercase">
                  PUCE
                </span>
                <span className="text-[13.5px] font-bold text-[#1B2F1C]">
                  {patient.microchip || '—'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-[#859766] tracking-wider uppercase">
                  PROCHAINE VISITE
                </span>
                <span className="text-[13.5px] font-bold text-[#1B2F1C] truncate block max-w-[170px]" title={patient.nextVisit}>
                  {patient.nextVisit || 'Aucune visite planifiée'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-[#859766] tracking-wider uppercase">
                  VÉTÉRINAIRE RÉFÉRENT
                </span>
                <span className="text-[13.5px] font-bold text-[#1B2F1C]">
                  {patient.veterinarian || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Zone C: Alertes Médicales (Right Side) */}
          <div className="w-full lg:w-[280px] shrink-0 lg:border-l lg:border-[#C7D2BA] lg:pl-6 space-y-2.5">
            <span className="block text-[11.5px] font-bold text-[#52604C] tracking-wider uppercase">
              ALERTES MÉDICALES
            </span>

            {/* Soft sage alert card */}
            <div className="bg-[#E7ECD9]/70 border border-[#C7D2BA] rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#3A683D] shrink-0" />
                <span className="text-[13px] font-bold text-[#1B2F1C]">Antécédents</span>
                <span className="px-1.5 py-0.2 bg-[#3A683D] text-white text-[10px] font-bold rounded">
                  INFO
                </span>
              </div>
              <p className="text-[13px] font-semibold text-[#3A683D] pl-5">
                Vaccin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Tabs & Medical History Section */}
      <div className="bg-white rounded-2xl border border-[#C7D2BA] shadow-2xs overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex items-center border-b border-[#C7D2BA] px-4 overflow-x-auto select-none bg-white">
          <button
            onClick={() => setActiveTab('historique')}
            className={`flex items-center gap-2 px-4 py-3.5 text-[13.5px] font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'historique'
                ? 'text-[#3A683D] border-[#3A683D] bg-[#E7ECD9]/40'
                : 'text-[#52604C] border-transparent hover:text-[#1B2F1C]'
            }`}
          >
            <Stethoscope className={`w-4 h-4 ${activeTab === 'historique' ? 'text-[#3A683D]' : 'text-[#859766]'}`} />
            <span>Historique</span>
          </button>

          <button
            onClick={() => setActiveTab('rdv')}
            className={`flex items-center gap-2 px-4 py-3.5 text-[13.5px] font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'rdv'
                ? 'text-[#3A683D] border-[#3A683D] bg-[#E7ECD9]/40'
                : 'text-[#52604C] border-transparent hover:text-[#1B2F1C]'
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeTab === 'rdv' ? 'text-[#3A683D]' : 'text-[#859766]'}`} />
            <span>Rendez-vous</span>
            <span className="px-1.5 py-0.5 text-[11px] font-bold bg-[#E7ECD9] text-[#1B2F1C] rounded-full">
              {appointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-4 py-3.5 text-[13.5px] font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'documents'
                ? 'text-[#3A683D] border-[#3A683D] bg-[#E7ECD9]/40'
                : 'text-[#52604C] border-transparent hover:text-[#1B2F1C]'
            }`}
          >
            <FileText className={`w-4 h-4 ${activeTab === 'documents' ? 'text-[#3A683D]' : 'text-[#859766]'}`} />
            <span>Documents</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-3.5 text-[13.5px] font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'notes'
                ? 'text-[#3A683D] border-[#3A683D] bg-[#E7ECD9]/40'
                : 'text-[#52604C] border-transparent hover:text-[#1B2F1C]'
            }`}
          >
            <StickyNote className={`w-4 h-4 ${activeTab === 'notes' ? 'text-[#3A683D]' : 'text-[#859766]'}`} />
            <span>Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('rappels')}
            className={`flex items-center gap-2 px-4 py-3.5 text-[13.5px] font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'rappels'
                ? 'text-[#3A683D] border-[#3A683D] bg-[#E7ECD9]/40'
                : 'text-[#52604C] border-transparent hover:text-[#1B2F1C]'
            }`}
          >
            <Bell className={`w-4 h-4 ${activeTab === 'rappels' ? 'text-[#3A683D]' : 'text-[#859766]'}`} />
            <span>Rappels</span>
          </button>

          <button
            onClick={() => setActiveTab('traitements')}
            className={`flex items-center gap-2 px-4 py-3.5 text-[13.5px] font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'traitements'
                ? 'text-[#3A683D] border-[#3A683D] bg-[#E7ECD9]/40'
                : 'text-[#52604C] border-transparent hover:text-[#1B2F1C]'
            }`}
          >
            <Pill className={`w-4 h-4 ${activeTab === 'traitements' ? 'text-[#3A683D]' : 'text-[#859766]'}`} />
            <span>Traitements</span>
          </button>
        </div>

        {/* Tab 1: Historique View */}
        {activeTab === 'historique' && (
          <div className="p-6 space-y-6">
            {/* Historique Header & Right Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-[18px] font-bold text-[#1B2F1C]">
                Historique médical
              </h2>

              <div className="flex items-center gap-2.5">
                {/* Filter dropdown */}
                <button className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#C7D2BA] text-[#1B2F1C] text-[13px] font-semibold rounded-xl hover:bg-[#F8F8F1] transition-colors shadow-2xs cursor-pointer">
                  <Filter className="w-3.5 h-3.5 text-[#52604C]" />
                  <span>Tout afficher</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#52604C]" />
                </button>

                {/* Green "+ Ajouter" dropdown button */}
                <div className="relative">
                  <button
                    onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#3A683D] hover:bg-[#2F5933] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                    <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                  </button>

                  {isAddMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-[#C7D2BA] rounded-xl shadow-xl z-20 py-1">
                      <button
                        onClick={() => { setIsAddMenuOpen(false); setNewActionType('consultation'); }}
                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-[#F8F8F1] text-[#1B2F1C] flex items-center gap-2 cursor-pointer"
                      >
                        <Stethoscope className="w-4 h-4 text-[#3A683D]" />
                        <span>Nouvelle consultation</span>
                      </button>
                      <button
                        onClick={() => { setIsAddMenuOpen(false); setIsPrescriptionModalOpen(true); }}
                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-[#F8F8F1] text-[#1B2F1C] flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <FileText className="w-4 h-4 text-[#3A683D]" />
                        <span>Ordonnance officielle</span>
                      </button>
                      <button
                        onClick={() => { setIsAddMenuOpen(false); setNewActionType('vitals'); }}
                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-[#F8F8F1] text-[#1B2F1C] flex items-center gap-2 cursor-pointer"
                      >
                        <Activity className="w-4 h-4 text-[#3A683D]" />
                        <span>Signes vitaux</span>
                      </button>
                      <button
                        onClick={() => { setIsAddMenuOpen(false); setNewActionType('note'); }}
                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-[#F8F8F1] text-[#1B2F1C] flex items-center gap-2 cursor-pointer"
                      >
                        <StickyNote className="w-4 h-4 text-[#3A683D]" />
                        <span>Ajouter une note</span>
                      </button>
                      <button
                        onClick={() => { setIsAddMenuOpen(false); setNewActionType('reminder'); }}
                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-[#F8F8F1] text-[#1B2F1C] flex items-center gap-2 cursor-pointer"
                      >
                        <Bell className="w-4 h-4 text-[#3A683D]" />
                        <span>Créer un rappel</span>
                      </button>
                      <button
                        onClick={() => { setIsAddMenuOpen(false); setNewActionType('treatment'); }}
                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-[#F8F8F1] text-[#1B2F1C] flex items-center gap-2 cursor-pointer"
                      >
                        <Pill className="w-4 h-4 text-[#3A683D]" />
                        <span>Ajouter un traitement</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3 Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Signes vitaux */}
              <div className="bg-white border border-[#C7D2BA] rounded-xl p-4 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#3A683D]" />
                  <span className="text-[14px] font-bold text-[#1B2F1C]">Signes vitaux</span>
                </div>
                {vitals.length > 0 ? (
                  <div className="space-y-1 text-[13px]">
                    <div className="text-[#1B2F1C] font-medium">Poids : {vitals[0].weight}</div>
                    <div className="text-[#1B2F1C] font-medium">Température : {vitals[0].temperature}</div>
                    <div className="text-[11px] text-[#859766]">{vitals[0].date}</div>
                  </div>
                ) : (
                  <p className="text-[13px] text-[#52604C]">
                    Aucune mesure enregistrée
                  </p>
                )}
              </div>

              {/* Card 2: Historique de visite */}
              <div className="bg-white border border-[#C7D2BA] rounded-xl p-4 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#3A683D]" />
                  <span className="text-[14px] font-bold text-[#1B2F1C]">Historique de visite</span>
                </div>
                {consultations.length > 0 ? (
                  <div className="space-y-1 text-[13px]">
                    <div className="font-semibold text-[#1B2F1C]">{consultations[0].type}</div>
                    <div className="text-[12px] text-[#52604C]">{consultations[0].diagnosis}</div>
                    <div className="text-[11px] text-[#859766]">{consultations[0].date}</div>
                  </div>
                ) : (
                  <p className="text-[13px] text-[#52604C]">
                    Aucune consultation enregistrée
                  </p>
                )}
              </div>

              {/* Card 3: Communications */}
              <div className="bg-white border border-[#C7D2BA] rounded-xl p-4 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#3A683D]" />
                  <span className="text-[14px] font-bold text-[#1B2F1C]">Communications</span>
                </div>
                {/* Communication card inside */}
                <div className="bg-[#F8F8F1] border border-[#C7D2BA] rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#16A34A]">
                      <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                      <span>WhatsApp</span>
                    </div>
                    <span className="text-[11px] text-[#859766]">13/08/2026</span>
                  </div>
                  <p className="text-[12px] text-[#52604C] leading-relaxed line-clamp-3">
                    Bonjour Fatima Fatima, rappel de votre rendez-vous pour Nina. Merci de confirmer votre présence....
                  </p>
                </div>
              </div>
            </div>

            {/* Medical History Empty State or Consultation List */}
            {consultations.length === 0 ? (
              <div className="border border-[#C7D2BA] rounded-2xl p-12 text-center bg-white space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#E7ECD9] text-[#3A683D] flex items-center justify-center mx-auto">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <h3 className="text-[16px] font-bold text-[#1B2F1C]">
                  Aucune consultation enregistrée
                </h3>
                <p className="text-[13.5px] text-[#52604C] max-w-md mx-auto">
                  Créez la première consultation pour commencer l'historique médical.
                </p>
                <button
                  onClick={() => setNewActionType('consultation')}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#3A683D] hover:bg-[#2F5933] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer une consultation</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {consultations.map(c => (
                  <div key={c.id} className="p-4 border border-[#C7D2BA] rounded-xl space-y-1.5 hover:bg-[#F8F8F1] transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[14px] text-[#1B2F1C]">{c.type}</span>
                      <span className="text-[12px] text-[#859766]">{c.date} · {c.veterinarian}</span>
                    </div>
                    <p className="text-[13px] text-[#52604C]"><strong>Diagnostic :</strong> {c.diagnosis}</p>
                    {c.treatment && <p className="text-[13px] text-[#52604C]"><strong>Traitement :</strong> {c.treatment}</p>}
                    {c.notes && <p className="text-[12px] text-[#859766] italic">{c.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Rendez-vous */}
        {activeTab === 'rdv' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#1B2F1C]">Rendez-vous programmés</h2>
              <button
                onClick={() => navigate('/agenda')}
                className="text-[13px] font-semibold text-[#3A683D] hover:underline cursor-pointer"
              >
                Voir dans l'agenda →
              </button>
            </div>

            <div className="divide-y divide-[#E7ECD9] border border-[#C7D2BA] rounded-xl overflow-hidden">
              {appointments.map(a => (
                <div key={a.id} className="p-4 flex items-center justify-between hover:bg-[#F8F8F1]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#E7ECD9] text-[#3A683D] flex items-center justify-center font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px] text-[#1B2F1C]">{a.reason}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E7ECD9] text-[#3A683D]">
                          {a.type}
                        </span>
                      </div>
                      <span className="text-[12.5px] text-[#52604C]">
                        {a.date} à {a.startTime} ({a.endTime}) · {a.veterinarian}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#E7ECD9] text-[#3A683D]">
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Documents */}
        {activeTab === 'documents' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#1B2F1C]">Documents médicaux</h2>
              <button
                onClick={() => {
                  const docName = prompt('Nom du document (ex : Radio pulmonaire, Bilan sanguin) :');
                  if (docName) {
                    DataService.addDocument({
                      patientId: patient.id,
                      name: docName,
                      type: 'PDF',
                      uploadDate: '14/08/2026',
                      size: '1.4 MB'
                    });
                    loadData();
                  }
                }}
                className="px-3.5 py-1.5 bg-[#3A683D] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2F5933] cursor-pointer"
              >
                + Téléverser un document
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="border border-[#C7D2BA] rounded-2xl p-8 text-center bg-white space-y-2">
                <FileText className="w-10 h-10 text-[#859766] mx-auto" />
                <h3 className="text-[15px] font-bold text-[#1B2F1C]">Aucun document enregistré</h3>
                <p className="text-[13px] text-[#52604C]">Téléversez les radiographies, analyses de sang ou ordonnances.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map(d => (
                  <div key={d.id} className="p-3 border border-[#C7D2BA] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#3A683D]" />
                      <div>
                        <h4 className="text-[13.5px] font-bold text-[#1B2F1C]">{d.name}</h4>
                        <span className="text-[11.5px] text-[#859766]">{d.uploadDate} · {d.size}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { DataService.deleteDocument(d.id); loadData(); }}
                      className="text-xs text-[#DC2626] hover:underline cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Notes */}
        {activeTab === 'notes' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#1B2F1C]">Notes d'observation</h2>
              <button
                onClick={() => setNewActionType('note')}
                className="px-3.5 py-1.5 bg-[#3A683D] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2F5933] cursor-pointer"
              >
                + Ajouter une note
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="border border-[#C7D2BA] rounded-2xl p-8 text-center bg-white space-y-2">
                <StickyNote className="w-10 h-10 text-[#859766] mx-auto" />
                <h3 className="text-[15px] font-bold text-[#1B2F1C]">Aucune note enregistrée</h3>
                <p className="text-[13px] text-[#52604C]">Ajoutez des notes internes concernant le comportement de l'animal.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map(n => (
                  <div key={n.id} className="p-3.5 bg-[#F8F8F1] border border-[#C7D2BA] rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[11.5px] text-[#859766]">
                      <span>{n.author}</span>
                      <span>{n.date}</span>
                    </div>
                    <p className="text-[13px] text-[#1B2F1C]">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Rappels */}
        {activeTab === 'rappels' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#1B2F1C]">Rappels & alertes</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewActionType('vaccine')}
                  className="px-3.5 py-1.5 bg-[#E7ECD9] hover:bg-[#D5DFC1] text-[#3A683D] text-[13px] font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  + Enregistrer un vaccin
                </button>
                <button
                  onClick={() => setNewActionType('reminder')}
                  className="px-3.5 py-1.5 bg-[#3A683D] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2F5933] cursor-pointer"
                >
                  + Créer un rappel
                </button>
              </div>
            </div>

            {/* Automated SMS Reminders for Vaccinations */}
            {vaccinations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#3A683D] uppercase tracking-wider">
                    Protocole Vaccinal & Rappels SMS Automatiques (Cloud Scheduler)
                  </span>
                  <span className="text-[11px] font-semibold text-[#52604C]">
                    Alertes programmées : J-7, J-3, J-1
                  </span>
                </div>
                {vaccinations.map(v => (
                  <div key={v.id} className="p-3.5 bg-[#F8F8F1] border border-[#C7D2BA] rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px] text-[#1B2F1C]">{v.vaccineName || v.vaccine_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#E7ECD9] text-[#3A683D]">
                          Prochaine échéance : {v.nextDueDate || v.next_due_date}
                        </span>
                      </div>
                      <div className="text-[12px] text-[#52604C]">
                        Praticien : {v.veterinarian} · Lot : {v.lotNumber || v.lot_number || 'BIO-2026'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-[#3A683D]/10 text-[#3A683D] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3A683D]"></span>
                        Rappels SMS Actifs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <span className="text-[12px] font-bold text-[#52604C] uppercase tracking-wider block mb-2">
                Alertes & Tâches Cliniques
              </span>
              {reminders.length === 0 ? (
                <div className="border border-[#C7D2BA] rounded-2xl p-6 text-center bg-white space-y-2">
                  <Bell className="w-8 h-8 text-[#859766] mx-auto" />
                  <h3 className="text-[14px] font-bold text-[#1B2F1C]">Aucune tâche clinique en attente</h3>
                  <p className="text-[12.5px] text-[#52604C]">Planifiez les vermifuges, soins locaux ou bilans de contrôle.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reminders.map(r => (
                    <div key={r.id} className="p-3 border border-[#C7D2BA] rounded-xl flex items-center justify-between bg-white">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={r.completed}
                          onChange={() => { DataService.toggleReminder(r.id); loadData(); }}
                          className="w-4 h-4 accent-[#3A683D] rounded border-[#C7D2BA]"
                        />
                        <span className={`text-[13.5px] font-medium ${r.completed ? 'line-through text-[#859766]' : 'text-[#1B2F1C]'}`}>
                          {r.title}
                        </span>
                      </div>
                      <span className="text-[12px] text-[#52604C] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {r.date}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Traitements */}
        {activeTab === 'traitements' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#1B2F1C]">Traitements & prescriptions</h2>
              <button
                onClick={() => setNewActionType('treatment')}
                className="px-3.5 py-1.5 bg-[#3A683D] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2F5933] cursor-pointer"
              >
                + Ajouter un traitement
              </button>
            </div>

            {treatments.length === 0 ? (
              <div className="border border-[#C7D2BA] rounded-2xl p-8 text-center bg-white space-y-2">
                <Pill className="w-10 h-10 text-[#859766] mx-auto" />
                <h3 className="text-[15px] font-bold text-[#1B2F1C]">Aucun traitement en cours</h3>
                <p className="text-[13px] text-[#52604C]">Enregistrez les posologies, dates et consignes médicamenteuses.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {treatments.map(t => (
                  <div key={t.id} className="p-4 border border-[#C7D2BA] rounded-xl space-y-2 bg-[#F8F8F1]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px] text-[#1B2F1C]">{t.name} ({t.medication})</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E7ECD9] text-[#3A683D]">
                          {t.status}
                        </span>
                      </div>
                      <span className="text-[12px] text-[#52604C]">Du {t.startDate} au {t.endDate}</span>
                    </div>
                    <p className="text-[13px] text-[#52604C]">Posologie : {t.dosage} · {t.frequency}</p>
                    <p className="text-[12px] text-[#859766] italic">Consignes : {t.instructions}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Official Prescription Pad Modal */}
      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        patient={patient}
      />

      {/* Edit Patient Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier la fiche patient"
      >
        <form onSubmit={handleUpdatePatient} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Nom</label>
              <input
                type="text"
                value={patient.name}
                onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                className="w-full px-3 py-2 text-[14px] bg-white border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Espèce</label>
              <select
                value={patient.species}
                onChange={(e) => setPatient({ ...patient, species: e.target.value as any })}
                className="w-full px-3 py-2 text-[14px] bg-white border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              >
                <option value="Chat">Chat</option>
                <option value="Chien">Chien</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Race</label>
              <input
                type="text"
                value={patient.breed}
                onChange={(e) => setPatient({ ...patient, breed: e.target.value })}
                className="w-full px-3 py-2 text-[14px] bg-white border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Sexe</label>
              <select
                value={patient.gender}
                onChange={(e) => setPatient({ ...patient, gender: e.target.value as any })}
                className="w-full px-3 py-2 text-[14px] bg-white border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              >
                <option value="Femelle">Femelle</option>
                <option value="Mâle">Mâle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Poids</label>
              <input
                type="text"
                value={patient.weight}
                onChange={(e) => setPatient({ ...patient, weight: e.target.value })}
                className="w-full px-3 py-2 text-[14px] bg-white border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Âge</label>
              <input
                type="text"
                value={patient.age}
                onChange={(e) => setPatient({ ...patient, age: e.target.value })}
                className="w-full px-3 py-2 text-[14px] bg-white border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Propriétaire</label>
              <input
                type="text"
                value={patient.ownerName}
                onChange={(e) => setPatient({ ...patient, ownerName: e.target.value })}
                className="w-full px-3 py-2 text-[14px] bg-white border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Téléphone</label>
              <input
                type="text"
                value={patient.ownerPhone}
                onChange={(e) => setPatient({ ...patient, ownerPhone: e.target.value })}
                className="w-full px-3 py-2 text-[14px] bg-white border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7ECD9]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-[#C7D2BA] rounded-xl text-[13px] font-medium text-[#52604C] hover:bg-[#F8F8F1] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3A683D] text-white rounded-xl text-[13px] font-medium hover:bg-[#2F5933] cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      {/* Sub-action Modals: Consultation, Vitals, Note, Reminder, Treatment */}
      <Modal
        isOpen={newActionType === 'consultation'}
        onClose={() => setNewActionType(null)}
        title="Nouvelle consultation médicale"
      >
        <form onSubmit={handleAddConsultation} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Type de consultation</label>
            <input
              type="text"
              value={consultationForm.type}
              onChange={(e) => setConsultationForm({ ...consultationForm, type: e.target.value })}
              className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Diagnostic clinique</label>
            <textarea
              value={consultationForm.diagnosis}
              onChange={(e) => setConsultationForm({ ...consultationForm, diagnosis: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Traitement prescrit</label>
            <textarea
              value={consultationForm.treatment}
              onChange={(e) => setConsultationForm({ ...consultationForm, treatment: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7ECD9]">
            <button
              type="button"
              onClick={() => setNewActionType(null)}
              className="px-4 py-2 border border-[#C7D2BA] rounded-xl text-[13px] text-[#52604C] hover:bg-[#F8F8F1] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3A683D] text-white rounded-xl text-[13px] font-medium hover:bg-[#2F5933] cursor-pointer"
            >
              Créer la consultation
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={newActionType === 'vitals'}
        onClose={() => setNewActionType(null)}
        title="Ajouter des signes vitaux"
      >
        <form onSubmit={handleAddVitals} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Poids</label>
              <input
                type="text"
                value={vitalForm.weight}
                onChange={(e) => setVitalForm({ ...vitalForm, weight: e.target.value })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Température</label>
              <input
                type="text"
                value={vitalForm.temperature}
                onChange={(e) => setVitalForm({ ...vitalForm, temperature: e.target.value })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Pouls</label>
              <input
                type="text"
                value={vitalForm.heartRate}
                onChange={(e) => setVitalForm({ ...vitalForm, heartRate: e.target.value })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7ECD9]">
            <button
              type="button"
              onClick={() => setNewActionType(null)}
              className="px-4 py-2 border border-[#C7D2BA] rounded-xl text-[13px] text-[#52604C] hover:bg-[#F8F8F1] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3A683D] text-white rounded-xl text-[13px] font-medium hover:bg-[#2F5933] cursor-pointer"
            >
              Enregistrer les mesures
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={newActionType === 'note'}
        onClose={() => setNewActionType(null)}
        title="Ajouter une note"
      >
        <form onSubmit={handleAddNote} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Observation</label>
            <textarea
              value={noteForm}
              onChange={(e) => setNoteForm(e.target.value)}
              rows={4}
              placeholder="Saisissez vos observations cliniques ou comportementales..."
              className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7ECD9]">
            <button
              type="button"
              onClick={() => setNewActionType(null)}
              className="px-4 py-2 border border-[#C7D2BA] rounded-xl text-[13px] text-[#52604C] hover:bg-[#F8F8F1] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3A683D] text-white rounded-xl text-[13px] font-medium hover:bg-[#2F5933] cursor-pointer"
            >
              Enregistrer la note
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={newActionType === 'reminder'}
        onClose={() => setNewActionType(null)}
        title="Créer un rappel"
      >
        <form onSubmit={handleAddReminder} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Titre du rappel</label>
            <input
              type="text"
              value={reminderForm.title}
              onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
              placeholder="Ex : Rappel vaccin leucose"
              className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Date d'échéance</label>
            <input
              type="date"
              value={reminderForm.date}
              onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })}
              className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7ECD9]">
            <button
              type="button"
              onClick={() => setNewActionType(null)}
              className="px-4 py-2 border border-[#C7D2BA] rounded-xl text-[13px] text-[#52604C] hover:bg-[#F8F8F1] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3A683D] text-white rounded-xl text-[13px] font-medium hover:bg-[#2F5933] cursor-pointer"
            >
              Créer le rappel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={newActionType === 'treatment'}
        onClose={() => setNewActionType(null)}
        title="Ajouter un traitement"
      >
        <form onSubmit={handleAddTreatment} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Nom du traitement</label>
              <input
                type="text"
                value={treatmentForm.name}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, name: e.target.value })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Médicament</label>
              <input
                type="text"
                value={treatmentForm.medication}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, medication: e.target.value })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Posologie / Dosage</label>
              <input
                type="text"
                value={treatmentForm.dosage}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, dosage: e.target.value })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Fréquence</label>
              <input
                type="text"
                value={treatmentForm.frequency}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, frequency: e.target.value })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Instructions</label>
            <input
              type="text"
              value={treatmentForm.instructions}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, instructions: e.target.value })}
              className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7ECD9]">
            <button
              type="button"
              onClick={() => setNewActionType(null)}
              className="px-4 py-2 border border-[#C7D2BA] rounded-xl text-[13px] text-[#52604C] hover:bg-[#F8F8F1] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3A683D] text-white rounded-xl text-[13px] font-medium hover:bg-[#2F5933] cursor-pointer"
            >
              Ajouter le traitement
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={newActionType === 'vaccine'}
        onClose={() => setNewActionType(null)}
        title="Enregistrer un vaccin & programmer les rappels SMS"
      >
        <form onSubmit={handleAddVaccine} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Désignation du vaccin *</label>
            <input
              type="text"
              value={vaccineForm.vaccineName}
              onChange={(e) => setVaccineForm({ ...vaccineForm, vaccineName: e.target.value })}
              className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Date d'injection</label>
              <input
                type="date"
                value={vaccineForm.administeredDate}
                onChange={(e) => setVaccineForm({ ...vaccineForm, administeredDate: e.target.value })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Prochain rappel dû *</label>
              <input
                type="date"
                value={vaccineForm.nextDueDate}
                onChange={(e) => setVaccineForm({ ...vaccineForm, nextDueDate: e.target.value })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Numéro de lot</label>
              <input
                type="text"
                value={vaccineForm.lotNumber}
                onChange={(e) => setVaccineForm({ ...vaccineForm, lotNumber: e.target.value })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Vétérinaire</label>
              <select
                value={vaccineForm.veterinarian}
                onChange={(e) => setVaccineForm({ ...vaccineForm, veterinarian: e.target.value })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none bg-white"
              >
                <option value="Dr. Martin">Dr. Martin</option>
                <option value="Dr. Leroy">Dr. Leroy</option>
                <option value="Dr. Bernard">Dr. Bernard</option>
                <option value="Dr. Vétérinaire">Dr. Vétérinaire</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-[#E7ECD9]/70 border border-[#C7D2BA] rounded-xl text-xs text-[#1B2F1C] space-y-1">
            <div className="font-bold text-[#3A683D]">Programmation automatique des alertes SMS :</div>
            <p className="text-[#52604C]">
              L'enregistrement de ce vaccin crée automatiquement 3 rappels SMS idempotents (J-7, J-3, J-1) dans la file PostgreSQL, routés vers {patient.ownerName} ({patient.ownerPhone}).
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7ECD9]">
            <button
              type="button"
              onClick={() => setNewActionType(null)}
              className="px-4 py-2 border border-[#C7D2BA] rounded-xl text-[13px] text-[#52604C] hover:bg-[#F8F8F1] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3A683D] text-white rounded-xl text-[13px] font-semibold hover:bg-[#2F5933] cursor-pointer"
            >
              Valider et programmer les rappels
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
