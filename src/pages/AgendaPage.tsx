import React, { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { AppointmentModal } from '../components/agenda/AppointmentModal';
import { Appointment } from '../types';
import { DataService } from '../services/storage';

const HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00'
];

interface DayInfo {
  label: string;
  dayNumber: number;
  dateStr: string; // '2026-08-10'
  isCurrentDay?: boolean;
}

export const AgendaPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(() => DataService.getAppointments());
  const [viewMode, setViewMode] = useState<'Semaine' | 'Jour'>('Semaine');
  
  // Week base offset in weeks (0 = reference week Aug 10 - Aug 16, 2026)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Selected date for Day view
  const [selectedDayDate, setSelectedDayDate] = useState<string>('2026-08-14');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [slotDate, setSlotDate] = useState<string>('2026-08-14');
  const [slotTime, setSlotTime] = useState<string>('09:00');

  // Compute days for the current week
  // Base Monday is 2026-08-10
  const baseMonday = new Date(2026, 7, 10 + weekOffset * 7);

  const weekDays: DayInfo[] = ['LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.', 'DIM.'].map((label, idx) => {
    const d = new Date(baseMonday);
    d.setDate(baseMonday.getDate() + idx);
    const dayNumber = d.getDate();
    const dateStr = d.toISOString().split('T')[0];
    const isCurrentDay = dateStr === '2026-08-14';
    return { label, dayNumber, dateStr, isCurrentDay };
  });

  // Month formatting in French
  const formatMonthRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const monthsFr = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const startM = monthsFr[baseMonday.getMonth()];
    return `${start.dayNumber} ${startM} — ${end.dayNumber} ${startM} ${baseMonday.getFullYear()}`;
  };

  // Compute stats
  const todayApts = appointments.filter(a => a.date === '2026-08-14');
  const weekDateStrs = new Set(weekDays.map(d => d.dateStr));
  const thisWeekApts = appointments.filter(a => weekDateStrs.has(a.date));
  const confirmedWeekApts = thisWeekApts.filter(a => a.status === 'Confirmé');

  const handleSaveAppointment = (saved: Appointment) => {
    if (editingAppointment) {
      DataService.updateAppointment(saved.id, saved);
    } else {
      DataService.addAppointment(saved);
    }
    setAppointments(DataService.getAppointments());
  };

  const handleDeleteAppointment = (id: string) => {
    DataService.deleteAppointment(id);
    setAppointments(DataService.getAppointments());
  };

  const openNewSlot = (date: string, time: string) => {
    setEditingAppointment(null);
    setSlotDate(date);
    setSlotTime(time);
    setIsModalOpen(true);
  };

  const openEdit = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAppointment(apt);
    setIsModalOpen(true);
  };

  // Category styling helper
  const getCardStyle = (type: string) => {
    switch (type) {
      case 'Vaccin':
        return {
          bg: 'bg-[#EFF6FF]',
          border: 'border-[#BFDBFE]',
          dot: 'bg-[#2563EB]',
          timeText: 'text-[#2563EB]',
          titleText: 'text-[#1E40AF]'
        };
      case 'Contrôle':
        return {
          bg: 'bg-[#F4F7EE]',
          border: 'border-[#C7D2BA]',
          dot: 'bg-[#5A7E32]',
          timeText: 'text-[#5A7E32]',
          titleText: 'text-[#1B2F1C]'
        };
      case 'Urgence':
        return {
          bg: 'bg-[#FEF2F2]',
          border: 'border-[#FECDD3]',
          dot: 'bg-[#DC2626]',
          timeText: 'text-[#DC2626]',
          titleText: 'text-[#991B1B]'
        };
      case 'Consultation':
      default:
        return {
          bg: 'bg-[#E7ECD9]/60',
          border: 'border-[#C7D2BA]',
          dot: 'bg-[#3A683D]',
          timeText: 'text-[#3A683D]',
          titleText: 'text-[#1B2F1C]'
        };
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1580px] w-full mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-[#3A683D]" />
            <h1 className="text-[26px] font-bold text-[#1B2F1C] tracking-tight">
              Agenda & Planning
            </h1>
          </div>
          <p className="text-[14px] text-[#52604C] mt-0.5">
            Planifiez et gérez les rendez-vous de votre cabinet
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAppointment(null);
            setSlotDate('2026-08-14');
            setSlotTime('09:00');
            setIsModalOpen(true);
          }}
          className="bg-[#3A683D] hover:bg-[#2F5933] text-white px-5 py-2.5 rounded-xl font-semibold text-[13.5px] transition-colors flex items-center justify-center gap-1.5 shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau rendez-vous</span>
        </button>
      </div>

      {/* 3 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="Aujourd'hui" value={todayApts.length} />
        <StatCard title="Cette semaine" value={thisWeekApts.length} />
        <StatCard title="Confirmés" value={confirmedWeekApts.length} valueColor="text-[#3A683D]" />
      </div>

      {/* Calendar Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        {/* Left controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="w-8 h-8 flex items-center justify-center bg-white border border-[#C7D2BA] hover:bg-[#F8F8F1] rounded-lg text-[#52604C] transition-colors cursor-pointer"
            title="Semaine précédente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setWeekOffset(0);
              setSelectedDayDate('2026-08-14');
            }}
            className="px-3.5 py-1.5 bg-white border border-[#C7D2BA] hover:bg-[#F8F8F1] text-[13px] font-semibold text-[#1B2F1C] rounded-lg transition-colors cursor-pointer"
          >
            Aujourd'hui
          </button>

          <button
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="w-8 h-8 flex items-center justify-center bg-white border border-[#C7D2BA] hover:bg-[#F8F8F1] rounded-lg text-[#52604C] transition-colors cursor-pointer"
            title="Semaine suivante"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="ml-2 text-[15px] font-bold text-[#1B2F1C]">
            {formatMonthRange()}
          </span>
        </div>

        {/* Right controls: Segmented view selector */}
        <div className="flex items-center p-1 bg-white border border-[#C7D2BA] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('Jour')}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
              viewMode === 'Jour'
                ? 'bg-[#E7ECD9] text-[#1B2F1C]'
                : 'text-[#52604C] hover:text-[#1B2F1C]'
            }`}
          >
            Jour
          </button>
          <button
            onClick={() => setViewMode('Semaine')}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
              viewMode === 'Semaine'
                ? 'bg-[#E7ECD9] text-[#1B2F1C]'
                : 'text-[#52604C] hover:text-[#1B2F1C]'
            }`}
          >
            Semaine
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-4 text-[13px] text-[#52604C] pt-0.5">
        <span className="font-semibold text-[#1B2F1C]">Légende :</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
          <span>Urgence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3A683D]" />
          <span>Consultation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
          <span>Vaccin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#5A7E32]" />
          <span>Contrôle</span>
        </div>
      </div>

      {/* Calendar Body */}
      {viewMode === 'Semaine' ? (
        <div className="bg-white rounded-2xl border border-[#C7D2BA] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              {/* Day Header Row */}
              <div className="grid grid-cols-[72px_repeat(7,1fr)] border-b border-[#C7D2BA] bg-white">
                {/* Empty cell above hours */}
                <div className="p-3 border-r border-[#E7ECD9]" />
                
                {/* 7 Days Columns */}
                {weekDays.map((d) => (
                  <div
                    key={d.dateStr}
                    onClick={() => {
                      setSelectedDayDate(d.dateStr);
                      setViewMode('Jour');
                    }}
                    className={`py-3 text-center cursor-pointer transition-colors border-r border-[#E7ECD9] last:border-r-0 ${
                      d.isCurrentDay ? 'bg-[#E7ECD9]/60' : 'hover:bg-[#F8F8F1]'
                    }`}
                  >
                    <span className="block text-[11px] font-bold text-[#52604C] tracking-wider uppercase">
                      {d.label}
                    </span>
                    <span
                      className={`text-[17px] font-bold leading-tight block mt-0.5 ${
                        d.isCurrentDay ? 'text-[#3A683D]' : 'text-[#1B2F1C]'
                      }`}
                    >
                      {d.dayNumber}
                    </span>
                  </div>
                ))}
              </div>

              {/* Time Slots Grid */}
              <div className="divide-y divide-[#E7ECD9]">
                {HOURS.map((hour) => {
                  return (
                    <div
                      key={hour}
                      className="grid grid-cols-[72px_repeat(7,1fr)] min-h-[76px]"
                    >
                      {/* Hour label */}
                      <div className="p-2.5 text-[12px] font-semibold text-[#859766] border-r border-[#E7ECD9] select-none flex items-start justify-center">
                        {hour}
                      </div>

                      {/* 7 Day slots */}
                      {weekDays.map((d) => {
                        // Find appointment for this day and this hour
                        const slotApts = appointments.filter(
                          a => a.date === d.dateStr && a.startTime.startsWith(hour.slice(0, 2))
                        );

                        return (
                          <div
                            key={d.dateStr + hour}
                            onClick={() => openNewSlot(d.dateStr, hour)}
                            className={`p-1.5 border-r border-[#E7ECD9] last:border-r-0 relative group transition-colors cursor-pointer ${
                              d.isCurrentDay ? 'bg-[#F8F8F1]' : 'hover:bg-[#F8F8F1]/60'
                            }`}
                          >
                            {/* Render appointments in this slot */}
                            {slotApts.map((apt) => {
                              const style = getCardStyle(apt.type);
                              return (
                                <div
                                  key={apt.id}
                                  onClick={(e) => openEdit(apt, e)}
                                  className={`${style.bg} ${style.border} border rounded-lg p-2 transition-transform hover:scale-[1.01] shadow-2xs mb-1`}
                                >
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0`} />
                                    <span className={`text-[11.5px] font-bold ${style.timeText}`}>
                                      {apt.startTime} {apt.startTime < '12:00' ? 'AM' : 'PM'}
                                    </span>
                                  </div>
                                  <div
                                    className={`text-[12.5px] font-semibold text-[#1B2F1C] truncate leading-tight`}
                                    title={apt.reason}
                                  >
                                    {apt.reason}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Single Day View */
        <div className="bg-white rounded-2xl border border-[#C7D2BA] shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7ECD9] pb-4">
            <div>
              <span className="text-[12px] font-bold text-[#3A683D] uppercase tracking-wider">
                Vue journalière
              </span>
              <h2 className="text-[20px] font-bold text-[#1B2F1C]">
                {selectedDayDate === '2026-08-14' ? 'Vendredi 14 Août 2026 (Aujourd\'hui)' : selectedDayDate}
              </h2>
            </div>
            <button
              onClick={() => openNewSlot(selectedDayDate, '09:00')}
              className="px-3.5 py-1.5 bg-[#E7ECD9] text-[#1B2F1C] border border-[#C7D2BA] rounded-xl text-[13px] font-semibold hover:bg-[#DCE3CB] transition-colors cursor-pointer"
            >
              + Ajouter un créneau
            </button>
          </div>

          <div className="divide-y divide-[#E7ECD9]">
            {HOURS.map((hour) => {
              const dayApts = appointments.filter(
                a => a.date === selectedDayDate && a.startTime.startsWith(hour.slice(0, 2))
              );
              return (
                <div key={hour} className="py-3 flex items-start gap-6 group hover:bg-[#F8F8F1] px-3 rounded-xl transition-colors">
                  <span className="w-16 text-[13px] font-semibold text-[#52604C] pt-1">
                    {hour}
                  </span>
                  <div className="flex-1">
                    {dayApts.length > 0 ? (
                      <div className="space-y-2">
                        {dayApts.map(apt => {
                          const style = getCardStyle(apt.type);
                          return (
                            <div
                              key={apt.id}
                              onClick={(e) => openEdit(apt, e)}
                              className={`${style.bg} ${style.border} border rounded-xl p-3 cursor-pointer flex items-center justify-between shadow-2xs`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-3 h-3 rounded-full ${style.dot}`} />
                                <div>
                                  <span className={`text-[12px] font-bold ${style.timeText}`}>
                                    {apt.startTime} - {apt.endTime} · {apt.type}
                                  </span>
                                  <h4 className="font-bold text-[14px] text-[#1B2F1C]">
                                    {apt.reason} — Patient : {apt.patientName} ({apt.clientName})
                                  </h4>
                                  {apt.notes && (
                                    <p className="text-[12px] text-[#52604C] mt-0.5">{apt.notes}</p>
                                  )}
                                </div>
                              </div>
                              <span className="text-[12px] px-2.5 py-1 rounded-full font-medium bg-white/80 border border-[#C7D2BA] text-[#1B2F1C]">
                                {apt.veterinarian}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <button
                        onClick={() => openNewSlot(selectedDayDate, hour)}
                        className="text-[12.5px] text-[#859766] hover:text-[#3A683D] font-medium py-1 transition-colors cursor-pointer"
                      >
                        + Créneau libre
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointment Creation / Edit Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        initialAppointment={editingAppointment}
        defaultDate={slotDate}
        defaultTime={slotTime}
      />
    </div>
  );
};
