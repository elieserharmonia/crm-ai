
import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Copy, Loader2, Target, Calendar, MessageSquare, AlertTriangle, FileSearch, ArrowRight, CheckCircle2, RefreshCcw, Key, ExternalLink } from 'lucide-react';
import { ForecastRow, SalesPersonProfile } from '../types';
import { geminiService } from '../services/geminiService';

// Fix: Use the globally defined AIStudio type to match environment expectations and avoid modifier/type conflicts.
declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

interface AiManagerTabProps {
  data: ForecastRow[];
  profile: SalesPersonProfile;
}

const AiManagerTab: React.FC<AiManagerTabProps> = ({ data, profile }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    }
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setError(null);
    }
  };

  const generateAdvice = async () => {
    if (data.length === 0) {
      alert('Seu Gerente IA precisa de dados! Importe o Forecast na aba Forecast primeiro.');
      return;
    }
    
    // Validar chave antes de prosseguir
    const keyReady = await window.aistudio.hasSelectedApiKey();
    if (!keyReady) {
      setHasApiKey(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAdvice(null);
    
    try {
      const result = await geminiService.generateManagerAdvice(data, profile);
      setAdvice(result);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || '';
      if (msg.includes('API Key') || msg.includes('not set')) {
        setHasApiKey(false);
        setError('Uma Chave de API é necessária para acessar o Gerente Pro.');
      } else if (msg.includes('entity was not found')) {
        setHasApiKey(false);
        setError('Sua sessão de API expirou ou é inválida. Por favor, reconfigure a chave.');
      } else {
        setError(msg || 'Erro inesperado na comunicação com a IA.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (advice) {
      navigator.clipboard.writeText(advice);
      alert('Estratégia copiada!');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header Info */}
      <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border-4 border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
          <div className="relative">
             <div className="w-28 h-28 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl animate-in zoom-in duration-700">
               <Bot size={56} className="text-blue-100" />
             </div>
             <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-indigo-900 flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full" />
             </div>
          </div>
          
          <div className="text-center md:text-left space-y-3 flex-1">
            <h2 className="text-4xl font-extrabold tracking-tight uppercase">Gerente Estratégico IA</h2>
            <p className="text-blue-100/80 max-w-xl text-lg leading-snug">
              Olá, {profile.name || 'Especialista'}. Analisei seu pipeline para 2026. 
              Mapeei <span className="font-black text-white px-2 py-0.5 bg-blue-500/30 rounded-lg">{data.length} oportunidades</span> cruciais.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
              {!hasApiKey ? (
                <div className="flex flex-col gap-3 items-center md:items-start">
                  <button 
                    onClick={handleOpenKeySelector}
                    className="flex items-center gap-3 px-8 py-4 bg-amber-500 text-white rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all active:scale-95"
                  >
                    <Key size={20} /> CONFIGURAR CHAVE API
                  </button>
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-200 hover:text-white underline transition-colors"
                  >
                    Documentação de Faturamento <ExternalLink size={10} />
                  </a>
                </div>
              ) : (
                <button 
                  onClick={generateAdvice}
                  disabled={isLoading}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all active:scale-95 group ${isLoading ? 'bg-blue-400 text-white/50' : 'bg-white text-blue-700 hover:shadow-white/40'}`}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
                  {isLoading ? 'ANALISANDO...' : 'GERAR PLANO DE AÇÃO'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-100 rounded-[2rem] p-10 text-center space-y-4 animate-in fade-in duration-300">
           <AlertTriangle size={48} className="mx-auto text-red-500" />
           <div>
             <h3 className="text-xl font-bold text-red-800">Ops! Algo deu errado.</h3>
             <p className="text-red-600/70 text-sm max-w-md mx-auto">{error}</p>
           </div>
           {!hasApiKey ? (
             <button 
              onClick={handleOpenKeySelector}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 mx-auto hover:bg-slate-800 transition-colors"
             >
               <Key size={16} /> Selecionar Nova Chave
             </button>
           ) : (
             <button 
              onClick={generateAdvice}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 mx-auto hover:bg-red-700 transition-colors"
             >
               <RefreshCcw size={16} /> Tentar Novamente
             </button>
           )}
        </div>
      )}

      {!advice && !isLoading && !error && data.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-20 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto border border-slate-100">
             <FileSearch size={40} />
           </div>
           <div className="space-y-2">
             <h3 className="text-2xl font-bold text-slate-800">Aguardando Dados</h3>
             <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
               Importe seu arquivo de Forecast para que eu possa identificar padrões e sugerir ações.
             </p>
           </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in fade-in duration-300">
          <div className="relative">
             <Loader2 className="animate-spin text-blue-600" size={64} strokeWidth={3} />
             <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 animate-pulse" size={24} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xl font-black text-slate-800 tracking-tight">Consultando Cérebro Estratégico</p>
            <p className="text-sm text-slate-500 font-medium">Cruzando dados financeiros e probabilidade de fechamento...</p>
          </div>
        </div>
      )}

      {advice && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  <Bot size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Plano Estratégico de Vendas</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gerado em {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-5 py-2.5 hover:bg-white rounded-xl text-slate-600 hover:text-blue-600 transition-all border border-transparent hover:border-slate-200 font-bold text-sm shadow-sm"
              >
                <Copy size={18} /> Copiar Tudo
              </button>
            </div>
            
            <div className="p-10">
              <article className="prose prose-slate max-w-none text-slate-700 font-medium leading-relaxed whitespace-pre-wrap text-lg">
                {advice}
              </article>
            </div>

            <div className="p-8 bg-indigo-50 border-t border-indigo-100 flex flex-col md:flex-row items-center gap-6 mt-auto">
               <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                 <CheckCircle2 size={32} />
               </div>
               <div className="flex-1 text-center md:text-left">
                 <p className="text-sm font-black text-indigo-900 uppercase tracking-tight">Execução Imediata</p>
                 <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                   Priorize os negócios sugeridos para maximizar o resultado do trimestre.
                 </p>
               </div>
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
             <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl space-y-6">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Resumo IA</h4>
                <div className="space-y-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Mapeado</p>
                      <p className="font-bold text-slate-800 text-sm">R$ {data.reduce((acc, r) => acc + r.AMOUNT, 0).toLocaleString()}</p>
                   </div>
                   <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Insights Gerados</p>
                      <p className="font-bold text-blue-800 text-sm">Plano de Ação 2026</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiManagerTab;
