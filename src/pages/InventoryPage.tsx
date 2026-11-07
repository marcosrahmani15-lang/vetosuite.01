import React, { useState } from 'react';
import { Package, AlertTriangle, Plus, Search, ArrowUpDown, Check } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';

import { DataService } from '../services/storage';
import { StockItem } from '../types';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>(() => DataService.getStocks());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Vaccin',
    supplier: 'BioVet Distribution',
    quantity: 10,
    minThreshold: 5,
    unit: 'boîtes'
  });

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const criticalCount = items.filter(i => i.quantity <= i.minThreshold).length;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const created: StockItem = {
      id: `${Date.now()}`,
      name: newItem.name,
      category: newItem.category as any,
      supplier: newItem.supplier,
      quantity: Number(newItem.quantity),
      minThreshold: Number(newItem.minThreshold),
      unit: newItem.unit,
      status: Number(newItem.quantity) <= Number(newItem.minThreshold) ? 'Critique' : 'Normal'
    };
    const updated = [created, ...items];
    DataService.saveStocks(updated);
    setItems(updated);
    setIsModalOpen(false);
  };

  const adjustQuantity = (id: string, delta: number) => {
    const updated = DataService.adjustStock(id, delta);
    setItems(updated);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1580px] w-full mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Package className="w-7 h-7 text-[#3A683D]" />
            <h1 className="text-[26px] font-bold text-[#1B2F1C] tracking-tight">
              Gestion des Stocks
            </h1>
          </div>
          <p className="text-[14px] text-[#52604C] mt-0.5">
            Pharmacie clinique, consommables chirurgicaux et réassorts
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#3A683D] hover:bg-[#2F5933] text-white px-5 py-2.5 rounded-xl font-semibold text-[13.5px] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel article</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="Total références" value={items.length} />
        <StatCard title="Alertes stock critique" value={criticalCount} valueColor={criticalCount > 0 ? "text-[#DC2626]" : "text-[#3A683D]"} />
        <StatCard title="Fournisseurs actifs" value="4" />
      </div>

      {criticalCount > 0 && (
        <div className="bg-[#FEF2F2] border border-[#FECDD3] rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
          <div className="flex-1 text-[13px] text-[#991B1B]">
            <strong>Alerte réassort impératif :</strong> Le vaccin contre la rage est actuellement en rupture critique ({items.find(i => i.id === '1')?.quantity} doses restantes). Une commande BioVet est requise.
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#C7D2BA] p-4 flex items-center gap-4 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#859766] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par désignation, molécule, catégorie, fournisseur..."
            className="w-full pl-10 pr-4 py-2 bg-[#F8F8F1] border border-[#C7D2BA] rounded-xl text-[14px] focus:outline-none focus:border-[#3A683D] focus:bg-white text-[#1B2F1C]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#C7D2BA] shadow-2xs overflow-hidden">
        <table className="w-full text-left text-[13.5px]">
          <thead className="bg-[#F8F8F1] border-b border-[#C7D2BA] text-[12px] font-bold text-[#52604C] uppercase">
            <tr>
              <th className="py-3 px-5">Désignation</th>
              <th className="py-3 px-5">Catégorie</th>
              <th className="py-3 px-5">Fournisseur</th>
              <th className="py-3 px-5">Stock actuel</th>
              <th className="py-3 px-5">Statut</th>
              <th className="py-3 px-5 text-right">Ajuster</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7ECD9]">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-[#F8F8F1] transition-colors">
                <td className="py-4 px-5 font-bold text-[#1B2F1C]">{item.name}</td>
                <td className="py-4 px-5 text-[#52604C]">{item.category}</td>
                <td className="py-4 px-5 text-[#52604C]">{item.supplier}</td>
                <td className="py-4 px-5">
                  <span className={`font-bold text-[14px] ${item.quantity <= item.minThreshold ? 'text-[#DC2626]' : 'text-[#1B2F1C]'}`}>
                    {item.quantity} {item.unit}
                  </span>
                  <span className="text-[11.5px] text-[#859766] block">Seuil min : {item.minThreshold}</span>
                </td>
                <td className="py-4 px-5">
                  <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-bold ${
                    item.quantity <= item.minThreshold
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-[#E7ECD9] text-[#3A683D]'
                  }`}>
                    {item.quantity <= item.minThreshold ? 'Critique' : 'Conforme'}
                  </span>
                </td>
                <td className="py-4 px-5 text-right space-x-1">
                  <button
                    onClick={() => adjustQuantity(item.id, -1)}
                    className="w-7 h-7 bg-white border border-[#C7D2BA] rounded-lg text-sm font-bold text-[#52604C] hover:text-[#1B2F1C] hover:bg-[#E7ECD9] cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    onClick={() => adjustQuantity(item.id, 1)}
                    className="w-7 h-7 bg-white border border-[#C7D2BA] rounded-lg text-sm font-bold text-[#52604C] hover:text-[#1B2F1C] hover:bg-[#E7ECD9] cursor-pointer"
                  >
                    +
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter un article en stock">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Désignation de l'article *</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Catégorie</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full px-3 py-2 border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              >
                <option value="Vaccin">Vaccin</option>
                <option value="Antibiotique">Antibiotique</option>
                <option value="Anti-inflammatoire">Anti-inflammatoire</option>
                <option value="Matériel">Matériel chirurgical</option>
                <option value="Alimentation">Alimentation</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Fournisseur</label>
              <input
                type="text"
                value={newItem.supplier}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Quantité</label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Seuil minimal</label>
              <input
                type="number"
                value={newItem.minThreshold}
                onChange={(e) => setNewItem({ ...newItem, minThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">Unité</label>
              <input
                type="text"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                className="w-full px-3 py-2 border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7ECD9]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-[#C7D2BA] rounded-xl text-[13px] text-[#52604C] hover:bg-[#F8F8F1] cursor-pointer">
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 bg-[#3A683D] text-white rounded-xl text-[13px] font-semibold hover:bg-[#2F5933] cursor-pointer">
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
