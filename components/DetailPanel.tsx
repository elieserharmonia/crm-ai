
import React, { useState } from 'react';
import { 
  X, 
  Bot, 
  ChevronRight, 
  FileText, 
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  Calendar,
  Check,
  User as UserIcon,
  DollarSign
} from 'lucide-react';
import { ForecastRow, SalesPersonProfile, User, Contact } from '../types';
import { geminiService } from '../services/geminiService';

interface DetailPanelProps {
  row: ForecastRow | null;
  onClose: () => void;
  profile: SalesPersonProfile;
  onUpdate: (updatedRow: ForecastRow) => void;
  user: User;
  contacts: Contact[];
}

const DetailPanel: React.FC<DetailPanelProps> = ({ row, onClose, profile, onUpdate, user, contacts }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'ai'>('details');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  if (!row) return null;

  const isManager = user.role === 'gestor';
  const rowResp = String(row['RESP.'] || '').toUpperCase().trim();
  const currentUserName = String(user.name || '').toUpperCase().trim();
  const canEdit = isManager || !row['RESP.'] || rowResp.includes(currentUserName) || currentUserName.includes(rowResp);

  const companyContacts = contacts.filter(c => c.companyName === row.CLIENTE);

  const handleChange = (field: keyof ForecastRow, value: any) => {
    if (!canEdit) return;
    onUpdate({ ...row, [field]: value });
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const result = await geminiService.generateVisitReport(row, profile);
      setAiReport(result);
      setActiveTab('ai');
    } catch (error) {
      alert('IA indisponível no momento.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[650px] bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] z-[150] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-500 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase">OPORTUNIDADE</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase truncate">{row.CLIENTE}</h2>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm">
          <X size={24} />
        </button>
      </div>

      <div className="flex p-2 bg-slate-100/50 gap-2 mx-6 my-6 rounded-2xl border border-slate-200/50">
        <button onClick={() => setActiveTab('details')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'details' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500'}`}>
          <FileText size={16}/> Dados
        </button>
        <button onClick={() => setActiveTab('ai')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'ai' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500'}`}>
          <Sparkles size={16}/> Gerente IA
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8 space-y-10 custom-scrollbar pb-32">
        {activeTab === 'details' && (
          <div className="space-y-10">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14}/> DESCRIÇÃO
              </h3>
              <textarea 
                disabled={!canEdit}
                placeholder="Escopo do projeto..."
                className={`w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-32 outline-none font-bold text-sm leading-relaxed transition-all ${canEdit ? 'focus:bg-white focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`}
                value={row['DESCRIÇÃO']}
                onChange={e => handleChange('DESCRIÇÃO', e.target.value)}
              />
            </section>

            <section className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VALOR & STATUS</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50">
                  <p className="text-[9px] font-black text-slate-400 uppercase">VALOR (R$)</p>
                  <input 
                    type="number"
                    disabled={!canEdit}
                    value={row.VALOR}
                    onChange={e => handleChange('VALOR', parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-black text-xl outline-none text-slate-900 font-mono"
                  />
                </div>
                <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50">
                  <p className="text-[9px] font-black text-slate-400 uppercase">CONFIDÊNCIA %</p>
                  <select 
                    disabled={!canEdit}
                    value={row.CONFIDÊNCIA} 
                    onChange={e => handleChange('CONFIDÊNCIA', Number(e.target.value))}
                    className="w-full bg-transparent font-black text-xl outline-none appearance-none cursor-pointer text-slate-900"
                  >
                    {[0, 10, 30, 50, 80, 90, 100].map(v => <option key={v} value={v}>{v}%</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <UserIcon size={14}/> CONTATOS
               </h3>
               <select 
                 disabled={!canEdit}
                 value={row.CONTATOS}
                 onChange={e => handleChange('CONTATOS', e.target.value)}
                 className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-black text-sm"
               >
                 <option value="">Selecione...</option>
                 {companyContacts.map(c => (
                   <option key={c.id} value={`${c.name} - ${c.phone}`}>{c.name}</option>
                 ))}
                 <option value={row.CONTATOS}>{row.CONTATOS}</option>
               </select>
            </section>

            <section className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Clock size={14}/> FOLLOW-UP
               </h3>
               <textarea 
                  disabled={!canEdit}
                  className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] h-56 outline-none font-medium text-sm italic leading-relaxed"
                  value={row['FOLLOW-UP']}
                  onChange={e => handleChange('FOLLOW-UP', e.target.value)}
                  placeholder="Acompanhamento..."
               />
            </section>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-8 text-center py-20">
             {!aiReport ? (
               <button onClick={generateReport} disabled={isGenerating} className="px-14 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl flex items-center gap-4 mx-auto">
                 {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>} Gerar Análise IA
               </button>
             ) : (
               <div className="p-10 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-left whitespace-pre-wrap leading-relaxed text-sm font-medium text-slate-700">
                 {aiReport}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPanel;
