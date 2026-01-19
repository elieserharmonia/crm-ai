
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  TableProperties, 
  Target, 
  Building2, 
  Bot, 
  Settings, 
  Menu, 
  X,
  ChevronRight,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Bell,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Tab, User, Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  user: User;
  onLogout: () => void;
  notifications: Notification[];
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onLogout, notifications }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const menuItems = [
    { id: Tab.Forecast, label: 'Forecast', icon: TableProperties },
    { id: Tab.Dashboard, label: 'Dashboard', icon: LayoutDashboard },
    { id: Tab.Goals, label: 'Metas', icon: Target },
    { id: Tab.Companies, label: 'Empresas', icon: Building2 },
    { id: Tab.AiManager, label: 'Gerente IA', icon: Bot },
    { id: Tab.Settings, label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-slate-900 text-white flex flex-col z-50`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <span className="text-2xl font-black tracking-tight text-blue-400">CRM-IA</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded-md">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
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
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shadow-md">{user.name.charAt(0)}</div>
              {isSidebarOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{user.name}</span>
                  <span className="text-[10px] text-slate-500 font-black uppercase">{user.role}</span>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button onClick={onLogout} className="w-full flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
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
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Bell size={20} className="text-slate-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Notificações</span>
                    <button onClick={() => setShowNotifications(false)}><X size={14}/></button>
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3">
                           {n.type === 'warning' ? <AlertTriangle className="text-amber-500 shrink-0" size={18} /> : <Info className="text-blue-500 shrink-0" size={18} />}
                           <div>
                             <p className="text-sm font-bold text-slate-800">{n.title}</p>
                             <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 italic text-xs">Nenhum alerta pendente.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-8 pb-20">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
