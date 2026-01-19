
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import ForecastTab from './tabs/ForecastTab';
import DashboardTab from './tabs/DashboardTab';
import GoalsTab from './tabs/GoalsTab';
import CompaniesTab from './tabs/CompaniesTab';
import AiManagerTab from './tabs/AiManagerTab';
import SettingsTab from './tabs/SettingsTab';
import DetailPanel from './components/DetailPanel';
import LoginPage from './components/LoginPage';
import { ForecastRow, Goal, SalesPersonProfile, Tab, User, Notification, Contact } from './types';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { notificationService } from './services/notificationService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Forecast);
  const [data, setData] = useState<ForecastRow[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profile, setProfile] = useState<SalesPersonProfile>({ name: '', email: '' });
  const [selectedRow, setSelectedRow] = useState<ForecastRow | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    const session = authService.getCurrentUser();
    if (session) setUser(session);
    
    setData(storageService.getForecast());
    setGoals(storageService.getGoals());
    setProfile(storageService.getProfile());
    
    const savedContacts = localStorage.getItem('crm_ia_contacts_db');
    if (savedContacts) setContacts(JSON.parse(savedContacts));
  }, []);

  // Fechar perfil da negociação ao trocar de aba
  useEffect(() => {
    setSelectedRow(null);
  }, [activeTab]);

  useEffect(() => {
    setNotifications(notificationService.getAlerts(data));
    storageService.saveForecast(data);
  }, [data]);

  useEffect(() => {
    localStorage.setItem('crm_ia_contacts_db', JSON.stringify(contacts));
  }, [contacts]);

  const filteredData = useMemo(() => {
    if (!user) return [];
    if (user.role === 'gestor') return data;
    const userName = user.name.toUpperCase().trim();
    return data.filter(row => {
      const respName = (row['RESP.'] || '').toUpperCase().trim();
      return respName.includes(userName) || userName.includes(respName);
    });
  }, [data, user]);

  const updateRow = (updatedRow: ForecastRow) => {
    setData(data.map(r => r.id === updatedRow.id ? updatedRow : r));
    setSelectedRow(updatedRow);
  };

  const handleLogin = (newUser: User) => setUser(newUser);
  const handleLogout = () => { authService.logout(); setUser(null); };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      user={user} 
      onLogout={handleLogout}
      notifications={notifications}
    >
      <div className="h-full relative">
        {activeTab === Tab.Forecast && (
          <ForecastTab 
            data={filteredData} 
            setData={setData} 
            onRowSelect={setSelectedRow} 
            user={user} 
          />
        )}
        {activeTab === Tab.Dashboard && <DashboardTab data={filteredData} />}
        {activeTab === Tab.Goals && <GoalsTab data={filteredData} goals={goals} setGoals={setGoals} onGoalClick={() => setActiveTab(Tab.Forecast)} />}
        {activeTab === Tab.Companies && (
          <CompaniesTab 
            data={filteredData} 
            contacts={contacts} 
            setContacts={setContacts}
            onFilterByCompany={(company) => {
               setActiveTab(Tab.Forecast);
            }} 
          />
        )}
        {activeTab === Tab.AiManager && <AiManagerTab data={filteredData} profile={profile} />}
        {activeTab === Tab.Settings && <SettingsTab profile={profile} setProfile={setProfile} user={user} />}

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
