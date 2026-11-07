import React, { useState } from 'react';
import { BedDouble, Plus, Activity, Heart, Clock, AlertCircle } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';

interface HospitalizedBox {
  boxId: string;
  patientName: string;
  species: string;
  breed: string;
  ownerName: string;
  admissionDate: string;
  reason: string;
  veterinarian: string;
  status: 'Critique' | 'Stable' | 'En convalescence';
  diet: string;
  lastCare: string;
}

const INITIAL_BOXES: HospitalizedBox[] = [
  {
    boxId: 'Box H1',
    patientName: 'Félix',
    species: 'Chat',
    breed: 'Européen',
    ownerName: 'Sophie Lambert',
    admissionDate: '13/08/2026',
    reason: 'Perfusion réhydratation & surveillance',
    veterinarian: 'Dr. Leroy',
    status: 'Stable',
    diet: 'Alimentation humide gastro-intestinale',
    lastCare: '14/08 à 08:30 (Perfusion vérifiée)'
  },
  {
    boxId: 'Box H2',
    patientName: 'Rocky',
    species: 'Chien',
    breed: 'Berger Allemand',
    ownerName: 'Marc Dubois',
    admissionDate: '12/08/2026',
    reason: 'Laparotomie exploratrice J+2 — Soins pansement',
    veterinarian: 'Dr. Martin',
    status: 'En convalescence',
    diet: 'Ration ménagère hyper-digestible',
    lastCare: '14/08 à 10:00 (Pansement abdominal refait)'
  },
  {
    boxId: 'Box H3',
    patientName: 'Libre',
    species: '—',
    breed: '—',
    ownerName: '—',
    admissionDate: '—',
    reason: 'Box désinfecté prêt pour admission',
    veterinarian: '—',
    status: 'Stable',
    diet: '—',
    lastCare: 'Désinfection le 14/08 à 07:00'
  },
  {
    boxId: 'Box C1',
    patientName: 'Charly',
    species: 'Chat',
    breed: 'Persan',
    ownerName: 'Mme. Valérie',
    admissionDate: '14/08/2026',
    reason: 'Oxygénothérapie & détresse respiratoire',
    veterinarian: 'Dr. Bernard',
    status: 'Critique',
    diet: 'À jeun sous surveillance continue',
    lastCare: '14/08 à 11:15 (Saturation O2 mesurée 96%)'
  }
];

export const HospitalizationPage: React.FC = () => {
  const [boxes, setBoxes] = useState<HospitalizedBox[]>(INITIAL_BOXES);

  return (
    <div className="p-6 lg:p-8 max-w-[1580px] w-full mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <BedDouble className="w-7 h-7 text-[#3A683D]" />
            <h1 className="text-[26px] font-bold text-[#1B2F1C] tracking-tight">
              Suivi hospitalisation
            </h1>
          </div>
          <p className="text-[14px] text-[#52604C] mt-0.5">
            Tableau de bord des box de soins intensifs et des animaux hospitalisés
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <StatCard title="Animaux hospitalisés" value={boxes.filter(b => b.patientName !== 'Libre').length} />
        <StatCard title="Box disponibles" value={boxes.filter(b => b.patientName === 'Libre').length} />
        <StatCard title="Surveillance critique" value={boxes.filter(b => b.status === 'Critique').length} valueColor="text-[#DC2626]" />
        <StatCard title="Soins programmés" value="5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {boxes.map((b) => {
          const isFree = b.patientName === 'Libre';
          return (
            <div
              key={b.boxId}
              className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-3 ${
                b.status === 'Critique'
                  ? 'border-[#FECDD3] bg-[#FFFBFB]'
                  : 'border-[#C7D2BA]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#E7ECD9] pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[16px] text-[#1B2F1C]">{b.boxId}</span>
                  {!isFree && (
                    <span className="font-bold text-[16px] text-[#3A683D]">
                      — {b.patientName} ({b.species})
                    </span>
                  )}
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isFree
                      ? 'bg-[#E7ECD9] text-[#52604C]'
                      : b.status === 'Critique'
                      ? 'bg-rose-100 text-rose-700'
                      : b.status === 'Stable'
                      ? 'bg-[#E7ECD9] text-[#3A683D]'
                      : 'bg-[#E7ECD9] text-[#5A7E32]'
                  }`}
                >
                  {isFree ? 'Disponible' : b.status}
                </span>
              </div>

              {!isFree ? (
                <div className="space-y-2 text-[13px]">
                  <div>
                    <span className="text-[#859766] uppercase text-[11px] font-bold block">Motif</span>
                    <p className="font-semibold text-[#1B2F1C]">{b.reason}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[12.5px] text-[#52604C]">
                    <div>Propriétaire : <strong className="text-[#1B2F1C]">{b.ownerName}</strong></div>
                    <div>Vétérinaire : <strong className="text-[#1B2F1C]">{b.veterinarian}</strong></div>
                  </div>

                  <div className="p-3 bg-[#F8F8F1] rounded-xl border border-[#C7D2BA] text-[12px] space-y-1">
                    <div><strong>Alimentation :</strong> {b.diet}</div>
                    <div className="text-[#52604C]"><strong>Dernier soin :</strong> {b.lastCare}</div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-[#859766] text-[13px]">
                  {b.reason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
