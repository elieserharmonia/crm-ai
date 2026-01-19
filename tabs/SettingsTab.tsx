
import React, { useState } from 'react';
// Added AlertCircle to imports
import { User as UserIcon, Shield, Bell, Key, Save, Upload, CreditCard, ExternalLink, CheckCircle2, Mail, Database, Download, AlertCircle } from 'lucide-react';
import { SalesPersonProfile, User } from '../types';
import { storageService } from '../services/storageService';

interface SettingsTabProps {
  profile: SalesPersonProfile;
  setProfile: (profile: SalesPersonProfile) => void;
  user: User;
}

type Section = 'personal' | 'api' | 'sync' | 'privacy';

const SettingsTab: React.FC<SettingsTabProps> = ({ profile, setProfile, user }) => {
  const [localProfile, setLocalProfile] = useState<SalesPersonProfile>(profile);
  const [activeSection, setActiveSection] = useState<Section>('personal');

  const isManager = user.role === 'gestor';

  const save = () => {
    setProfile(localProfile);
    alert('Perfil salvo com sucesso!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setLocalProfile({ ...localProfile, logo: evt.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const exportDatabase = () => {
    const fullState = {
      forecast: storageService.getForecast(),
      goals: storageService.getGoals(),
      profile: storageService.getProfile()
    };
    const blob = new Blob([JSON.stringify(fullState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm_ia_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.forecast) storageService.saveForecast(data.forecast);
        if (data.goals) storageService.saveGoals(data.goals);
        if (data.profile) storageService.saveProfile(data.profile);
        alert('Banco de dados restaurado com sucesso! Recarregue a página.');
        window.location.reload();
      } catch (err) {
        alert('Erro ao importar arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const menuItems = [
    { id: 'personal' as Section, icon: UserIcon, label: 'Informações Pessoais' },
    { id: 'api' as Section, icon: Key, label: 'Configurações de API' },
    { id: 'sync' as Section, icon: Database, label: 'Sincronização & Backup' },
    { id: 'privacy' as Section, icon: Shield, label: 'Privacidade' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Profile Sidebar */}
        <div className="w-full md:w-72 space-y-4 shrink-0">
           <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
              <div className="relative w-24 h-24 mx-auto mb-4 group">
                <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-50">
                  {localProfile.logo ? (
                    <img src={localProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={40} className="text-slate-300" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-lg shadow-lg cursor-pointer hover:bg-blue-700 transition-all opacity-0 group-hover:opacity-100 -translate-x-1">
                  <Upload size={14} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
              <h3 className="font-bold text-slate-800 truncate">{localProfile.name || user.name}</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 truncate">{localProfile.email || user.email}</p>
           </div>

           <nav className="space-y-1">
             {menuItems.map((item) => (
               <button 
                 key={item.id} 
                 onClick={() => setActiveSection(item.id)}
                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                   activeSection === item.id 
                    ? 'bg-blue-50 text-blue-600 font-bold shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                 }`}
               >
                 <item.icon size={18} className={activeSection === item.id ? 'text-blue-600' : 'text-slate-400'} />
                 <span className="text-sm">{item.label}</span>
               </button>
             ))}
           </nav>
        </div>

        {/* Content area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
           {activeSection === 'personal' && (
             <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <UserIcon size={20} className="text-blue-500" />
                    Informações Pessoais
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                      <input 
                        type="text" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={localProfile.name}
                        onChange={e => setLocalProfile({...localProfile, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail Profissional</label>
                      <input 
                        type="email" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={localProfile.email}
                        onChange={e => setLocalProfile({...localProfile, email: e.target.value})}
                      />
                    </div>
                  </div>
               </div>

               <div className="flex justify-end gap-3 pt-6 mt-auto">
                  <button 
                    onClick={save}
                    className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <Save size={20} />
                    Salvar Alterações
                  </button>
               </div>
             </div>
           )}

           {activeSection === 'sync' && (
             <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Database size={20} className="text-blue-500" />
                    Sincronização & Backup
                  </h2>
                  <p className="text-sm text-slate-500">
                    Utilize estas ferramentas para compartilhar os dados do CRM entre diferentes computadores ou para salvar cópias de segurança.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg w-fit">
                        <Download size={24} />
                      </div>
                      <h4 className="font-bold text-slate-800">Exportar Banco de Dados</h4>
                      <p className="text-xs text-slate-500">Gera um arquivo .json com todas as oportunidades, metas e perfis configurados.</p>
                      <button 
                        onClick={exportDatabase}
                        className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                      >
                        Baixar Backup
                      </button>
                   </div>

                   <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg w-fit">
                        <Upload size={24} />
                      </div>
                      <h4 className="font-bold text-slate-800">Restaurar Banco de Dados</h4>
                      <p className="text-xs text-slate-500">Substitui os dados locais atuais pelos dados contidos em um arquivo de backup.</p>
                      <label className={`w-full flex items-center justify-center py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold transition-colors cursor-pointer ${!isManager ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}`}>
                        {isManager ? 'Escolher Arquivo' : 'Apenas para Gestores'}
                        {isManager && <input type="file" className="hidden" accept=".json" onChange={importDatabase} />}
                      </label>
                   </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                   {/* Fix: AlertCircle now imported from lucide-react */}
                   <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                   <p className="text-xs text-amber-800">
                     <strong>Atenção:</strong> Como este aplicativo roda localmente no navegador, os dados não são sincronizados automaticamente na nuvem. Você deve usar a função de exportação/importação para compartilhar as atualizações com outros computadores.
                   </p>
                </div>
             </div>
           )}

           {activeSection === 'api' && (
             <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Key size={20} className="text-blue-500" />
                    Configurações de Inteligência Artificial
                  </h2>
                </div>
                <div className="p-6 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-4">
                  <CheckCircle2 size={24} className="text-green-600" />
                  <div>
                    <h4 className="font-bold text-green-800">Serviço Gemini Operacional</h4>
                    <p className="text-sm text-green-700/80 mt-1">Sua conexão com a IA está pronta para processar oportunidades e gerar relatórios.</p>
                  </div>
                </div>
             </div>
           )}

           {activeSection === 'privacy' && (
             <div className="p-8 space-y-4 animate-in fade-in duration-300">
               <h3 className="font-bold text-slate-800">Segurança de Dados</h3>
               <p className="text-sm text-slate-500">
                 Seus dados de forecast são processados apenas localmente e via prompts anonimizados para a API do Google Gemini. 
                 Nenhuma informação é armazenada em servidores externos permanentes por este aplicativo.
               </p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
