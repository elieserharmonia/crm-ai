
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Building2, 
  Clock, 
  Save, 
  Printer, 
  Share2, 
  Bold, 
  Italic, 
  List, 
  Type, 
  ChevronRight,
  FileText,
  History,
  AlertCircle,
  BookText,
  CheckCircle2,
  Sparkles,
  FileDown,
  Loader2
} from 'lucide-react';
import { ForecastRow, DiaryEntry } from '../types';
import { storageService } from '../services/storageService';
import { GoogleGenAI } from "@google/genai";

interface DiaryTabProps {
  data: ForecastRow[];
}

const DiaryTab: React.FC<DiaryTabProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [currentContent, setCurrentContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    setDiaryEntries(storageService.getDiaryEntries());
  }, []);

  // Lista de empresas únicas vindas do forecast
  const companies = useMemo(() => {
    const list = Array.from(new Set(data.map(r => r.CUSTOMER))).filter(Boolean).sort();
    return list;
  }, [data]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [companies, searchTerm]);

  // Carregar conteúdo quando mudar de empresa
  useEffect(() => {
    if (selectedCompany) {
      const entry = diaryEntries.find(e => e.companyName === selectedCompany);
      setCurrentContent(entry?.content || '');
    }
  }, [selectedCompany, diaryEntries]);

  // Auto-save logic
  useEffect(() => {
    if (!selectedCompany) return;
    const timeout = setTimeout(() => handleSave(), 2000);
    return () => clearTimeout(timeout);
  }, [currentContent]);

  const handleSave = () => {
    if (!selectedCompany) return;
    setIsSaving(true);
    
    const newEntries = [...diaryEntries];
    const index = newEntries.findIndex(e => e.companyName === selectedCompany);
    
    const updatedEntry: DiaryEntry = {
      id: index >= 0 ? newEntries[index].id : Date.now().toString(),
      companyName: selectedCompany,
      content: currentContent,
      lastUpdate: new Date().toISOString()
    };

    if (index >= 0) {
      newEntries[index] = updatedEntry;
    } else {
      newEntries.push(updatedEntry);
    }

    setDiaryEntries(newEntries);
    storageService.saveDiaryEntries(newEntries);
    
    setTimeout(() => setIsSaving(false), 500);
  };

  const professionalizeWithAI = async () => {
    if (!currentContent.trim()) return;
    setIsAIProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Aja como um redator corporativo sênior. Transforme as seguintes notas informais de reunião/venda em um resumo profissional e executivo, mantendo todos os dados técnicos e nomes. Use bullet points para os pontos principais. Texto: \n\n ${currentContent}` }] }],
      });
      if (response.text) {
        setCurrentContent(response.text);
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao processar IA. Verifique sua chave.");
    } finally {
      setIsAIProcessing(false);
    }
  };

  const exportToWord = () => {
    if (!selectedCompany || !currentContent) return;
    
    // Simplificado: Gera um arquivo .doc (compatível com Word) usando HTML blob
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Diário ${selectedCompany}</title>
      <style>body { font-family: Arial, sans-serif; line-height: 1.6; }</style></head><body>
      <h1>Diário de Bordo: ${selectedCompany}</h1>
      <p><em>Atualizado em: ${new Date().toLocaleString()}</em></p>
      <hr/>
      <div style="white-space: pre-wrap;">${currentContent}</div>
      </body></html>`;
      
    const blob = new Blob(['\ufeff', header], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Diario_${selectedCompany.replace(/\s+/g, '_')}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] -m-8 overflow-hidden bg-slate-50">
      {/* Sidebar de Clientes */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Empresas do Pipeline</h2>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Localizar cliente..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {filteredCompanies.map(company => {
            const isActive = selectedCompany === company;
            const entry = diaryEntries.find(e => e.companyName === company);
            const hasContent = entry && entry.content.trim().length > 0;
            
            return (
              <button 
                key={company}
                onClick={() => setSelectedCompany(company)}
                className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' 
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-blue-500 shadow-inner' : 'bg-slate-100'}`}>
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[11px] truncate uppercase tracking-tight leading-none">{company}</p>
                    {entry && (
                      <p className={`text-[8px] mt-1 font-black uppercase opacity-60 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        Mod: {new Date(entry.lastUpdate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {hasContent && !isActive && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-blue-200 shadow-md" />}
                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white' : 'text-slate-300'}`} />
              </button>
            );
          })}
          {filteredCompanies.length === 0 && (
             <div className="p-10 text-center space-y-3">
               <AlertCircle className="mx-auto text-slate-200" size={32} />
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Lista vazia</p>
             </div>
          )}
        </div>
      </aside>

      {/* Área do Editor */}
      <main className="flex-1 overflow-y-auto bg-slate-100/50 custom-scrollbar flex flex-col relative">
        {selectedCompany ? (
          <>
            {/* Toolbar "Google Docs style" */}
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-10 py-3 flex items-center justify-between shadow-sm">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1 pr-6 border-r border-slate-200">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Negrito"><Bold size={18}/></button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Itálico"><Italic size={18}/></button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Lista"><List size={18}/></button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Fonte"><Type size={18}/></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={professionalizeWithAI}
                      disabled={isAIProcessing || !currentContent}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-100 transition-all disabled:opacity-50 border border-indigo-100"
                    >
                      {isAIProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      IA Profissionalizar
                    </button>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                      <Clock size={12} /> {isSaving ? 'Gravando...' : 'Sincronizado'}
                    </div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <button onClick={() => window.print()} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Imprimir"><Printer size={18}/></button>
                  <button onClick={exportToWord} className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 shadow-lg transition-all active:scale-95" title="Abrir no Word">
                    <FileDown size={14}/> Word (.doc)
                  </button>
               </div>
            </div>

            {/* Container do Documento */}
            <div className="flex-1 p-12 flex justify-center pb-32">
              <div className="w-full max-w-[850px] bg-white shadow-2xl rounded-sm min-h-[1050px] flex flex-col p-[80px] md:p-[100px] animate-in slide-in-from-bottom-6 duration-700 border border-slate-200">
                <header className="mb-12 border-b-2 border-slate-100 pb-10 flex justify-between items-start">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em]">
                      <FileText size={14} strokeWidth={3} /> Diário Estratégico do Cliente
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none drop-shadow-sm">{selectedCompany}</h2>
                    <div className="flex items-center gap-4 pt-2">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Confidencial</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Interno</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Backup Local</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 justify-end">
                      <CheckCircle2 size={12} className="text-green-500" /> Ativo
                    </div>
                  </div>
                </header>

                <textarea 
                  className="flex-1 w-full outline-none text-lg text-slate-800 font-medium leading-[1.85] placeholder:text-slate-200 resize-none font-sans"
                  placeholder="Escreva livremente aqui: rascunhos de reuniões, conversas informais com compradores, nomes de decisores citados e insights estratégicos. O sistema salva automaticamente..."
                  value={currentContent}
                  onChange={(e) => setCurrentContent(e.target.value)}
                  spellCheck={true}
                />

                <footer className="mt-20 pt-10 border-t border-slate-100 flex justify-between items-center opacity-40 grayscale">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-[10px]">CRM</div>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Documento gerado pelo CRM-IA PRO 2026</p>
                  </div>
                  <div className="flex items-center gap-1 font-black text-[9px] text-slate-400 uppercase">
                    <History size={10} /> Sincronismo Local V2.4
                  </div>
                </footer>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center text-slate-200 border border-slate-50 animate-in zoom-in duration-700">
                <BookText size={64} strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl animate-bounce">
                <Sparkles size={20} />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Módulo Diário de Atividades</h3>
              <p className="text-slate-500 max-w-sm mx-auto leading-relaxed font-medium text-lg">
                Selecione um cliente para abrir seu diário individual e gerenciar anotações com formatação profissional.
              </p>
            </div>
            <div className="flex gap-8 items-center text-[10px] font-black text-slate-400 uppercase tracking-widest pt-6 border-t border-slate-200/50">
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> Salvamento Automático</div>
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> Exportação Word</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DiaryTab;
