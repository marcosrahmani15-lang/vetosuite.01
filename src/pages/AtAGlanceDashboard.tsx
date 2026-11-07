import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  ListTodo,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  BedDouble,
  Check,
  ShoppingBag,
  FileText
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { AppointmentModal } from '../components/agenda/AppointmentModal';
import { PrescriptionModal } from '../components/common/PrescriptionModal';
import { Modal } from '../components/common/Modal';
import { DataService, REFERENCE_DATE } from '../services/storage';
import { Appointment, Task, StockItem, TaskPriority, TaskCategory, TeamMember } from '../types';

export const AtAGlanceDashboard: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [appointments, setAppointments] = useState<Appointment[]>(() => DataService.getAppointments());
  const [tasks, setTasks] = useState<Task[]>(() => DataService.getTasks());
  const [stocks, setStocks] = useState<StockItem[]>(() => DataService.getStocks());

  // Modals
  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    priority: 'Urgente' as TaskPriority,
    category: 'Médicale' as TaskCategory,
    assignedTo: 'Dr. Martin' as TeamMember,
    dueDate: '2026-08-14'
  });

  const refreshAll = () => {
    setAppointments(DataService.getAppointments());
    setTasks(DataService.getTasks());
    setStocks(DataService.getStocks());
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Today's appointments (Reference date: 2026-08-14)
  const todayApts = appointments
    .filter(a => a.date === '2026-08-14')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const confirmedToday = todayApts.filter(a => a.status === 'Confirmé').length;

  // Urgent and overdue tasks
  const isOverdue = (task: Task) => {
    if (task.completed) return false;
    const due = new Date(task.dueDate);
    return due < REFERENCE_DATE;
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const urgentOrOverdueTasks = pendingTasks.filter(t => t.priority === 'Urgente' || isOverdue(t));
  const otherPendingTasks = pendingTasks.filter(t => t.priority !== 'Urgente' && !isOverdue(t));
  const displayedTasks = [...urgentOrOverdueTasks, ...otherPendingTasks].slice(0, 4);

  // Critical stocks
  const lowStockItems = stocks.filter(s => s.quantity <= s.minThreshold);

  // Toggle task completion directly from dashboard
  const handleToggleTask = (taskId: string) => {
    DataService.toggleTaskCompletion(taskId);
    refreshAll();
  };

  // Quick Restock action
  const handleQuickRestock = (stockId: string, addQty: number) => {
    DataService.adjustStock(stockId, addQty);
    refreshAll();
  };

  // Save appointment
  const handleSaveAppointment = (apt: Appointment) => {
    if (selectedApt) {
      DataService.updateAppointment(apt.id, apt);
    } else {
      DataService.addAppointment(apt);
    }
    refreshAll();
  };

  // Create task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(newTaskForm.dueDate);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

    DataService.addTask({
      title: newTaskForm.title,
      description: newTaskForm.description,
      priority: newTaskForm.priority,
      category: newTaskForm.category,
      assignedTo: newTaskForm.assignedTo,
      createdBy: 'Dr. Vétérinaire',
      dueDate: newTaskForm.dueDate,
      dueDateFormatted: formatted
    });

    setIsTaskModalOpen(false);
    setNewTaskForm({
      title: '',
      description: '',
      priority: 'Urgente',
      category: 'Médicale',
      assignedTo: 'Dr. Martin',
      dueDate: '2026-08-14'
    });
    refreshAll();
  };

  const getInitials = (name: string) => {
    if (name === 'Dr. Martin') return 'DM';
    if (name === 'Dr. Leroy') return 'DL';
    if (name === 'Dr. Bernard') return 'DB';
    return 'DV';
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1580px] w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="w-7 h-7 text-[#3A683D]" />
            <h1 className="text-[26px] font-bold text-[#1B2F1C] tracking-tight">
              En un coup d'œil
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[#E7ECD9] text-[#1B2F1C] border border-[#C7D2BA]">
              <Clock className="w-3.5 h-3.5 text-[#3A683D]" />
              <span>Vendredi 14 Août 2026</span>
            </span>
          </div>
          <p className="text-[14px] text-[#52604C] mt-0.5">
            Vue synthétique en direct : rendez-vous du jour, urgences cliniques et alertes pharmacie
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsPrescriptionModalOpen(true)}
            className="bg-[#E7ECD9] hover:bg-[#DCE3CB] text-[#1B2F1C] border border-[#C7D2BA] px-3.5 py-2 rounded-xl font-semibold text-[13px] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#3A683D]" />
            <span>Rédiger ordonnance</span>
          </button>

          <button
            onClick={() => {
              setSelectedApt(null);
              setIsAptModalOpen(true);
            }}
            className="bg-[#3A683D] hover:bg-[#2F5933] text-white px-4 py-2 rounded-xl font-semibold text-[13px] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau rendez-vous</span>
          </button>

          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="bg-white hover:bg-[#F8F8F1] text-[#1B2F1C] border border-[#C7D2BA] px-3.5 py-2 rounded-xl font-semibold text-[13px] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <ListTodo className="w-4 h-4 text-[#52604C]" />
            <span>Nouvelle tâche</span>
          </button>
        </div>
      </div>

      {/* 4 Key Performance & Alert StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div onClick={() => navigate('/agenda')} className="cursor-pointer group">
          <StatCard
            title="Rendez-vous aujourd'hui"
            value={`${todayApts.length}`}
            className="group-hover:border-[#3A683D]/60 transition-colors"
          />
        </div>

        <div onClick={() => navigate('/taches')} className="cursor-pointer group">
          <StatCard
            title="Tâches urgentes & retards"
            value={urgentOrOverdueTasks.length}
            valueColor={urgentOrOverdueTasks.length > 0 ? 'text-[#DC2626]' : 'text-[#3A683D]'}
            className="group-hover:border-[#3A683D]/60 transition-colors"
          />
        </div>

        <div onClick={() => navigate('/stocks')} className="cursor-pointer group">
          <StatCard
            title="Stocks sous le seuil critique"
            value={lowStockItems.length}
            valueColor={lowStockItems.length > 0 ? 'text-[#DC2626]' : 'text-[#3A683D]'}
            className="group-hover:border-[#3A683D]/60 transition-colors"
          />
        </div>

        <div onClick={() => navigate('/hospitalisation')} className="cursor-pointer group">
          <StatCard
            title="Animaux en hospitalisation"
            value="3"
            valueColor="text-[#5A7E32]"
            className="group-hover:border-[#3A683D]/60 transition-colors"
          />
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Appointments & Urgent Tasks */}
        <div className="lg:col-span-7 space-y-6">
          {/* Module 1: Daily Appointments */}
          <div className="bg-white rounded-2xl border border-[#C7D2BA] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7ECD9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E7ECD9] text-[#3A683D] flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#1B2F1C]">
                    Rendez-vous du jour
                  </h2>
                  <span className="text-[12px] text-[#52604C]">
                    {todayApts.length} consultations programmées ({confirmedToday} confirmées)
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/agenda')}
                className="text-[12.5px] font-semibold text-[#3A683D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Planning complet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Appointments List */}
            <div className="space-y-3">
              {todayApts.map((apt) => {
                const isVaccin = apt.type === 'Vaccin';
                const isUrgence = apt.type === 'Urgence';

                return (
                  <div
                    key={apt.id}
                    onClick={() => {
                      setSelectedApt(apt);
                      setIsAptModalOpen(true);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isVaccin
                        ? 'bg-[#E7ECD9]/40 border-[#C7D2BA]'
                        : isUrgence
                        ? 'bg-[#FEF2F2] border-[#FECDD3]'
                        : 'bg-[#F8F8F1] border-[#C7D2BA]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full block mt-1.5 ${
                            isVaccin
                              ? 'bg-[#5A7E32]'
                              : isUrgence
                              ? 'bg-[#DC2626]'
                              : 'bg-[#3A683D]'
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span
                            className={`font-mono text-[12.5px] font-bold ${
                              isVaccin ? 'text-[#5A7E32]' : isUrgence ? 'text-[#DC2626]' : 'text-[#3A683D]'
                            }`}
                          >
                            {apt.startTime} - {apt.endTime}
                          </span>
                          <span className="font-bold text-[14.5px] text-[#1B2F1C]">
                            {apt.patientName}
                          </span>
                          <span className="text-[12px] text-[#52604C]">
                            ({apt.clientName})
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              isVaccin
                                ? 'bg-[#E7ECD9] text-[#3A683D]'
                                : isUrgence
                                ? 'bg-red-100 text-red-700'
                                : 'bg-[#E7ECD9] text-[#1B2F1C]'
                            }`}
                          >
                            {apt.type}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#1B2F1C] font-medium">
                          {apt.reason}
                        </p>
                        {apt.notes && (
                          <p className="text-[11.5px] text-[#52604C] italic">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:self-center shrink-0">
                      <div className="text-right">
                        <span className="text-[12px] font-medium text-[#1B2F1C] block">
                          {apt.veterinarian}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            apt.status === 'Confirmé'
                              ? 'text-[#3A683D]'
                              : 'text-amber-700'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${apt.patientId}`);
                        }}
                        className="px-2.5 py-1 text-[11.5px] font-semibold bg-white border border-[#C7D2BA] hover:border-[#3A683D] rounded-lg text-[#1B2F1C] transition-colors cursor-pointer"
                        title="Ouvrir le dossier patient"
                      >
                        Fiche
                      </button>
                    </div>
                  </div>
                );
              })}

              {todayApts.length === 0 && (
                <div className="py-8 text-center text-[#52604C] text-[13.5px]">
                  Aucun rendez-vous planifié aujourd'hui.
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedApt(null);
                setIsAptModalOpen(true);
              }}
              className="w-full py-2.5 border border-dashed border-[#C7D2BA] hover:border-[#3A683D] hover:bg-[#E7ECD9]/30 rounded-xl text-[13px] font-semibold text-[#52604C] hover:text-[#3A683D] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un créneau pour aujourd'hui</span>
            </button>
          </div>

          {/* Module 2: Urgent & Overdue Team Tasks */}
          <div className="bg-white rounded-2xl border border-[#C7D2BA] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7ECD9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#1B2F1C]">
                    Tâches prioritaires & en retard
                  </h2>
                  <span className="text-[12px] text-[#52604C]">
                    {urgentOrOverdueTasks.length} action(s) requérant une attention clinique immédiate
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/taches')}
                className="text-[12.5px] font-semibold text-[#3A683D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Toutes les tâches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {displayedTasks.map((task) => {
                const overdue = isOverdue(task);

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all ${
                      overdue && !task.completed
                        ? 'border-[#FECDD3] bg-gradient-to-r from-[#FFFBFB] to-white'
                        : 'border-[#C7D2BA] bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox to complete task directly */}
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                          task.completed
                            ? 'bg-[#3A683D] border-[#3A683D] text-white'
                            : 'border-[#C7D2BA] hover:border-[#3A683D] bg-white'
                        }`}
                        title={task.completed ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h4
                            className={`text-[14.5px] font-bold text-[#1B2F1C] ${
                              task.completed ? 'line-through text-[#859766]' : ''
                            }`}
                          >
                            {task.title}
                          </h4>

                          {task.priority === 'Urgente' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#FEE2E2] text-[#DC2626]">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Urgente</span>
                            </span>
                          )}

                          {task.priority === 'Haute' && (
                            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#FEF3C7] text-[#D97706]">
                              Haute
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#E7ECD9] text-[#1B2F1C]">
                            {task.category}
                          </span>

                          {overdue && !task.completed && (
                            <span className="text-[11.5px] font-bold text-[#DC2626]">
                              En retard ({task.dueDateFormatted})
                            </span>
                          )}
                        </div>

                        <p className="text-[13px] text-[#52604C] leading-relaxed">
                          {task.description}
                        </p>

                        <div className="flex items-center justify-between pt-1 text-[12px] text-[#52604C]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-[#E7ECD9] text-[#3A683D] font-bold text-[8.5px] flex items-center justify-center">
                              {getInitials(task.assignedTo)}
                            </span>
                            <span className="font-medium text-[#1B2F1C]">{task.assignedTo}</span>
                          </div>

                          <span className="text-[11px] text-[#859766]">
                            Créée par {task.createdBy}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {displayedTasks.length === 0 && (
                <div className="py-6 text-center text-[#3A683D] text-[13.5px] font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Toutes les tâches urgentes sont à jour !</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Low-Stock Alerts & Inpatients & Quick Access */}
        <div className="lg:col-span-5 space-y-6">
          {/* Module 3: Low-Stock Alerts */}
          <div className="bg-white rounded-2xl border border-[#C7D2BA] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7ECD9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#1B2F1C]">
                    Alertes stock & réassort
                  </h2>
                  <span className="text-[12px] text-[#DC2626] font-semibold">
                    {lowStockItems.length} référence(s) sous le seuil minimal
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/stocks')}
                className="text-[12.5px] font-semibold text-[#3A683D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Pharmacie</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {lowStockItems.map((item) => {
                const ratio = Math.min(100, Math.round((item.quantity / item.minThreshold) * 100));

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-[#FEF2F2]/60 border border-[#FECDD3] rounded-xl space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#DC2626] text-white">
                            CRITIQUE
                          </span>
                          <span className="text-[11.5px] font-semibold text-[#52604C]">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-[14px] text-[#1B2F1C] mt-0.5">
                          {item.name}
                        </h4>
                        <span className="text-[11.5px] text-[#52604C]">
                          Fournisseur : {item.supplier}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[16px] font-extrabold text-[#DC2626] block">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="text-[11px] text-[#52604C]">
                          Seuil min : {item.minThreshold}
                        </span>
                      </div>
                    </div>

                    {/* Stock level progress bar */}
                    <div>
                      <div className="w-full bg-[#E7ECD9] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#DC2626] h-full rounded-full transition-all"
                          style={{ width: `${Math.max(10, ratio)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-[#52604C] mt-1 font-medium">
                        <span>{ratio}% du seuil de sécurité</span>
                        <span className="text-[#DC2626] font-semibold">
                          Manque {item.minThreshold - item.quantity} {item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Quick Restock buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#FECDD3]/50">
                      <button
                        onClick={() => handleQuickRestock(item.id, 1)}
                        className="px-2.5 py-1 text-[11.5px] font-semibold bg-white border border-[#C7D2BA] hover:border-[#1B2F1C] rounded-lg text-[#1B2F1C] transition-colors cursor-pointer"
                      >
                        +1 {item.unit}
                      </button>
                      <button
                        onClick={() => handleQuickRestock(item.id, item.id === '1' ? 10 : 5)}
                        className="px-3 py-1 text-[11.5px] font-semibold bg-[#3A683D] hover:bg-[#2F5933] text-white rounded-lg transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Réassort ({item.id === '1' ? '+10' : '+5'})</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {lowStockItems.length === 0 && (
                <div className="py-6 text-center text-[#3A683D] text-[13px] font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Tous les stocks sont à niveau optimal.</span>
                </div>
              )}
            </div>
          </div>

          {/* Module 4: Hospitalized Inpatients Overview */}
          <div className="bg-white rounded-2xl border border-[#C7D2BA] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7ECD9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E7ECD9] text-[#3A683D] flex items-center justify-center">
                  <BedDouble className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#1B2F1C]">
                    Animaux hospitalisés
                  </h2>
                  <span className="text-[12px] text-[#52604C]">
                    Box sous surveillance post-opératoire
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/hospitalisation')}
                className="text-[12.5px] font-semibold text-[#3A683D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Tableau des box</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  box: 'Box H2',
                  patient: 'Rocky',
                  species: 'Berger Allemand',
                  reason: 'Laparotomie J+2 — Soins pansement',
                  vet: 'Dr. Martin',
                  status: 'En convalescence',
                  statusColor: 'bg-[#E7ECD9] text-[#3A683D]'
                },
                {
                  box: 'Box H1',
                  patient: 'Félix',
                  species: 'Chat Européen',
                  reason: 'Perfusion réhydratation & bilan rénal',
                  vet: 'Dr. Leroy',
                  status: 'Stable',
                  statusColor: 'bg-[#E7ECD9] text-[#5A7E32]'
                },
                {
                  box: 'Box C1',
                  patient: 'Charly',
                  species: 'Chat Persan',
                  reason: 'Oxygénothérapie continue',
                  vet: 'Dr. Bernard',
                  status: 'Critique',
                  statusColor: 'bg-rose-100 text-rose-800'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#F8F8F1] border border-[#C7D2BA] rounded-xl flex items-center justify-between text-[13px] hover:border-[#859766] transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[12px] text-[#3A683D] bg-[#E7ECD9] px-1.5 py-0.5 rounded">
                        {item.box}
                      </span>
                      <span className="font-bold text-[#1B2F1C]">{item.patient}</span>
                      <span className="text-[11.5px] text-[#52604C]">({item.species})</span>
                    </div>
                    <p className="text-[12px] text-[#52604C]">{item.reason}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold block ${item.statusColor}`}>
                      {item.status}
                    </span>
                    <span className="text-[11px] text-[#859766] mt-0.5 block">{item.vet}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="bg-[#E7ECD9]/50 border border-[#C7D2BA] rounded-2xl p-4.5 space-y-3">
            <h3 className="text-[13.5px] font-bold text-[#1B2F1C]">
              Accès rapide aux dossiers cliniques
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/patients/nina')}
                className="p-2.5 bg-white border border-[#C7D2BA] hover:border-[#3A683D] rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E7ECD9] flex items-center justify-center text-lg shrink-0">
                  🐱
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[13px] text-[#1B2F1C] truncate">Nina</div>
                  <div className="text-[11px] text-[#52604C] truncate">Fatima Fatima</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/cloture-caisse')}
                className="p-2.5 bg-white border border-[#C7D2BA] hover:border-[#3A683D] rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E7ECD9] text-[#3A683D] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[13px] text-[#1B2F1C] truncate">Clôture Caisse</div>
                  <div className="text-[11px] text-[#52604C] truncate">920.00 € encaissés</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAptModalOpen}
        onClose={() => setIsAptModalOpen(false)}
        onSave={handleSaveAppointment}
        initialAppointment={selectedApt}
        defaultDate="2026-08-14"
        defaultTime="14:00"
      />

      {/* Official Prescription Modal */}
      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
      />

      {/* Quick Task Creation Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Ajouter une tâche urgente"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
              Titre de la tâche *
            </label>
            <input
              type="text"
              value={newTaskForm.title}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
              placeholder="Ex : Commande anesthésiques, Vérification glycémie..."
              className="w-full px-3 py-2 text-[14px] bg-white border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
              Description / Consignes *
            </label>
            <textarea
              value={newTaskForm.description}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
              rows={3}
              placeholder="Instructions pour l'équipe..."
              className="w-full px-3 py-2 text-[14px] bg-white border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
                Priorité
              </label>
              <select
                value={newTaskForm.priority}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 text-[14px] bg-white border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              >
                <option value="Urgente">Urgente</option>
                <option value="Haute">Haute</option>
                <option value="Normale">Normale</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
                Assignée à
              </label>
              <select
                value={newTaskForm.assignedTo}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, assignedTo: e.target.value as TeamMember })}
                className="w-full px-3 py-2 text-[14px] bg-white border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              >
                <option value="Dr. Martin">Dr. Martin</option>
                <option value="Dr. Leroy">Dr. Leroy</option>
                <option value="Dr. Bernard">Dr. Bernard</option>
                <option value="Dr. Vétérinaire">Dr. Vétérinaire</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7ECD9]">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 border border-[#C7D2BA] rounded-xl text-[13px] text-[#52604C] hover:bg-[#F8F8F1] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3A683D] text-white rounded-xl text-[13px] font-semibold hover:bg-[#2F5933] cursor-pointer"
            >
              Créer la tâche
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
