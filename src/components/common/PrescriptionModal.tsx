import React, { useState } from 'react';
import { Printer, X, MapPin, Phone, Calendar, Download } from 'lucide-react';
import { MyVetLogo } from './MyVetLogo';
import { Patient } from '../../types';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  initialContent?: string;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  patient,
  initialContent = ''
}) => {
  const [species, setSpecies] = useState<'Chien' | 'Chat' | 'Autres'>(
    patient?.species === 'Chien' ? 'Chien' : patient?.species === 'Chat' ? 'Chat' : 'Autres'
  );

  const [date, setDate] = useState('2026-08-14');
  const [prescriptionText, setPrescriptionText] = useState(
    initialContent ||
    `1. Clavaseptin 62.5 mg (Amoxicilline / Acide clavulanique)\n   Posologie : 1 comprimé matin et soir pendant 7 jours, pendant le repas.\n\n2. Meloxidyl 0.5 mg/ml (Anti-inflammatoire)\n   Posologie : 0.5 dose par kg une fois par jour le matin pendant 4 jours.\n\n3. Consignes diététiques :\n   Ration ménagère hyper-digestible, eau fraîche à disposition en permanence.\n   Contrôle clinique sous 5 jours en cas de persistance des symptômes.`
  );

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1B2F1C]/50 backdrop-blur-xs transition-opacity no-print"
        onClick={onClose}
      />

      {/* Modal / Prescription Pad Container */}
      <div className="relative bg-[#FFFFFF] rounded-2xl border-2 border-[#C7D2BA] shadow-2xl max-w-2xl w-full z-10 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Top Control Bar (Hidden on print) */}
        <div className="px-5 py-3 bg-[#E7ECD9] border-b border-[#C7D2BA] flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-[14px] font-bold text-[#1B2F1C]">
            <span>Ordonnance Vétérinaire Officielle — My Vet</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#3A683D] hover:bg-[#2F5933] text-white rounded-xl text-[12.5px] font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#52604C] hover:text-[#1B2F1C] hover:bg-[#C7D2BA]/40 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prescription Paper Pad Body (Exact Replica of Uploaded Image) */}
        <div className="p-6 sm:p-8 bg-[#FFFFFF] overflow-y-auto text-[#1B2F1C] space-y-5 print:p-0 print:border-none">
          {/* Header Branding */}
          <div className="flex flex-col items-center text-center space-y-1">
            <MyVetLogo variant="full" showSlogan={true} />
            <div className="w-full border-t border-[#C7D2BA] my-2" />
            <h2 className="text-[20px] font-extrabold tracking-[0.14em] text-[#1B2F1C] uppercase font-sans">
              ORDONNANCE VÉTÉRINAIRE
            </h2>
          </div>

          {/* Species Radio Selection Bar */}
          <div className="bg-[#E7ECD9] rounded-full px-4 py-2 flex items-center flex-wrap justify-between gap-3 text-[12.5px] font-bold text-[#1B2F1C] border border-[#C7D2BA]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3A683D]" />
              <span>ESPÈCE DE L'ANIMAL :</span>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="species"
                  checked={species === 'Chien'}
                  onChange={() => setSpecies('Chien')}
                  className="accent-[#3A683D]"
                />
                <span>🐶 Chien</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="species"
                  checked={species === 'Chat'}
                  onChange={() => setSpecies('Chat')}
                  className="accent-[#3A683D]"
                />
                <span>🐱 Chat</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="species"
                  checked={species === 'Autres'}
                  onChange={() => setSpecies('Autres')}
                  className="accent-[#3A683D]"
                />
                <span>🐾 Autres</span>
              </label>
            </div>
          </div>

          {/* Patient Details bar */}
          {patient && (
            <div className="px-3 py-1.5 bg-[#F8F8F1] rounded-lg border border-[#C7D2BA] text-[12px] flex items-center justify-between text-[#52604C]">
              <span>Animal : <strong className="text-[#1B2F1C]">{patient.name}</strong> ({patient.breed})</span>
              <span>Propriétaire : <strong className="text-[#1B2F1C]">{patient.ownerName}</strong> ({patient.ownerPhone})</span>
              <span>Poids : <strong className="text-[#1B2F1C]">{patient.weight}</strong></span>
            </div>
          )}

          {/* Big Prescription Box with Rx symbol */}
          <div className="relative border-2 border-[#C7D2BA] rounded-2xl p-5 bg-[#FFFFFF] min-h-[260px] shadow-2xs space-y-2">
            <div className="flex items-center gap-2 font-serif text-[28px] font-bold text-[#3A683D] select-none leading-none">
              <span>R</span>
              <span className="text-[20px]">🐾</span>
            </div>

            <textarea
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
              rows={8}
              className="w-full text-[13.5px] leading-relaxed text-[#1B2F1C] font-mono bg-transparent border-none focus:outline-none resize-none p-1"
              placeholder="Rédigez l'ordonnance, les posologies et les recommandations cliniques..."
            />
          </div>

          {/* Footer Coordinates and Doctor Stamp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Address & Phone Box */}
            <div className="bg-[#E7ECD9]/70 rounded-xl p-3.5 border border-[#C7D2BA] space-y-1.5 text-[12px] text-[#1B2F1C]">
              <div className="flex items-center gap-2 font-semibold">
                <MapPin className="w-4 h-4 text-[#3A683D] shrink-0" />
                <span>Coopérative el moustakbel n° CC3, Ouled Fayet</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-[13px] text-[#3A683D]">
                <Phone className="w-4 h-4 text-[#3A683D] shrink-0" />
                <span>0797 63 87 04</span>
              </div>
            </div>

            {/* Date & Signature Stamp */}
            <div className="bg-[#E7ECD9]/70 rounded-xl p-3.5 border border-[#C7D2BA] space-y-2 text-[12px] text-[#1B2F1C] flex flex-col justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Calendar className="w-4 h-4 text-[#3A683D] shrink-0" />
                <span>Date : </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent font-bold border-b border-[#C7D2BA] focus:outline-none text-[12.5px]"
                />
              </div>

              <div className="pt-2 border-t border-[#C7D2BA]/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#52604C]">
                  <span>🐾 Signature et Cachet :</span>
                </div>
                <div className="text-right">
                  <span className="font-brand-script text-[17px] text-[#3A683D] font-bold block leading-none">
                    Dr. Vétérinaire
                  </span>
                  <span className="text-[9px] text-[#859766] uppercase tracking-wider block">
                    My Vet Ouled Fayet
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
