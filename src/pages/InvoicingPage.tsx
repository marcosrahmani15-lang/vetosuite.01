import React, { useState } from 'react';
import { Receipt, Plus, Search, Filter, Download, CheckCircle, Clock } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  patientName: string;
  date: string;
  amount: number;
  status: 'Payée' | 'En attente' | 'Devis';
}

const INITIAL_INVOICES: Invoice[] = [
  { id: '1', number: 'FAC-2026-0842', clientName: 'Fatima Fatima', patientName: 'Nina', date: '14/08/2026', amount: 85.00, status: 'Payée' },
  { id: '2', number: 'FAC-2026-0841', clientName: 'Marc Dubois', patientName: 'Rocky', date: '13/08/2026', amount: 420.00, status: 'Payée' },
  { id: '3', number: 'FAC-2026-0840', clientName: 'Sophie Lambert', patientName: 'Félix', date: '13/08/2026', amount: 62.50, status: 'Payée' },
  { id: '4', number: 'FAC-2026-0839', clientName: 'Thomas Laurent', patientName: 'Maya', date: '11/08/2026', amount: 110.00, status: 'En attente' },
  { id: '5', number: 'DEV-2026-0104', clientName: 'Thomas Laurent', patientName: 'Maya', date: '10/08/2026', amount: 650.00, status: 'Devis' }
];

export const InvoicingPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'Payée' | 'En attente' | 'Devis'>('Tous');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInv, setNewInv] = useState({ clientName: '', patientName: '', amount: '75.00', status: 'Payée' });

  const filtered = invoices.filter(i => {
    const matchesSearch = i.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Tous' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = invoices.filter(i => i.status === 'Payée').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'En attente').reduce((acc, curr) => acc + curr.amount, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const isDevis = newInv.status === 'Devis';
    const prefix = isDevis ? 'DEV-2026-' : 'FAC-2026-';
    const created: Invoice = {
      id: `${Date.now()}`,
      number: `${prefix}${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: newInv.clientName,
      patientName: newInv.patientName,
      date: '14/08/2026',
      amount: parseFloat(newInv.amount) || 0,
      status: newInv.status as any
    };
    setInvoices([created, ...invoices]);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1580px] w-full mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-[#3A683D]" />
            <h1 className="text-[26px] font-bold text-[#1B2F1C] tracking-tight">
              Facturation & Devis
            </h1>
          </div>
          <p className="text-[14px] text-[#52604C] mt-0.5">
            Émission et suivi des factures d'honoraires, devis et encaissements
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#3A683D] hover:bg-[#2F5933] text-white px-5 py-2.5 rounded-xl font-semibold text-[13.5px] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle facture</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="Total encaissé ce mois" value={`${totalPaid.toFixed(2)} €`} />
        <StatCard title="En attente de paiement" value={`${totalPending.toFixed(2)} €`} valueColor="text-[#D97706]" />
        <StatCard title="Factures émises" value={invoices.length} />
      </div>

      <div className="bg-white rounded-2xl border border-[#C7D2BA] p-4 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#859766] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par numéro, client, patient..."
            className="w-full pl-10 pr-4 py-2 bg-[#F8F8F1] border border-[#C7D2BA] rounded-xl text-[14px] focus:outline-none focus:border-[#3A683D] focus:bg-white text-[#1B2F1C]"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['Tous', 'Payée', 'En attente', 'Devis'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#E7ECD9] text-[#1B2F1C] border border-[#C7D2BA]'
                  : 'bg-white text-[#52604C] border border-[#C7D2BA] hover:bg-[#F8F8F1]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#C7D2BA] shadow-2xs overflow-hidden">
        <table className="w-full text-left text-[13.5px]">
          <thead className="bg-[#F8F8F1] border-b border-[#C7D2BA] text-[12px] font-bold text-[#52604C] uppercase">
            <tr>
              <th className="py-3 px-5">Numéro</th>
              <th className="py-3 px-5">Client / Patient</th>
              <th className="py-3 px-5">Date</th>
              <th className="py-3 px-5">Montant TTC</th>
              <th className="py-3 px-5">Statut</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7ECD9]">
            {filtered.map(inv => (
              <tr key={inv.id} className="hover:bg-[#F8F8F1] transition-colors">
                <td className="py-4 px-5 font-bold text-[#1B2F1C]">{inv.number}</td>
                <td className="py-4 px-5">
                  <div className="font-semibold text-[#1B2F1C]">{inv.clientName}</div>
                  <div className="text-[12px] text-[#52604C]">Patient : {inv.patientName}</div>
                </td>
                <td className="py-4 px-5 text-[#52604C]">{inv.date}</td>
                <td className="py-4 px-5 font-bold text-[#1B2F1C]">{inv.amount.toFixed(2)} €</td>
                <td className="py-4 px-5">
                  <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-bold ${
                    inv.status === 'Payée'
                      ? 'bg-[#E7ECD9] text-[#3A683D]'
                      : inv.status === 'Devis'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="py-4 px-5 text-right">
                  <button
                    onClick={() => alert(`Téléchargement de la facture ${inv.number}`)}
                    className="p-1.5 hover:bg-[#E7ECD9] rounded-lg text-[#52604C] hover:text-[#1B2F1C] cursor-pointer"
                    title="Télécharger le PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Créer une facture ou un devis">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Nom du client *</label>
            <input
              type="text"
              value={newInv.clientName}
              onChange={(e) => setNewInv({ ...newInv, clientName: e.target.value })}
              placeholder="Ex : Fatima Fatima"
              className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Nom du patient *</label>
            <input
              type="text"
              value={newInv.patientName}
              onChange={(e) => setNewInv({ ...newInv, patientName: e.target.value })}
              placeholder="Ex : Nina"
              className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Montant TTC (€) *</label>
              <input
                type="number"
                step="0.01"
                value={newInv.amount}
                onChange={(e) => setNewInv({ ...newInv, amount: e.target.value })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Type de document</label>
              <select
                value={newInv.status}
                onChange={(e) => setNewInv({ ...newInv, status: e.target.value })}
                className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              >
                <option value="Payée">Facture payée</option>
                <option value="En attente">Facture en attente</option>
                <option value="Devis">Devis</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7ECD9]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-[#C7D2BA] rounded-xl text-[13px] text-[#52604C] hover:bg-[#F8F8F1] cursor-pointer">
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 bg-[#3A683D] text-white rounded-xl text-[13px] font-semibold hover:bg-[#2F5933] cursor-pointer">
              Générer le document
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
