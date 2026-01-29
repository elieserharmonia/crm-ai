
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import ForecastTab from './tabs/ForecastTab';
import DashboardTab from './tabs/DashboardTab';
import GoalsTab from './tabs/GoalsTab';
import CompaniesTab from './tabs/CompaniesTab';
import DiaryTab from './tabs/DiaryTab';
import SettingsTab from './tabs/SettingsTab';
import OrdersTab from './tabs/OrdersTab';
import DetailPanel from './components/DetailPanel';
import LoginPage from './components/LoginPage';
import { ForecastRow, Goal, SalesPersonProfile, Tab, User, Notification, Contact, PurchaseOrder } from './types';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { notificationService } from './services/notificationService';
import { AlertCircle, UserCircle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Forecast);
  const [data, setData] = useState<ForecastRow[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [profile, setProfile] = useState<SalesPersonProfile>({ name: '', email: '' });
  const [selectedRow, setSelectedRow] = useState<ForecastRow | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companiesResetTrigger, setCompaniesResetTrigger] = useState(0);

  useEffect(() => {
    try {
      const session = authService.getCurrentUser();
      if (session) setUser(session);
      
      setData(storageService.getForecast());
      setGoals(storageService.getGoals());
      setPos(storageService.getPOs());
      setProfile(storageService.getProfile());
      
      const savedContacts = localStorage.getItem('crm_ia_contacts_db');
      if (savedContacts) setContacts(JSON.parse(savedContacts));
    } catch (e) {
      console.error("Initialization Error:", e);
    }
  }, []);

  useEffect(() => {
    setSelectedRow(null);
  }, [activeTab]);

  useEffect(() => {
    notificationService.getAlerts(data).then(setNotifications);
    storageService.saveForecast(data);
  }, [data]);

  useEffect(() => {
    storageService.saveGoals(goals);
  }, [goals]);

  const filteredData = useMemo(() => {
    if (!user) return [];
    if (!profile.name || profile.name.trim() === "") return [];
    if (user.role === 'gestor') return data;
    const profileName = profile.name.toUpperCase().trim();
    return data.filter(row => {
      const respName = (row['RESP.'] || '').toUpperCase().trim();
      return respName.includes(profileName) || profileName.includes(respName);
    });
  }, [data, user, profile]);

  const updateRow = (updatedRow: ForecastRow) => {
    setData(data.map(r => r.id === updatedRow.id ? updatedRow : r));
    setSelectedRow(updatedRow);
  };

  const handleLogin = (newUser: User) => setUser(newUser);
  const handleLogout = () => { authService.logout(); setUser(null); };

  const handleTabChange = (tab: Tab) => {
    if (tab === Tab.Companies) {
      setCompaniesResetTrigger(prev => prev + 1);
    }
    setActiveTab(tab);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const isProfileEmpty = !profile.name || profile.name.trim() === "";

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={handleTabChange} 
      user={user} 
      profile={profile}
      onLogout={handleLogout}
      notifications={notifications}
    >
      <div className="h-full relative">
        {isProfileEmpty && activeTab !== Tab.Settings ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-blue-200">
              <UserCircle size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Acesso Bloqueado</h2>
            <p className="text-slate-500 max-w-sm mt-2 font-medium">Configure seu perfil para liberar os dados.</p>
            <button 
              onClick={() => setActiveTab(Tab.Settings)}
              className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all"
            >
              CONFIGURAR AGORA
            </button>
          </div>
        ) : (
          <>
            {activeTab === Tab.Forecast && (
              <ForecastTab data={filteredData} setData={setData} onRowSelect={setSelectedRow} user={user} />
            )}
            {activeTab === Tab.Dashboard && <DashboardTab data={filteredData} profile={profile} />}
            {activeTab === Tab.Goals && (
              <GoalsTab 
                data={filteredData} 
                goals={goals} 
                setGoals={setGoals} 
                onGoalClick={() => setActiveTab(Tab.Forecast)} 
                profile={profile}
              />
            )}
            {activeTab === Tab.Orders && <OrdersTab pos={pos} setPos={setPos} />}
            {activeTab === Tab.Companies && (
              <CompaniesTab data={filteredData} contacts={contacts} setContacts={setContacts} resetTrigger={companiesResetTrigger} onFilterByCompany={() => setActiveTab(Tab.Forecast)} />
            )}
            {activeTab === Tab.Diary && <DiaryTab data={filteredData} />}
            {activeTab === Tab.Settings && <SettingsTab profile={profile} setProfile={setProfile} user={user} />}
          </>
        )}

        {selectedRow && (
          <DetailPanel 
            row={selectedRow} 
            profile={profile}
            onClose={() => setSelectedRow(null)} 
            onUpdate={updateRow}
            user={user}
            contacts={contacts}
          />
        )}
      </div>
    </Layout>
  );
};

export default App;
