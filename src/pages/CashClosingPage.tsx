import React, { useState } from 'react';
import { CreditCard, CheckCircle2, Printer, Calendar, DollarSign, ArrowUpRight } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';

export const CashClosingPage: React.FC = () => {
  const [closed, setClosed] = useState(false);

  return (
    <div className="p-6 lg:p-8 max-w-[1580px] w-full mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-[#3A683D]" />
            <h1 className="text-[26px] font-bold text-[#1B2F1C] tracking-tight">
              Clôture de caisse
            </h1>
          </div>
          <p className="text-[14px] text-[#52604C] mt-0.5">
            Rapport financier journalier et réconciliation des encaissements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-[#C7D2BA] text-[#1B2F1C] text-[13px] font-semibold rounded-xl hover:bg-[#F8F8F1] transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#52604C]" />
            <span>Imprimer le journal</span>
          </button>

          <button
            onClick={() => setClosed(true)}
            disabled={closed}
            className={`px-5 py-2 rounded-xl font-semibold text-[13.5px] transition-colors flex items-center gap-1.5 shadow-xs ${
              closed
                ? 'bg-[#3A683D] text-white cursor-default'
                : 'bg-[#3A683D] hover:bg-[#2F5933] text-white cursor-pointer'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{closed ? 'Caisse clôturée' : 'Clôturer la journée'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <StatCard title="Total CB" value="640.00 €" />
        <StatCard title="Total Espèces" value="185.00 €" />
        <StatCard title="Chèques / Virements" value="95.00 €" />
        <StatCard title="Total du jour" value="920.00 €" valueColor="text-[#3A683D]" />
      </div>

      <div className="bg-white rounded-2xl border border-[#C7D2BA] p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E7ECD9] pb-4">
          <div>
            <h3 className="text-[17px] font-bold text-[#1B2F1C]">
              Journal des encaissements — Vendredi 14 Août 2026
            </h3>
            <span className="text-[13px] text-[#52604C]">Opérateur : Dr. Vétérinaire (Caisse My Vet)</span>
          </div>
          <span className="px-3 py-1 bg-[#E7ECD9] text-[#3A683D] font-bold text-[12px] rounded-full border border-[#C7D2BA]">
            Équilibrée (écart 0.00 €)
          </span>
        </div>

        <div className="space-y-3">
          {[
            { time: '09:30', client: 'Fatima Fatima', patient: 'Nina', desc: 'Vaccination annuelle + Consultation', mode: 'Carte Bancaire', amount: '85.00 €' },
            { time: '11:45', client: 'Marc Dubois', patient: 'Rocky', desc: 'Soins post-op + Pansements', mode: 'Carte Bancaire', amount: '120.00 €' },
            { time: '14:20', client: 'Sophie Lambert', patient: 'Félix', desc: 'Traitement dermatologique', mode: 'Espèces', amount: '65.00 €' },
            { time: '16:00', client: 'Thomas Laurent', patient: 'Maya', desc: 'Alimentation thérapeutique + Antiparasitaires', mode: 'Carte Bancaire', amount: '95.00 €' },
          ].map((op, idx) => (
            <div key={idx} className="p-3.5 bg-[#F8F8F1] border border-[#C7D2BA] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[12px] text-[#859766]">{op.time}</span>
                <div>
                  <div className="font-bold text-[13.5px] text-[#1B2F1C]">{op.client} — {op.patient}</div>
                  <div className="text-[12px] text-[#52604C]">{op.desc}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-[14px] text-[#1B2F1C]">{op.amount}</div>
                <div className="text-[11.5px] text-[#52604C]">{op.mode}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
