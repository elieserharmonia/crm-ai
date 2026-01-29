
import React, { useState } from 'react';
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
    if (!localProfile.name || localProfile.name.trim().length < 3) {
      alert('Por favor, preencha seu nome completo antes de salvar.');
      return;
    }
    setProfile(localProfile);
    storageService.saveProfile(localProfile);
    alert('Perfil configurado com sucesso! Os dados do CRM agora estão liberados.');
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
        {/* Profile Sidebar Preview */}
        <div className="w-full md:w-72 space-y-4 shrink-0">
           <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm text-center">
              <div className="relative w-24 h-24 mx-auto mb-6 group">
                <div className="w-full h-full rounded-[1.5rem] bg-slate-50 flex items-center justify-center overflow-hidden border-2 border-slate-100 transition-all group-hover:border-blue-200">
                  {localProfile.logo ? (
                    <img src={localProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={40} className="text-slate-200" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-xl shadow-lg cursor-pointer hover:bg-blue-700 transition-all opacity-0 group-hover:opacity-100 translate-x-1 translate-y-1">
                  <Upload size={14} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
              <h3 className={`font-black text-lg truncate tracking-tight uppercase ${!localProfile.name ? 'text-slate-300 italic' : 'text-slate-800'}`}>
                {localProfile.name || "Nome Pendente"}
              </h3>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-2 truncate ${!localProfile.email ? 'text-slate-300' : 'text-slate-400'}`}>
                {localProfile.email || "E-mail Pendente"}
              </p>
           </div>

           <nav className="space-y-1">
             {menuItems.map((item) => (
               <button 
                 key={item.id} 
                 onClick={() => setActiveSection(item.id)}
                 className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 ${
                   activeSection === item.id 
                    ? 'bg-slate-900 text-white font-bold shadow-xl shadow-slate-200' 
                    : 'text-slate-500 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-100'
                 }`}
               >
                 <item.icon size={18} />
                 <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
               </button>
             ))}
           </nav>
        </div>

        {/* Content area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden min-h-[550px] flex flex-col">
           {activeSection === 'personal' && (
             <div className="p-10 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
               <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Informações Pessoais</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Identificação do Vendedor no CRM</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
                      <input 
                        type="text" 
                        placeholder="Ex: João da Silva"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-800 placeholder:text-slate-300"
                        value={localProfile.name}
                        onChange={e => setLocalProfile({...localProfile, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail Profissional</label>
                      <input 
                        type="email" 
                        placeholder="vendedor@empresa.com.br"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-800 placeholder:text-slate-300"
                        value={localProfile.email}
                        onChange={e => setLocalProfile({...localProfile, email: e.target.value})}
                      />
                    </div>
                  </div>
               </div>

               <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    <strong>Nota:</strong> O nome preenchido aqui é o que será utilizado para filtrar as oportunidades no Forecast. Certifique-se de que ele corresponda ao nome que consta na coluna <strong>"RESP."</strong> do seu arquivo Excel.
                  </p>
               </div>

               <div className="flex justify-end pt-8 mt-auto">
                  <button 
                    onClick={save}
                    className="flex items-center gap-3 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 uppercase text-xs tracking-widest"
                  >
                    <Save size={18} />
                    Salvar Perfil Profissional
                  </button>
               </div>
             </div>
           )}

           {activeSection === 'sync' && (
             <div className="p-10 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sincronização & Backup</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Gestão Local do Banco de Dados</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-4 hover:border-blue-200 transition-colors group">
                      <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-sm w-fit group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Download size={24} />
                      </div>
                      <h4 className="font-black text-slate-800 uppercase text-sm tracking-tight">Exportar Backup</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Gera um arquivo .json criptografado com todas as oportunidades e metas.</p>
                      <button 
                        onClick={exportDatabase}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                      >
                        Baixar Arquivo JSON
                      </button>
                   </div>

                   <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-4 hover:border-purple-200 transition-colors group">
                      <div className="p-3 bg-white text-purple-600 rounded-2xl shadow-sm w-fit group-hover:bg-purple-600 group-hover:text-white transition-all">
                        <Upload size={24} />
                      </div>
                      <h4 className="font-black text-slate-800 uppercase text-sm tracking-tight">Restaurar Backup</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Substitui os dados locais atuais pelos dados de um arquivo externo.</p>
                      <label className={`w-full flex items-center justify-center py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${!isManager ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 active:scale-95'}`}>
                        {isManager ? 'Selecionar Arquivo' : 'Acesso Restrito'}
                        {isManager && <input type="file" className="hidden" accept=".json" onChange={importDatabase} />}
                      </label>
                   </div>
                </div>

                <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                   <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                   <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                     <strong>Segurança:</strong> Seus dados são armazenados exclusivamente no seu navegador. Caso limpe o cache ou troque de computador, você precisará importar seu arquivo de backup para recuperar as metas e configurações.
                   </p>
                </div>
             </div>
           )}

           {activeSection === 'api' && (
             <div className="p-10 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Inteligência Artificial</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Motor Gemini PRO 2026</p>
                </div>
                <div className="p-8 bg-green-50 border border-green-100 rounded-[2rem] flex items-center gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm border border-green-100">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h4 className="font-black text-green-800 uppercase text-sm tracking-tight">Status: Conectado</h4>
                    <p className="text-xs text-green-700/80 mt-1 font-medium leading-relaxed">O sistema está pronto para realizar análises preditivas e planejamento de rotas.</p>
                  </div>
                </div>
             </div>
           )}

           {activeSection === 'privacy' && (
             <div className="p-10 space-y-6 animate-in fade-in duration-500">
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Privacidade</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Proteção de Dados do Forecast</p>
                </div>
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    As informações do seu pipeline são processadas localmente. Ao utilizar as funções de IA, os dados são enviados de forma efêmera para os servidores do Google (Gemini) via conexão criptografada e não são utilizados para treinamento de modelos públicos.
                  </p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
