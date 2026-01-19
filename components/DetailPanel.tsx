
import React, { useState } from 'react';
import { 
  X, 
  History, 
  MessageCircle, 
  Bot, 
  ChevronRight, 
  FileText, 
  Download, 
  Clock,
  Sparkles,
  Loader2,
  Copy,
  AlertCircle,
  Calendar,
  Check,
  Printer,
  Share2,
  User as UserIcon
} from 'lucide-react';
import { ForecastRow, CONFIDENCE_MAPPING, SalesPersonProfile, User, Contact } from '../types';
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
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'ai'>('details');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  if (!row) return null;

  const isManager = user.role === 'gestor';
  const canEdit = isManager || row['RESP.'].toUpperCase() === user.name.toUpperCase();
  const companyContacts = contacts.filter(c => c.companyName === row.CUSTOMER);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const result = await geminiService.generateVisitReport(row, profile);
      setAiReport(result);
      setActiveTab('ai');
    } catch (error) {
      alert('Relatório da IA falhou. Verifique a chave da API.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyReport = () => {
    if (aiReport) {
      navigator.clipboard.writeText(aiReport);
      alert('Relatório copiado!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleChange = (field: keyof ForecastRow, value: any) => {
    if (!canEdit) {
      alert('Você não tem permissão para editar esta oportunidade.');
      return;
    }
    onUpdate({ ...row, [field]: value });
  };

  const toggleMonth = (m: 'JAN' | 'FEV' | 'MAR' | '2026') => {
    handleChange(m, row[m] === 'x' ? '' : 'x');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-[0_0_100px_rgba(0,0,0,0.3)] z-[100] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-500 overflow-hidden print:fixed print:inset-0 print:w-full print:shadow-none print:border-none">
      
      {/* PROFESSIONAL PRINT VIEW */}
      <div className="hidden print:block print-content space-y-8 font-sans">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
           <div className="space-y-2">
             <h1 className="text-4xl font-black uppercase tracking-tighter">Relatório de Visita IA</h1>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Consultor: {profile.name || user.name}</p>
           </div>
           {profile.logo && <img src={profile.logo} className="h-16 w-auto object-contain" alt="Logo" />}
        </div>

        <div className="grid grid-cols-2 gap-10 bg-slate-50 p-8 rounded-3xl">
           <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Prospect</p>
                <p className="text-xl font-black uppercase">{row.CUSTOMER}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor Envolvido</p>
                <p className="text-lg font-bold">{row.SUPPLIER}</p>
              </div>
           </div>
           <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor do Projeto</p>
                <p className="text-xl font-black font-mono">{row.AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status de Confiança</p>
                <p className="text-lg font-bold text-blue-700">{row.Confidence}% • {CONFIDENCE_MAPPING[row.Confidence as keyof typeof CONFIDENCE_MAPPING]}</p>
              </div>
           </div>
        </div>

        <div className="space-y-4">
           <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-2">Análise Estratégica & Histórico</h2>
           <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap">
              {aiReport || "Nenhum relatório IA gerado para esta oportunidade."}
           </div>
        </div>
      </div>

      {/* WEB UI VIEW */}
      <div className="flex flex-col h-full print:hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
               <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase tracking-widest shadow-sm shadow-blue-200">OPPORTUNITY</span>
               <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${row.Confidence === 100 ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>ID: {row.id.split('-')[1]}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase truncate">{row.CUSTOMER}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm border border-transparent hover:border-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex p-2 bg-slate-100/50 gap-2 mx-6 my-6 rounded-2xl backdrop-blur-sm border border-slate-200/50 shadow-inner shrink-0">
          {[
            { id: 'details', label: 'Dados', icon: FileText },
            { id: 'ai', label: 'Estratégia IA', icon: Sparkles },
            { id: 'history', label: 'Logs', icon: Clock }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === t.id ? 'bg-white text-blue-600 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8 space-y-10 custom-scrollbar pb-24">
          {activeTab === 'details' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Status & Confiança</h3>
                  {!canEdit && <span className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1"><AlertCircle size={12}/> Somente Leitura</span>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 flex flex-col gap-2 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confiança %</p>
                    <div className="relative">
                      <select 
                        disabled={!canEdit}
                        value={row.Confidence}
                        onChange={(e) => handleChange('Confidence', parseInt(e.target.value))}
                        className="bg-transparent border-none text-lg font-black focus:ring-0 p-0 text-slate-900 w-full appearance-none cursor-pointer"
                      >
                        {[0, 10, 30, 50, 80, 90, 100].map(v => (
                          <option key={v} value={v}>{v}% {v === 100 ? '✅' : ''}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-blue-500 transition-colors" size={20} />
                    </div>
                  </div>

                  <button 
                    disabled={!canEdit}
                    onClick={() => handleChange('oweInfoToClient', !row.oweInfoToClient)}
                    className={`p-6 rounded-[1.5rem] border transition-all flex flex-col gap-2 relative overflow-hidden group text-left ${
                      row.oweInfoToClient 
                        ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-xl' 
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:shadow-xl hover:-translate-y-1'
                    }`}
                  >
                    <p className={`text-[10px] font-black uppercase tracking-widest ${row.oweInfoToClient ? 'text-amber-500' : 'text-slate-400'}`}>Pendência</p>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-black uppercase tracking-tight">Deve Infos?</span>
                      <div className={`w-12 h-6 rounded-full relative transition-colors ${row.oweInfoToClient ? 'bg-amber-500' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${row.oweInfoToClient ? 'left-7' : 'left-1'}`} />
                      </div>
                    </div>
                  </button>
                </div>
              </section>

              <section className="space-y-6">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <UserIcon size={14} /> Contato da Oportunidade
                 </h3>
                 <div className="relative">
                   <select 
                      disabled={!canEdit}
                      value={row.CONTATOS}
                      onChange={(e) => handleChange('CONTATOS', e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold appearance-none cursor-pointer"
                   >
                     <option value="">Selecione um contato da empresa...</option>
                     {companyContacts.map(c => (
                       <option key={c.id} value={`${c.name} - ${c.phone}`}>{c.name} ({c.role})</option>
                     ))}
                     <option value={row.CONTATOS}>{row.CONTATOS || 'Valor original Excel'}</option>
                   </select>
                   <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={20} />
                 </div>
              </section>

              <section className="space-y-6">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Calendar size={14} /> Pipeline Mensal 2026
                 </h3>
                 <div className="grid grid-cols-4 gap-3">
                   {(['JAN', 'FEV', 'MAR', '2026'] as const).map(m => (
                     <button
                      key={m}
                      disabled={!canEdit}
                      onClick={() => toggleMonth(m)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                        row[m] === 'x' 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xl scale-105 z-10' 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'
                      }`}
                     >
                       <span className="text-[10px] font-black uppercase mb-2 tracking-widest">{m}</span>
                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 ${row[m] === 'x' ? 'bg-white/20 border-white/40' : 'bg-slate-50 border-slate-200'}`}>
                         {row[m] === 'x' ? <Check size={18} strokeWidth={4} /> : <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />}
                       </div>
                     </button>
                   ))}
                 </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Histórico de Follow-up</h3>
                <div className="p-8 border-2 border-slate-100 rounded-[2rem] bg-slate-50/50 shadow-inner focus-within:bg-white focus-within:border-blue-200 transition-all">
                  <textarea 
                      disabled={!canEdit}
                      className="bg-transparent border-none italic text-sm text-slate-600 leading-relaxed focus:ring-0 p-0 w-full resize-none h-40 custom-scrollbar font-medium"
                      value={row['FOLLOW-UP']}
                      onChange={(e) => handleChange('FOLLOW-UP', e.target.value)}
                      placeholder="Relate o que foi conversado hoje..."
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!aiReport ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
                  <div className="relative">
                     <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-100 border border-blue-100">
                       <Bot size={48} />
                     </div>
                     <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-pulse" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">Relatório Estratégico</h4>
                  <button 
                    onClick={generateReport}
                    disabled={isGenerating}
                    className="w-full max-w-xs flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    Gerar Análise IA
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="p-10 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 relative group">
                      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={copyReport} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"><Copy size={18}/></button>
                         <button onClick={handlePrint} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"><Printer size={18}/></button>
                      </div>
                      <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                        {aiReport}
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;
