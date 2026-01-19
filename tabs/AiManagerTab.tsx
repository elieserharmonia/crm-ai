
import React, { useState } from 'react';
import { Bot, Sparkles, Copy, Loader2, Target, Calendar, MessageSquare, AlertTriangle, FileSearch, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ForecastRow, SalesPersonProfile } from '../types';
import { geminiService } from '../services/geminiService';

interface AiManagerTabProps {
  data: ForecastRow[];
  profile: SalesPersonProfile;
}

const AiManagerTab: React.FC<AiManagerTabProps> = ({ data, profile }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateAdvice = async () => {
    if (data.length === 0) {
      alert('Seu Gerente IA precisa de dados para trabalhar! \n\n1. Vá até a aba Forecast.\n2. Certifique-se de que existem oportunidades importadas.\n3. Verifique se as oportunidades estão atribuídas ao seu nome de usuário.');
      return;
    }
    
    setIsLoading(true);
    setAdvice(null);
    try {
      const result = await geminiService.generateManagerAdvice(data, profile);
      setAdvice(result);
    } catch (error) {
      console.error(error);
      alert('Falha ao gerar conselho da IA. Verifique sua conexão ou chave de API.');
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
            <h2 className="text-4xl font-extrabold tracking-tight">Gerente Estratégico IA</h2>
            <p className="text-blue-100/80 max-w-xl text-lg leading-snug">
              Olá, {profile.name || 'Especialista'}. Analisei seu pipeline para 2026. 
              Mapeei <span className="font-black text-white px-2 py-0.5 bg-blue-500/30 rounded-lg">{data.length} oportunidades</span> cruciais nos setores automotivo e linha amarela.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
              <button 
                onClick={generateAdvice}
                disabled={isLoading}
                className="flex items-center gap-3 px-8 py-4 bg-white text-blue-700 rounded-2xl font-black shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:shadow-white/40 hover:-translate-y-1 transition-all disabled:opacity-50 active:scale-95 group"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
                GERAR PLANO DE AÇÃO
              </button>
            </div>
          </div>
        </div>
        
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
      </div>

      {!advice && !isLoading && data.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-20 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto border border-slate-100">
             <FileSearch size={40} />
           </div>
           <div className="space-y-2">
             <h3 className="text-2xl font-bold text-slate-800">Aguardando Importação</h3>
             <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
               Importe seu arquivo **FORECAST 2026_EF.xlsx** para que eu possa identificar padrões, gaps e sugerir mensagens de negociação.
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
            <p className="text-xl font-black text-slate-800 tracking-tight">Analisando Pipeline 2026</p>
            <p className="text-sm text-slate-500 font-medium">Cruzando dados de Clientes, Confiança e Volume Financeiro...</p>
          </div>
        </div>
      )}

      {advice && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Main Strategy Card */}
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
              <article className="prose prose-slate max-w-none text-slate-700 font-medium leading-relaxed prose-headings:font-black prose-headings:text-slate-900 prose-headings:uppercase prose-headings:tracking-tight prose-strong:text-blue-700 prose-strong:bg-blue-50 prose-strong:px-1 prose-strong:rounded">
                <div className="whitespace-pre-wrap">
                  {advice}
                </div>
              </article>
            </div>

            <div className="p-8 bg-indigo-50 border-t border-indigo-100 flex flex-col md:flex-row items-center gap-6 mt-auto">
               <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                 <CheckCircle2 size={32} />
               </div>
               <div className="flex-1">
                 <p className="text-sm font-black text-indigo-900 uppercase tracking-tight">Execução Imediata</p>
                 <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                   Baseado em seus dados, este plano foca em converter o máximo de volume nas próximas 48h. Priorize as mensagens de WhatsApp sugeridas acima.
                 </p>
               </div>
               <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline shrink-0">
                 Voltar ao topo <ArrowRight size={14} />
               </button>
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
             <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl space-y-6">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Resumo IA</h4>
                <div className="space-y-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Foco Prioritário</p>
                      <p className="font-bold text-slate-800 text-sm">3 Clientes VIPs</p>
                   </div>
                   <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                      <p className="text-[10px] font-black text-green-600 uppercase mb-1">Gatilho de Fechamento</p>
                      <p className="font-bold text-green-800 text-sm">Visita Presencial</p>
                   </div>
                   <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Volume em Risco</p>
                      <p className="font-bold text-blue-800 text-sm">R$ 450k (Stalled)</p>
                   </div>
                </div>
             </div>

             <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-6 shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 space-y-4">
                  <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl w-fit">
                    <Target size={24} />
                  </div>
                  <h4 className="font-black text-lg leading-tight">Dica de Especialista</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    "No setor automotivo, a agilidade na resposta técnica após o RFQ decide 70% da venda. Use a IA para rascunhar o e-mail técnico agora."
                  </p>
                </div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiManagerTab;
