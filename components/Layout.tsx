
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  TableProperties, 
  Target, 
  Building2, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Bell,
  AlertTriangle,
  BookText,
  FileCheck
} from 'lucide-react';
import { Tab, User, Notification, SalesPersonProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  user: User;
  profile: SalesPersonProfile;
  onLogout: () => void;
  notifications: Notification[];
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, profile, onLogout, notifications }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const menuItems = [
    { id: Tab.Forecast, label: 'Forecast', icon: TableProperties },
    { id: Tab.Dashboard, label: 'Dashboard', icon: LayoutDashboard },
    { id: Tab.Goals, label: 'Metas', icon: Target },
    { id: Tab.Orders, label: 'Pedidos (POs)', icon: FileCheck },
    { id: Tab.Companies, label: 'Empresas', icon: Building2 },
    { id: Tab.Diary, label: 'Diário', icon: BookText },
    { id: Tab.Settings, label: 'Configurações', icon: Settings },
  ];

  const isProfileConfigured = !!profile.name && profile.name.trim() !== "";
  const displayName = isProfileConfigured ? profile.name : "Configurar Perfil";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-slate-900 text-white flex flex-col z-50`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <span className="text-2xl font-black tracking-tight text-blue-400">CRM-IA</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded-md">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={22} />
                {isSidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white shadow-md overflow-hidden">
                {profile.logo ? (
                  <img src={profile.logo} className="w-full h-full object-cover" alt="Logo" />
                ) : (
                  <span className={`${isProfileConfigured ? 'text-blue-400' : 'text-slate-600'}`}>
                    {isProfileConfigured ? displayName.charAt(0) : '?'}
                  </span>
                )}
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm font-semibold truncate uppercase tracking-tight ${!isProfileConfigured ? 'text-slate-500 italic' : 'text-white'}`}>
                    {displayName}
                  </span>
                  <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-0.5">
                    {isProfileConfigured ? user.role : 'Ação Necessária'}
                  </span>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button onClick={onLogout} className="w-full flex items-center gap-2 text-[10px] font-black uppercase text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors tracking-widest">
                <LogOut size={14} /> Sair
              </button>
            )}
        </div>
      </aside>

      <main className="flex-1 relative overflow-auto h-full">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h1>
          
          <div className="flex items-center gap-6">
            {!isProfileConfigured && (
              <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-100 rounded-full text-[10px] font-black text-amber-600 uppercase tracking-widest animate-pulse shadow-sm">
                <AlertTriangle size={12} /> Perfil incompleto
              </div>
            )}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Bell size={20} className="text-slate-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
        <div className="p-8 pb-20">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
