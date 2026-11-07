import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PawPrint,
  LayoutDashboard,
  Stethoscope,
  CalendarDays,
  Users,
  Receipt,
  CreditCard,
  BedDouble,
  ListTodo,
  Package,
  BarChart3,
  Settings,
  Globe,
  Menu,
  X
} from 'lucide-react';
import { MyVetLogo } from '../common/MyVetLogo';

interface NavItem {
  id: string;
  path: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    path: '/',
    title: "En un coup d'œil",
    subtitle: "Régulation & alertes du jour",
    icon: LayoutDashboard
  },
  {
    id: 'patients',
    path: '/patients',
    title: 'Dossier Médical & Animaux',
    subtitle: 'Fiches patients et historique m...',
    icon: Stethoscope
  },
  {
    id: 'agenda',
    path: '/agenda',
    title: 'Agenda & Planning',
    subtitle: 'Rendez-vous et planning',
    icon: CalendarDays
  },
  {
    id: 'clients',
    path: '/clients',
    title: 'Relations Clients & Rappels',
    subtitle: 'Clients et rappels automatiques',
    icon: Users
  },
  {
    id: 'invoicing',
    path: '/facturation',
    title: 'Facturation & Devis',
    subtitle: 'Factures et devis',
    icon: Receipt
  },
  {
    id: 'cash',
    path: '/cloture-caisse',
    title: 'Clôture de caisse',
    subtitle: 'Rapport de fin de journée',
    icon: CreditCard
  },
  {
    id: 'hospitalization',
    path: '/hospitalisation',
    title: 'Suivi hospitalisation',
    subtitle: 'Tableau de bord des soins',
    icon: BedDouble
  },
  {
    id: 'tasks',
    path: '/taches',
    title: "Tâches d'équipe",
    subtitle: 'Assignation et suivi des tâches',
    icon: ListTodo
  },
  {
    id: 'inventory',
    path: '/stocks',
    title: 'Gestion des Stocks',
    subtitle: 'Pharmacie et inventaire',
    icon: Package
  },
  {
    id: 'reports',
    path: '/rapports',
    title: 'Rapports & Statistiques',
    subtitle: 'Analyses et tableaux de bord',
    icon: BarChart3
  },
  {
    id: 'settings',
    path: '/parametres',
    title: 'Paramètres',
    subtitle: 'Langue et préférences',
    icon: Settings
  }
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('Français');

  const isActive = (itemPath: string) => {
    if (itemPath === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    if (itemPath === '/patients' && location.pathname.startsWith('/patients')) return true;
    return location.pathname === itemPath;
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] border-r border-[#C7D2BA] select-none">
      {/* Brand Header */}
      <div
        onClick={() => handleNavClick('/')}
        className="px-4 py-4 border-b border-[#E7ECD9] cursor-pointer hover:bg-[#F8F8F1] transition-colors"
      >
        <MyVetLogo variant="header" showSlogan={false} />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                active
                  ? 'bg-[#E7ECD9] border border-[#C7D2BA] shadow-2xs'
                  : 'hover:bg-[#F8F8F1] border border-transparent'
              }`}
            >
              <div
                className={`mt-0.5 shrink-0 transition-colors ${
                  active ? 'text-[#3A683D]' : 'text-[#859766]'
                }`}
              >
                <IconComponent className="w-[18px] h-[18px]" />
              </div>
              <div className="flex flex-col min-w-0 pr-1">
                <span
                  className={`text-[13.5px] font-semibold leading-snug truncate ${
                    active ? 'text-[#1B2F1C] font-bold' : 'text-[#1B2F1C]'
                  }`}
                >
                  {item.title}
                </span>
                <span
                  className={`text-[11px] leading-tight truncate ${
                    active ? 'text-[#3A683D] font-medium' : 'text-[#52604C]'
                  }`}
                >
                  {item.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Fixed Bottom Section */}
      <div className="p-4 border-t border-[#C7D2BA] space-y-3 shrink-0 bg-[#FFFFFF]">
        {/* Language selector */}
        <div className="flex items-center gap-2 px-3 py-2 border border-[#C7D2BA] rounded-lg bg-[#F8F8F1] text-[13px] text-[#1B2F1C] font-medium shadow-2xs">
          <Globe className="w-4 h-4 text-[#859766]" />
          <span className="flex-1 text-[13px]">{currentLang}</span>
        </div>

        {/* Veterinarian Profile */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-9 h-9 rounded-full bg-[#E7ECD9] text-[#3A683D] border border-[#C7D2BA] font-bold text-xs flex items-center justify-center shrink-0">
            DV
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-[13px] text-[#1B2F1C] truncate">
              Dr. Vétérinaire
            </span>
            <span className="text-[11px] text-[#859766] truncate">
              My Vet — Ouled Fayet
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-white rounded-lg border border-[#C7D2BA] shadow-sm text-[#1B2F1C]"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-[275px] transform transition-transform duration-200 ease-in-out shadow-xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-[272px] shrink-0 h-screen sticky top-0 border-r border-[#C7D2BA] bg-white z-20">
        {sidebarContent}
      </aside>
    </>
  );
};
