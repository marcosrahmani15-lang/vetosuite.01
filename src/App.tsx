import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AtAGlanceDashboard } from './pages/AtAGlanceDashboard';
import { AgendaPage } from './pages/AgendaPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailsPage } from './pages/PatientDetailsPage';
import { TeamTasksPage } from './pages/TeamTasksPage';
import { ClientsPage } from './pages/ClientsPage';
import { InvoicingPage } from './pages/InvoicingPage';
import { CashClosingPage } from './pages/CashClosingPage';
import { HospitalizationPage } from './pages/HospitalizationPage';
import { InventoryPage } from './pages/InventoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<AtAGlanceDashboard />} />
          <Route path="/dashboard" element={<AtAGlanceDashboard />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/:id" element={<PatientDetailsPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/facturation" element={<InvoicingPage />} />
          <Route path="/cloture-caisse" element={<CashClosingPage />} />
          <Route path="/hospitalisation" element={<HospitalizationPage />} />
          <Route path="/taches" element={<TeamTasksPage />} />
          <Route path="/stocks" element={<InventoryPage />} />
          <Route path="/rapports" element={<ReportsPage />} />
          <Route path="/parametres" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/agenda" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
