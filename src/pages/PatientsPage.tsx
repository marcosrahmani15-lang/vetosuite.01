import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Search, Plus, Filter, ChevronRight, Phone, User } from 'lucide-react';
import { DataService } from '../services/storage';
import { Patient } from '../types';
import { Modal } from '../components/common/Modal';

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>(() => DataService.getPatients());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState<'Tous' | 'Chat' | 'Chien'>('Tous');
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  // New Patient Form
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    name: '',
    species: 'Chat',
    breed: '',
    color: '',
    gender: 'Femelle',
    birthDate: '2025-01-01',
    age: '1 an',
    weight: '4 kg',
    microchip: '',
    ownerName: '',
    ownerPhone: '',
    veterinarian: 'Dr. Martin',
    status: 'Actif',
    avatarEmoji: '🐱'
  });

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === 'Tous' || p.species === filterSpecies;
    return matchesSearch && matchesSpecies;
  });

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Patient = {
      id: `p-${Date.now()}`,
      name: newPatient.name || 'Sans nom',
      species: (newPatient.species as any) || 'Chat',
      breed: newPatient.breed || 'Européen',
      color: newPatient.color || '—',
      gender: (newPatient.gender as any) || 'Femelle',
      birthDate: newPatient.birthDate || '01/01/2025',
      age: newPatient.age || '1 an',
      weight: newPatient.weight || '4 kg',
      microchip: newPatient.microchip || '—',
      ownerId: `c-${Date.now()}`,
      ownerName: newPatient.ownerName || 'Client',
      ownerPhone: newPatient.ownerPhone || '0600000000',
      veterinarian: newPatient.veterinarian || 'Dr. Martin',
      nextVisit: 'Aucune visite planifiée',
      status: 'Actif',
      avatarEmoji: newPatient.species === 'Chien' ? '🐕' : '🐱',
      medicalAlerts: []
    };

    const updated = [created, ...patients];
    DataService.savePatients(updated);
    setPatients(updated);
    setIsNewPatientModalOpen(false);
    navigate(`/patients/${created.id}`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1580px] w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Stethoscope className="w-7 h-7 text-[#3A683D]" />
            <h1 className="text-[26px] font-bold text-[#1B2F1C] tracking-tight">
              Dossier Médical & Animaux
            </h1>
          </div>
          <p className="text-[14px] text-[#52604C] mt-0.5">
            Fiches patients, antécédents médicaux et suivi de santé
          </p>
        </div>

        <button
          onClick={() => setIsNewPatientModalOpen(true)}
          className="bg-[#3A683D] hover:bg-[#2F5933] text-white px-5 py-2.5 rounded-xl font-semibold text-[13.5px] transition-colors flex items-center justify-center gap-1.5 shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau patient</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#C7D2BA] p-4 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#859766] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom d'animal, propriétaire, race..."
            className="w-full pl-10 pr-4 py-2 bg-[#F8F8F1] border border-[#C7D2BA] rounded-xl text-[14px] focus:outline-none focus:border-[#3A683D] focus:bg-white transition-all text-[#1B2F1C]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['Tous', 'Chat', 'Chien'] as const).map((sp) => (
            <button
              key={sp}
              onClick={() => setFilterSpecies(sp)}
              className={`px-3.5 py-1.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                filterSpecies === sp
                  ? 'bg-[#E7ECD9] text-[#1B2F1C] border border-[#C7D2BA]'
                  : 'bg-white text-[#52604C] border border-[#C7D2BA] hover:bg-[#F8F8F1]'
              }`}
            >
              {sp}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Table / Grid */}
      <div className="bg-white rounded-2xl border border-[#C7D2BA] shadow-2xs overflow-hidden">
        <div className="divide-y divide-[#E7ECD9]">
          {filteredPatients.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/patients/${p.id}`)}
              className="p-5 flex items-center justify-between hover:bg-[#F8F8F1] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#E7ECD9]/60 border border-[#C7D2BA] flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                  {p.avatarEmoji || (p.species === 'Chat' ? '🐱' : '🐕')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[16px] text-[#1B2F1C] group-hover:text-[#3A683D] transition-colors">
                      {p.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E7ECD9] text-[#3A683D] border border-[#C7D2BA]">
                      {p.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E7ECD9]/50 text-[#5A7E32]">
                      {p.species}
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-3 text-[12.5px] text-[#52604C] mt-1">
                    <span>Race : <strong className="text-[#1B2F1C]">{p.breed}</strong></span>
                    <span>·</span>
                    <span>Âge : <strong className="text-[#1B2F1C]">{p.age}</strong></span>
                    <span>·</span>
                    <span>Poids : <strong className="text-[#1B2F1C]">{p.weight}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col text-right">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#1B2F1C] justify-end">
                    <User className="w-3.5 h-3.5 text-[#859766]" />
                    <span>{p.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#52604C] justify-end">
                    <Phone className="w-3 h-3 text-[#859766]" />
                    <span>{p.ownerPhone}</span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-[#F8F8F1] group-hover:bg-[#E7ECD9] flex items-center justify-center text-[#859766] group-hover:text-[#3A683D] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}

          {filteredPatients.length === 0 && (
            <div className="p-12 text-center text-[#52604C]">
              Aucun patient ne correspond à votre recherche.
            </div>
          )}
        </div>
      </div>

      {/* New Patient Modal */}
      <Modal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        title="Ajouter un nouveau patient"
      >
        <form onSubmit={handleCreatePatient} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
                Nom de l'animal *
              </label>
              <input
                type="text"
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                placeholder="Ex : Nina"
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
                Espèce *
              </label>
              <select
                value={newPatient.species}
                onChange={(e) => setNewPatient({ ...newPatient, species: e.target.value as any })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
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
                value={newPatient.breed}
                onChange={(e) => setNewPatient({ ...newPatient, breed: e.target.value })}
                placeholder="Ex : Siamois"
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Sexe</label>
              <select
                value={newPatient.gender}
                onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as any })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
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
                value={newPatient.weight}
                onChange={(e) => setNewPatient({ ...newPatient, weight: e.target.value })}
                placeholder="Ex : 5 kg"
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Âge</label>
              <input
                type="text"
                value={newPatient.age}
                onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                placeholder="Ex : 1 an 6 mois"
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Nom du propriétaire *</label>
              <input
                type="text"
                value={newPatient.ownerName}
                onChange={(e) => setNewPatient({ ...newPatient, ownerName: e.target.value })}
                placeholder="Ex : Fatima Fatima"
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Téléphone *</label>
              <input
                type="text"
                value={newPatient.ownerPhone}
                onChange={(e) => setNewPatient({ ...newPatient, ownerPhone: e.target.value })}
                placeholder="Ex : 0555555555"
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7ECD9]">
            <button
              type="button"
              onClick={() => setIsNewPatientModalOpen(false)}
              className="px-4 py-2 border border-[#C7D2BA] text-[#52604C] rounded-xl text-[13px] font-medium hover:bg-[#F8F8F1] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3A683D] text-white rounded-xl text-[13px] font-medium hover:bg-[#2F5933] cursor-pointer"
            >
              Créer le dossier patient
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
