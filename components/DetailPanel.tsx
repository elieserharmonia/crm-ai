
import React, { useState, useEffect } from 'react';
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
  User as UserIcon
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

  // Lógica de Permissão Ajustada: verifica se o nome do usuário logado está contido no campo 'RESP.'
  const isManager = user.role === 'gestor';
  const rowResp = String(row['RESP.'] || '').toUpperCase().trim();
  const currentUserName = String(user.name || '').toUpperCase().trim();
  const canEdit = isManager || rowResp.includes(currentUserName) || currentUserName.includes(rowResp);

  const companyContacts = contacts.filter(c => c.companyName === row.CUSTOMER);

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
    <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-[0_0_80px_rgba(0,0,0,0.15)] z-[150] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-500 overflow-hidden">
      
      {/* Header */}
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase tracking-widest">Oportunidade</span>
            {!canEdit && <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1 uppercase tracking-widest"><AlertCircle size={10}/> Somente Leitura</span>}
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase truncate">{row.CUSTOMER}</h2>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm border border-transparent hover:border-slate-200">
          <X size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-2 bg-slate-100/50 gap-2 mx-6 my-6 rounded-2xl border border-slate-200/50">
        <button onClick={() => setActiveTab('details')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'details' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500'}`}>
          <FileText size={16}/> Dados Gerais
        </button>
        <button onClick={() => setActiveTab('ai')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ai' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500'}`}>
          <Sparkles size={16}/> Análise IA
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8 space-y-10 custom-scrollbar pb-24">
        {activeTab === 'details' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            
            <section className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Negociação</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-6 rounded-3xl border transition-all flex flex-col gap-2 ${canEdit ? 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-lg' : 'bg-slate-50/50 border-slate-100 cursor-not-allowed opacity-70'}`}>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Confiança %</p>
                  <div className="relative">
                    <select 
                      disabled={!canEdit}
                      value={row.Confidence} 
                      onChange={e => handleChange('Confidence', Number(e.target.value))}
                      className="w-full bg-transparent font-black text-xl outline-none appearance-none cursor-pointer text-slate-900"
                    >
                      {[0, 10, 30, 50, 80, 90, 100].map(v => <option key={v} value={v}>{v}% {v === 100 ? '✅' : ''}</option>)}
                    </select>
                    <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>
                
                <button 
                  disabled={!canEdit}
                  onClick={() => handleChange('oweInfoToClient', !row.oweInfoToClient)}
                  className={`p-6 rounded-3xl border transition-all text-left flex flex-col gap-2 ${row.oweInfoToClient ? 'bg-amber-100 border-amber-200' : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-lg'}`}
                >
                  <p className={`text-[9px] font-black uppercase ${row.oweInfoToClient ? 'text-amber-600' : 'text-slate-400'}`}>Atenção</p>
                  <span className="font-black text-sm uppercase">{row.oweInfoToClient ? '⚠️ Deve Dados' : 'Em Dia'}</span>
                </button>
              </div>
            </section>

            <section className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserIcon size={14}/> Contato Prioritário</h3>
               <div className="relative group">
                 <select 
                   disabled={!canEdit}
                   value={row.CONTATOS}
                   onChange={e => handleChange('CONTATOS', e.target.value)}
                   className={`w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm appearance-none focus:ring-2 focus:ring-blue-500 transition-all ${canEdit ? 'cursor-pointer group-hover:bg-white' : 'cursor-not-allowed'}`}
                 >
                   <option value="">Selecione um contato da empresa...</option>
                   {companyContacts.map(c => (
                     <option key={c.id} value={`${c.name} - ${c.phone}`}>{c.name} ({c.role})</option>
                   ))}
                   <option value={row.CONTATOS}>{row.CONTATOS || 'Valor Original do Excel'}</option>
                 </select>
                 <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={18} />
               </div>
            </section>

            <section className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Follow-up / Notas de Negociação</h3>
               <textarea 
                  disabled={!canEdit}
                  className={`w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-44 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm italic leading-relaxed transition-all ${canEdit ? 'hover:bg-white' : 'cursor-not-allowed opacity-70'}`}
                  value={row['FOLLOW-UP']}
                  onChange={e => handleChange('FOLLOW-UP', e.target.value)}
                  placeholder="Descreva o andamento da negociação, novos requisitos ou barreiras..."
               />
            </section>

            <section className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={14}/> Cronograma 2026</h3>
               <div className="grid grid-cols-4 gap-2">
                 {(['JAN', 'FEV', 'MAR', '2026'] as const).map(m => (
                   <button
                    key={m}
                    disabled={!canEdit}
                    onClick={() => handleChange(m, row[m] === 'x' ? '' : 'x')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                      row[m] === 'x' 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'
                    }`}
                   >
                     <span className="text-[9px] font-black mb-1 uppercase">{m}</span>
                     {row[m] === 'x' ? <Check size={16} strokeWidth={4} /> : <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />}
                   </button>
                 ))}
               </div>
            </section>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!aiReport ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                 <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl border border-blue-100"><Bot size={44}/></div>
                 <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Estratégia Personalizada</h4>
                 <p className="text-sm text-slate-500 mb-10 max-w-xs leading-relaxed">Vou analisar este projeto para sugerir a melhor abordagem de venda e rascunhar mensagens de WhatsApp/E-mail.</p>
                 <button 
                  onClick={generateReport} 
                  disabled={isGenerating} 
                  className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-2xl flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                 >
                   {isGenerating ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>} Iniciar Análise IA
                 </button>
              </div>
            ) : (
              <div className="p-10 bg-slate-50 border border-slate-200 rounded-[2.5rem] relative group">
                <div className="prose prose-sm prose-slate max-w-none text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                  {aiReport}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPanel;
