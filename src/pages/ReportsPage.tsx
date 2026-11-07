import React from 'react';
import { BarChart3, TrendingUp, Users, Calendar, Activity } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';

export const ReportsPage: React.FC = () => {
  return (
    <div className="p-6 lg:p-8 max-w-[1580px] w-full mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-[#3A683D]" />
          <h1 className="text-[26px] font-bold text-[#1B2F1C] tracking-tight">
            Rapports & Statistiques
          </h1>
        </div>
        <p className="text-[14px] text-[#52604C] mt-0.5">
          Analyses de fréquentation, répartition des motifs de consultation et chiffre d'affaires
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <StatCard title="Consultations ce mois" value="142" />
        <StatCard title="Nouveaux patients" value="+28" valueColor="text-[#3A683D]" />
        <StatCard title="Taux de rappel vaccin" value="94.2 %" />
        <StatCard title="CA mensuel" value="18 450 €" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#C7D2BA] p-6 shadow-2xs space-y-4">
          <h3 className="text-[16px] font-bold text-[#1B2F1C]">
            Répartition par espèce
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[13px] font-semibold text-[#1B2F1C] mb-1">
                <span>Félins (Chats)</span>
                <span>58%</span>
              </div>
              <div className="w-full h-3 bg-[#E7ECD9] rounded-full overflow-hidden">
                <div className="h-full bg-[#3A683D] rounded-full" style={{ width: '58%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[13px] font-semibold text-[#1B2F1C] mb-1">
                <span>Canins (Chiens)</span>
                <span>36%</span>
              </div>
              <div className="w-full h-3 bg-[#E7ECD9] rounded-full overflow-hidden">
                <div className="h-full bg-[#5A7E32] rounded-full" style={{ width: '36%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[13px] font-semibold text-[#1B2F1C] mb-1">
                <span>NAC & Autres</span>
                <span>6%</span>
              </div>
              <div className="w-full h-3 bg-[#E7ECD9] rounded-full overflow-hidden">
                <div className="h-full bg-[#859766] rounded-full" style={{ width: '6%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#C7D2BA] p-6 shadow-2xs space-y-4">
          <h3 className="text-[16px] font-bold text-[#1B2F1C]">
            Types d'actes vétérinaires
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[13px] font-semibold text-[#1B2F1C] mb-1">
                <span>Vaccinations préventives</span>
                <span>42%</span>
              </div>
              <div className="w-full h-3 bg-[#E7ECD9] rounded-full overflow-hidden">
                <div className="h-full bg-[#5A7E32] rounded-full" style={{ width: '42%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[13px] font-semibold text-[#1B2F1C] mb-1">
                <span>Consultations médecine générale</span>
                <span>35%</span>
              </div>
              <div className="w-full h-3 bg-[#E7ECD9] rounded-full overflow-hidden">
                <div className="h-full bg-[#3A683D] rounded-full" style={{ width: '35%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[13px] font-semibold text-[#1B2F1C] mb-1">
                <span>Chirurgies & Stérilisations</span>
                <span>15%</span>
              </div>
              <div className="w-full h-3 bg-[#E7ECD9] rounded-full overflow-hidden">
                <div className="h-full bg-[#859766] rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[13px] font-semibold text-[#1B2F1C] mb-1">
                <span>Urgences</span>
                <span>8%</span>
              </div>
              <div className="w-full h-3 bg-[#E7ECD9] rounded-full overflow-hidden">
                <div className="h-full bg-[#DC2626] rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
