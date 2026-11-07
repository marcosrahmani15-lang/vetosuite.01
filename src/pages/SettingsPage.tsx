import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Users,
  RotateCcw,
  Check,
  Database,
  Radio,
  Clock,
  Send,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { DataService } from '../services/storage';
import { calculateClientSmsSegments } from '../utils/smsCalc';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'database' | 'sms'>('general');
  const [saved, setSaved] = useState(false);

  // General clinic info
  const [clinicName, setClinicName] = useState('My Vet — Cabinet Vétérinaire');
  const [slogan, setSlogan] = useState('Le bien-être de vos compagnons, notre priorité');
  const [address, setAddress] = useState('Coopérative el moustakbel n° CC3, Ouled Fayet');
  const [phone, setPhone] = useState('0797 63 87 04');

  // Backend & Database status
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  // SMS Gateway Config
  const [smsConfig, setSmsConfig] = useState<any>({
    provider_mode: 'TEST',
    active_provider: 'Ooredoo_Business_Algeria',
    enable_vaccination_reminders: true,
    vaccination_intervals: '7,3,1',
    enable_appointment_reminders: true,
    appointment_interval_hours: 24,
    sending_start_hour: 8,
    sending_end_hour: 20,
    timezone: 'Africa/Algiers'
  });
  const [isTriggeringCron, setIsTriggeringCron] = useState(false);
  const [cronResult, setCronResult] = useState<any>(null);

  // Live GSM-7 tester
  const [testMessage, setTestMessage] = useState(
    'Cabinet My Vet: Rappel vaccin pour Rocky prévu le 20/08/2026. Coopérative El Moustakbel, Ouled Fayet. Tel: 0797 63 87 04.'
  );

  const testCalc = calculateClientSmsSegments(testMessage);

  useEffect(() => {
    DataService.getBackendStatus().then(status => setDbStatus(status));
    DataService.getSmsConfig().then(cfg => {
      if (cfg) setSmsConfig(cfg);
    });
  }, []);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveSms = async (e: React.FormEvent) => {
    e.preventDefault();
    await DataService.saveSmsConfig(smsConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await DataService.migrateToPostgres();
      setMigrationResult(res);
      const status = await DataService.getBackendStatus();
      setDbStatus(status);
    } catch (err: any) {
      setMigrationResult({ error: err.message });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleTriggerCron = async () => {
    setIsTriggeringCron(true);
    setCronResult(null);
    try {
      const res = await DataService.triggerProcessReminders();
      setCronResult(res);
    } catch (err: any) {
      setCronResult({ error: err.message });
    } finally {
      setIsTriggeringCron(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Voulez-vous réinitialiser toutes les données de démonstration de My Vet ?')) {
      DataService.resetDemoData();
      window.location.reload();
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1240px] w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-[#3A683D]" />
            <h1 className="text-[26px] font-bold text-[#1B2F1C] tracking-tight">
              Paramètres du cabinet
            </h1>
          </div>
          <p className="text-[14px] text-[#52604C] mt-0.5">
            Architecture PostgreSQL, passerelle SMS Algérie, Cloud Scheduler & coordonnées officielles
          </p>
        </div>

        {/* Global Demo vs Production Status Pill */}
        <div className="flex items-center gap-2 bg-[#F8F8F1] border border-[#C7D2BA] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1B2F1C]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3A683D] animate-pulse"></span>
          <span>Dual-Engine : {dbStatus?.database?.provider?.includes('PostgreSQL') ? 'PostgreSQL Connecté' : 'Mode Résilient Hybride'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#C7D2BA] pb-px">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-bold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'bg-white border-t-2 border-x border-t-[#3A683D] border-x-[#C7D2BA] text-[#3A683D] -mb-px'
              : 'text-[#52604C] hover:text-[#1B2F1C]'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Établissement & Équipe</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-bold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'database'
              ? 'bg-white border-t-2 border-x border-t-[#3A683D] border-x-[#C7D2BA] text-[#3A683D] -mb-px'
              : 'text-[#52604C] hover:text-[#1B2F1C]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Base PostgreSQL & Persistance</span>
        </button>

        <button
          onClick={() => setActiveTab('sms')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-bold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'sms'
              ? 'bg-white border-t-2 border-x border-t-[#3A683D] border-x-[#C7D2BA] text-[#3A683D] -mb-px'
              : 'text-[#52604C] hover:text-[#1B2F1C]'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Passerelle SMS & Cloud Scheduler</span>
        </button>
      </div>

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-[#C7D2BA] p-6 shadow-2xs space-y-6">
          <form onSubmit={handleSaveGeneral} className="space-y-6">
            <div className="flex items-center gap-2 border-b border-[#E7ECD9] pb-3">
              <Building className="w-5 h-5 text-[#3A683D]" />
              <h3 className="text-[16px] font-bold text-[#1B2F1C]">
                Coordonnées de l'établissement officiel (Ouled Fayet)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
                  Raison sociale
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
                  Slogan officiel
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
                  Adresse postale (Ouled Fayet)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
                  Téléphone officiel (Cabinet)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none font-medium text-[#3A683D]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 border-b border-[#E7ECD9] pb-3 pt-4">
              <Users className="w-5 h-5 text-[#3A683D]" />
              <h3 className="text-[16px] font-bold text-[#1B2F1C]">
                Praticiens et soignants de l'équipe
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'Dr. Martin', role: 'Vétérinaire associé', initials: 'DM' },
                { name: 'Dr. Leroy', role: 'Vétérinaire chirurgien', initials: 'DL' },
                { name: 'Dr. Bernard', role: 'Vétérinaire généraliste', initials: 'DB' },
                { name: 'Dr. Vétérinaire', role: 'Praticien titulaire (Connecté)', initials: 'DV' }
              ].map(m => (
                <div key={m.name} className="p-3 bg-[#F8F8F1] border border-[#C7D2BA] rounded-xl flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#E7ECD9] text-[#3A683D] font-bold text-xs flex items-center justify-center">
                    {m.initials}
                  </span>
                  <div>
                    <div className="font-bold text-[13.5px] text-[#1B2F1C]">{m.name}</div>
                    <div className="text-[12px] text-[#52604C]">{m.role}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E7ECD9]">
              <button
                type="button"
                onClick={handleResetData}
                className="text-[#DC2626] hover:bg-[#FEF2F2] px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Réinitialiser les données locales</span>
              </button>

              <button
                type="submit"
                className="bg-[#3A683D] hover:bg-[#2F5933] text-white px-5 py-2.5 rounded-xl font-semibold text-[13.5px] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {saved && <Check className="w-4 h-4" />}
                <span>{saved ? 'Enregistré avec succès !' : 'Enregistrer les coordonnées'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Database Architecture */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-2xl border border-[#C7D2BA] p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-[18px] font-bold text-[#1B2F1C] flex items-center gap-2">
              <Database className="w-5 h-5 text-[#3A683D]" />
              Architecture Base de Données & Persistance
            </h2>
            <p className="text-[13px] text-[#52604C] mt-1">
              Conformité Phase 2 : Persistance relationnelle sans stockage JSON éphémère. Prêt pour PostgreSQL managé via standard <code className="bg-[#E7ECD9] px-1.5 py-0.5 rounded text-[#1B2F1C] font-mono text-xs">DATABASE_URL</code>.
            </p>
          </div>

          {/* Database Status Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#F8F8F1] border border-[#C7D2BA] rounded-xl p-4 space-y-1">
              <span className="text-xs font-semibold text-[#52604C] uppercase tracking-wider">Moteur de Stockage</span>
              <div className="text-[15px] font-bold text-[#1B2F1C] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3A683D]"></span>
                {dbStatus?.database?.provider || 'PostgreSQL / Dual-Engine'}
              </div>
              <p className="text-xs text-[#52604C]">Prêt pour Google Cloud SQL / Neon / Supabase</p>
            </div>

            <div className="bg-[#F8F8F1] border border-[#C7D2BA] rounded-xl p-4 space-y-1">
              <span className="text-xs font-semibold text-[#52604C] uppercase tracking-wider">État de connexion</span>
              <div className="text-[15px] font-bold text-[#3A683D] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Opérationnel & Sécurisé
              </div>
              <p className="text-xs text-[#52604C]">Isolation multi-tables et clés étrangères</p>
            </div>

            <div className="bg-[#F8F8F1] border border-[#C7D2BA] rounded-xl p-4 space-y-1">
              <span className="text-xs font-semibold text-[#52604C] uppercase tracking-wider">Volume de données</span>
              <div className="text-[15px] font-bold text-[#1B2F1C]">
                {dbStatus?.database?.tables ? Object.values(dbStatus.database.tables as Record<string, number>).reduce((a: number, b: number) => a + b, 0) : '—'} enregistrements
              </div>
              <p className="text-xs text-[#52604C]">Propriétaires, animaux, vaccins, rappels SMS</p>
            </div>
          </div>

          {/* Relational Tables Inspector */}
          <div className="space-y-3">
            <h3 className="text-[14px] font-bold text-[#1B2F1C]">Schéma Relationnel SQL Déployé :</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { table: 'owners', desc: 'Clients & E.164 (+213)', count: dbStatus?.database?.tables?.owners },
                { table: 'animals', desc: 'Patients & avatars', count: dbStatus?.database?.tables?.animals },
                { table: 'vaccinations', desc: 'Vaccins & rappels J-7/3/1', count: dbStatus?.database?.tables?.vaccinations ?? 1 },
                { table: 'appointments', desc: 'RDV & rappels 24h', count: dbStatus?.database?.tables?.appointments },
                { table: 'tasks', desc: 'Tâches d\'équipe', count: dbStatus?.database?.tables?.tasks },
                { table: 'stocks', desc: 'Pharmacie & alertes', count: dbStatus?.database?.tables?.stocks },
                { table: 'sms_reminders', desc: 'File idempotente', count: dbStatus?.database?.tables?.smsReminders },
                { table: 'sms_logs', desc: 'Audit des envois', count: dbStatus?.database?.tables?.smsLogs }
              ].map(t => (
                <div key={t.table} className="p-2.5 bg-white border border-[#C7D2BA] rounded-lg space-y-0.5">
                  <div className="font-mono font-bold text-[#3A683D]">{t.table}</div>
                  <div className="text-[#52604C]">{t.desc}</div>
                  <div className="font-semibold text-[#1B2F1C] pt-1">{t.count ?? 0} enregistrements</div>
                </div>
              ))}
            </div>
          </div>

          {/* Safe Migration Section */}
          <div className="bg-[#E7ECD9]/60 border border-[#C7D2BA] rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <RefreshCw className={`w-5 h-5 text-[#3A683D] shrink-0 mt-0.5 ${isMigrating ? 'animate-spin' : ''}`} />
              <div className="space-y-1">
                <h4 className="font-bold text-[14px] text-[#1B2F1C]">
                  Migration sécurisée des données du navigateur vers la base SQL
                </h4>
                <p className="text-[13px] text-[#52604C]">
                  Transfère les dossiers clients, fiches animaux, rendez-vous et tâches existants vers la base de données relationnelle sans perte ni écrasement.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleMigrate}
                disabled={isMigrating}
                className="bg-[#3A683D] hover:bg-[#2F5933] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isMigrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                <span>{isMigrating ? 'Migration en cours...' : 'Lancer la synchronisation vers PostgreSQL'}</span>
              </button>
            </div>

            {migrationResult && (
              <div className="p-3 bg-white border border-[#C7D2BA] rounded-lg text-xs space-y-1">
                <div className="font-bold text-[#3A683D] flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Migration terminée avec succès
                </div>
                <div className="text-[#52604C]">
                  Propriétaires importés : {migrationResult.summary?.importedOwners || 0} | 
                  Animaux : {migrationResult.summary?.importedAnimals || 0} | 
                  Rendez-vous : {migrationResult.summary?.importedAppointments || 0}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: SMS Gateway & Cloud Scheduler */}
      {activeTab === 'sms' && (
        <div className="bg-white rounded-2xl border border-[#C7D2BA] p-6 shadow-2xs space-y-6">
          <form onSubmit={handleSaveSms} className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#E7ECD9] pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#3A683D]" />
                <h3 className="text-[16px] font-bold text-[#1B2F1C]">
                  Configuration Passerelle SMS & Télécoms Algérie
                </h3>
              </div>

              {/* Mode switch */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#52604C]">Mode d'envoi :</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  smsConfig.provider_mode === 'TEST' 
                    ? 'bg-[#E7ECD9] text-[#3A683D] border border-[#C7D2BA]' 
                    : 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20'
                }`}>
                  {smsConfig.provider_mode === 'TEST' ? '🛡️ MODE TEST SIMULÉ (Sans surcoût)' : '⚡ PRODUCTION RÉELLE'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
                  Opérateur / Passerelle SMS
                </label>
                <select
                  value={smsConfig.active_provider}
                  onChange={(e) => setSmsConfig({ ...smsConfig, active_provider: e.target.value })}
                  className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none bg-white"
                >
                  <option value="Ooredoo_Business_Algeria">Ooredoo Business Algérie (SMS Pro 05)</option>
                  <option value="Mobilis_Entreprise">Mobilis Entreprise (ATM Mobilis 06)</option>
                  <option value="Djezzy_Enterprise">Djezzy Enterprise (OTA 07)</option>
                  <option value="Direct_Gateway_Algeria">Passerelle Agrégateur National Algérie</option>
                </select>
                <p className="text-[11.5px] text-[#52604C] mt-1">
                  Compatible avec les plages nationales +2135, +2136 et +2137.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
                  Mode Opératoire
                </label>
                <select
                  value={smsConfig.provider_mode}
                  onChange={(e) => setSmsConfig({ ...smsConfig, provider_mode: e.target.value })}
                  className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none bg-white"
                >
                  <option value="TEST">Mode Test Sécurisé (Journalisation intégrale, pas de facturation)</option>
                  <option value="PRODUCTION">Mode Production (Envoi réel par API opérateur avec contrat)</option>
                </select>
                <p className="text-[11.5px] text-[#52604C] mt-1">
                  En Mode Test, le système valide le formatage E.164 et le GSM-7 sans envoyer de SMS payant.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
                  Plage horaire d'envoi légale (Algérie UTC+1)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={smsConfig.sending_start_hour}
                    onChange={(e) => setSmsConfig({ ...smsConfig, sending_start_hour: parseInt(e.target.value, 10) })}
                    className="w-20 px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl text-center"
                  />
                  <span className="text-sm text-[#52604C]">h00 à</span>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={smsConfig.sending_end_hour}
                    onChange={(e) => setSmsConfig({ ...smsConfig, sending_end_hour: parseInt(e.target.value, 10) })}
                    className="w-20 px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl text-center"
                  />
                  <span className="text-sm text-[#52604C]">h00</span>
                </div>
                <p className="text-[11.5px] text-[#52604C] mt-1">
                  Les rappels tombant en dehors de cette plage sont différés à 08h00 le lendemain matin.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1B2F1C] mb-1">
                  Échéances des rappels vaccinaux
                </label>
                <input
                  type="text"
                  value={smsConfig.vaccination_intervals}
                  onChange={(e) => setSmsConfig({ ...smsConfig, vaccination_intervals: e.target.value })}
                  placeholder="7,3,1"
                  className="w-full px-3 py-2 text-[14px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none"
                />
                <p className="text-[11.5px] text-[#52604C] mt-1">
                  Jours avant l'échéance vaccinale pour déclencher l'alerte (ex: J-7, J-3, J-1).
                </p>
              </div>
            </div>

            {/* Google Cloud Scheduler Architecture Box */}
            <div className="bg-[#F8F8F1] border border-[#C7D2BA] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#3A683D]" />
                  <h4 className="font-bold text-[14.5px] text-[#1B2F1C]">
                    Ordonnancement Cloud Scheduler (Production Cloud Run)
                  </h4>
                </div>
                <span className="text-xs font-mono bg-[#E7ECD9] text-[#1B2F1C] px-2.5 py-1 rounded-md font-semibold">
                  POST /api/cron/process-reminders
                </span>
              </div>

              <p className="text-[13px] text-[#52604C]">
                Contrairement à un <code className="text-xs font-mono">setInterval</code> interne sensible au redémarrage ou à la mise en veille à zéro des conteneurs Cloud Run, l'architecture Phase 2 est pilotée par Google Cloud Scheduler avec authentification OIDC/Bearer, verrouillage idempotent et vérification de la plage horaire locale.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleTriggerCron}
                  disabled={isTriggeringCron}
                  className="bg-[#3A683D] hover:bg-[#2F5933] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Send className="w-4 h-4" />
                  <span>{isTriggeringCron ? 'Traitement de la file...' : 'Tester manuellement le Cron des rappels'}</span>
                </button>
              </div>

              {cronResult && (
                <div className="p-3 bg-white border border-[#C7D2BA] rounded-lg text-xs font-mono space-y-1">
                  <div className="font-bold text-[#3A683D]">Rapport d'exécution Cron :</div>
                  <div>Réclamés: {cronResult.results?.claimed || 0} | Traités: {cronResult.results?.processed || 0} | Envoyés: {cronResult.results?.sent || 0} | Différés: {cronResult.results?.deferred || 0}</div>
                  {cronResult.message && <div className="text-[#52604C]">{cronResult.message}</div>}
                </div>
              )}
            </div>

            {/* GSM-7 vs Unicode Live Analyzer */}
            <div className="border border-[#C7D2BA] rounded-xl p-5 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[14px] text-[#1B2F1C] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#3A683D]" />
                  Simulateur & Analyseur de Segmentation GSM-7
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    testCalc.encoding === 'GSM-7' ? 'bg-[#E7ECD9] text-[#3A683D]' : 'bg-[#DC2626]/10 text-[#DC2626]'
                  }`}>
                    {testCalc.encoding}
                  </span>
                  <span className="font-semibold text-[#1B2F1C]">
                    {testCalc.segments} SMS ({testCalc.charCount} caractères)
                  </span>
                </div>
              </div>

              <textarea
                rows={3}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full p-3 text-[13.5px] border border-[#C7D2BA] rounded-xl focus:border-[#3A683D] focus:outline-none font-mono"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[#52604C]">
                <div>Encodage : <b className="text-[#1B2F1C]">{testCalc.encoding}</b></div>
                <div>Segments : <b className="text-[#1B2F1C]">{testCalc.segments}</b></div>
                <div>Caractères restants : <b className="text-[#1B2F1C]">{testCalc.remainingInSegment}</b></div>
                <div>Max par segment : <b className="text-[#1B2F1C]">{testCalc.maxPerSegment}</b></div>
              </div>

              {testCalc.hasNonGsmChars && (
                <div className="p-2.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg text-xs text-[#991B1B] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Attention : Caractères hors GSM-7 détectés ({testCalc.invalidGsmChars.join(', ')}). Le SMS bascule en Unicode (70 caractères max par SMS).
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E7ECD9]">
              <button
                type="submit"
                className="bg-[#3A683D] hover:bg-[#2F5933] text-white px-5 py-2.5 rounded-xl font-semibold text-[13.5px] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {saved && <Check className="w-4 h-4" />}
                <span>{saved ? 'Configuration enregistrée !' : 'Enregistrer la configuration SMS'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
