
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
  DollarSign,
  AlertTriangle,
  RefreshCcw
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
  const [error, setError] = useState<string | null>(null);

  if (!row) return null;

  const isManager = user.role === 'gestor';
  const rowResp = String(row['RESP.'] || '').toUpperCase().trim();
  const currentUserName = String(user.name || '').toUpperCase().trim();
  const canEdit = isManager || !row['RESP.'] || rowResp.includes(currentUserName) || currentUserName.includes(rowResp);

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await geminiService.generateVisitReport(row, profile);
      setAiReport(result);
    } catch (error: any) {
      setError(error.message || "Erro desconhecido ao processar IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChange = (field: keyof ForecastRow, value: any) => {
    if (!canEdit) return;
    onUpdate({ ...row, [field]: value });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[650px] bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] z-[150] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-500 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase">OPPORTUNITY</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase truncate">{row.CUSTOMER}</h2>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm">
          <X size={24} />
        </button>
      </div>

      <div className="flex p-2 bg-slate-100/50 gap-2 mx-6 my-6 rounded-2xl border border-slate-200/50">
        <button onClick={() => setActiveTab('details')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'details' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>
          <FileText size={16}/> RAW DATA
        </button>
        <button onClick={() => setActiveTab('ai')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'ai' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>
          <Sparkles size={16}/> AI ANALYTICS
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8 space-y-10 custom-scrollbar pb-32">
        {activeTab === 'details' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14}/> DESCRIPTION (EXACT SOURCE)
              </h3>
              <textarea 
                disabled={!canEdit}
                className={`w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-32 outline-none font-bold text-sm leading-relaxed transition-all ${canEdit ? 'focus:bg-white focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`}
                value={row.DESCRIPTION}
                onChange={e => handleChange('DESCRIPTION', e.target.value)}
              />
            </section>

            <section className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FINANCIALS (AMOUNT)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">AMOUNT (EXACT)</p>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">R$</span>
                    <input 
                      type="number"
                      disabled={!canEdit}
                      value={row.AMOUNT}
                      onChange={e => handleChange('AMOUNT', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent font-black text-xl outline-none text-slate-900 font-mono"
                    />
                  </div>
                </div>
                <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">CONFIDENCE %</p>
                  <select 
                    disabled={!canEdit}
                    value={row.Confidence} 
                    onChange={e => handleChange('Confidence', Number(e.target.value))}
                    className="w-full bg-transparent font-black text-xl outline-none appearance-none cursor-pointer text-slate-900"
                  >
                    {[0, 10, 30, 50, 80, 90, 100].map(v => <option key={v} value={v}>{v}%</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Clock size={14}/> FOLLOW-UP (CHRONOLOGY)
               </h3>
               <textarea 
                  disabled={!canEdit}
                  className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] h-56 outline-none font-medium text-sm italic leading-relaxed"
                  value={row['FOLLOW-UP']}
                  onChange={e => handleChange('FOLLOW-UP', e.target.value)}
               />
            </section>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
             {!aiReport ? (
               <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-8">
                  <div className={`p-8 rounded-[2.5rem] bg-blue-50 text-blue-600 transition-all duration-1000 ${isGenerating ? 'animate-pulse scale-110 shadow-2xl shadow-blue-200' : ''}`}>
                    <Bot size={64} strokeWidth={1.5} />
                  </div>
                  
                  <div className="max-w-xs space-y-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Análise Inteligente</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Clique abaixo para que a IA analise esta oportunidade e gere um roteiro de abordagem.</p>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
                      <AlertTriangle size={18} />
                      {error}
                    </div>
                  )}

                  <button 
                    onClick={generateReport} 
                    disabled={isGenerating} 
                    className={`group relative px-14 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs shadow-2xl flex items-center gap-4 transition-all active:scale-95 disabled:opacity-50 ${isGenerating ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin" size={20}/> PROCESSANDO...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} className="group-hover:rotate-12 transition-transform" /> 
                        {error ? 'TENTAR NOVAMENTE' : 'GERAR ANÁLISE IA'}
                      </>
                    )}
                  </button>
               </div>
             ) : (
               <div className="space-y-6 pb-20">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                      <Check size={14} /> Relatório Gerado com Sucesso
                    </div>
                    <button onClick={() => setAiReport(null)} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase flex items-center gap-1">
                      <RefreshCcw size={12} /> Refazer Análise
                    </button>
                 </div>
                 <div className="p-10 bg-slate-50 border border-slate-100 rounded-[2.5rem] shadow-sm leading-relaxed text-sm font-medium text-slate-700 whitespace-pre-wrap border-l-8 border-l-blue-500 animate-in slide-in-from-bottom-4">
                   {aiReport}
                 </div>
                 
                 <div className="p-8 bg-slate-900 rounded-3xl text-white space-y-4">
                   <div className="flex items-center gap-3">
                     <AlertCircle size={20} className="text-blue-400" />
                     <p className="text-xs font-black uppercase tracking-widest">Próxima Ação Sugerida</p>
                   </div>
                   <p className="text-sm text-slate-300 font-medium">Copie os pontos principais acima e utilize-os como pauta para sua próxima reunião com a engenharia da {row.CUSTOMER}.</p>
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
