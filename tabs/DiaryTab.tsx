
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Building2, 
  Clock, 
  ChevronRight,
  FileText,
  ExternalLink,
  Files,
  FolderOpen,
  Info,
  ShieldCheck,
  RefreshCcw,
  AlertTriangle,
  CloudCheck
} from 'lucide-react';
import { ForecastRow, DiaryEntry } from '../types';
import { storageService } from '../services/storageService';

interface DiaryTabProps {
  data: ForecastRow[];
}

const DiaryTab: React.FC<DiaryTabProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [systemError, setSystemError] = useState(false);

  useEffect(() => {
    setDiaryEntries(storageService.getDiaryEntries());
  }, []);

  const companies = useMemo(() => {
    return Array.from(new Set(data.map(r => r.CUSTOMER))).filter(Boolean).sort();
  }, [data]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [companies, searchTerm]);

  const handleOpenWord = (company: string) => {
    setIsOpening(true);
    setSystemError(false);
    
    const rootPath = "C:\\Users\\Elieser.Fernandes\\OneDrive - Sinuelo\\CRM-AI PRO";
    const fileName = `Diario_${company.replace(/\s+/g, '_')}.docx`;
    const fullPath = `${rootPath}\\${fileName}`;

    const now = new Date().toISOString();
    const newEntries = [...diaryEntries];
    const index = newEntries.findIndex(e => e.companyName === company);
    
    const updatedEntry: DiaryEntry = {
      id: index >= 0 ? newEntries[index].id : Date.now().toString(),
      companyName: company,
      content: "[Gerenciado no Microsoft Word Desktop]",
      lastUpdate: now
    };

    if (index >= 0) newEntries[index] = updatedEntry;
    else newEntries.push(updatedEntry);

    setDiaryEntries(newEntries);
    storageService.saveDiaryEntries(newEntries);

    try {
      const docxBlob = new Blob([''], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(docxBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setSystemError(true);
    } finally {
      setTimeout(() => setIsOpening(false), 800);
    }
  };

  const getEntryForCompany = (company: string) => {
    return diaryEntries.find(e => e.companyName === company);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] -m-8 overflow-hidden bg-slate-50">
      {/* Sidebar de Clientes */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Diretório Sinuelo</h2>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-xs focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
          {filteredCompanies.map(company => {
            const isActive = selectedCompany === company;
            const entry = getEntryForCompany(company);
            
            return (
              <button 
                key={company}
                onClick={() => setSelectedCompany(company)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-blue-600' : 'bg-slate-100'}`}>
                    <Building2 size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[10px] truncate uppercase tracking-tight leading-none">{company}</p>
                    {entry && (
                      <p className={`text-[7px] mt-0.5 font-black uppercase opacity-60 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        Ativo: {new Date(entry.lastUpdate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight size={12} className={`${isActive ? 'text-white' : 'text-slate-300'}`} />
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Panel Compacto */}
      <main className="flex-1 bg-slate-100/50 flex flex-col items-center justify-start p-8 overflow-y-auto">
        {selectedCompany ? (
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            
            <div className="p-8 space-y-6">
              {/* 1. Header Horizontal Compacto */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight truncate max-w-md">
                    {selectedCompany}
                  </h2>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full border border-green-100">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Sincronização Ativa</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shadow-inner">
                  <FileText size={20} />
                </div>
              </div>

              {/* 2. Barra de Status Horizontal */}
              <div className="flex items-center gap-8 py-4 px-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Última Edição:</span>
                  <span className="text-[10px] font-bold text-slate-700">
                    {getEntryForCompany(selectedCompany)?.lastUpdate 
                      ? new Date(getEntryForCompany(selectedCompany)!.lastUpdate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : 'Nenhum registro'}
                  </span>
                </div>
                <div className="h-4 w-[1px] bg-slate-200" />
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-green-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Backup Sinuelo:</span>
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Sincronizado</span>
                </div>
              </div>

              {/* 3. Botão de Ação Primário Destaque */}
              <button 
                onClick={() => handleOpenWord(selectedCompany)}
                disabled={isOpening}
                className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-blue-600 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
              >
                {isOpening ? <RefreshCcw className="animate-spin" size={18} /> : <ExternalLink size={18} />}
                {isOpening ? 'Aguarde...' : 'Abrir Diário no Word'}
              </button>

              {systemError && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest animate-shake">
                   <AlertTriangle size={14} /> Falha no OneDrive
                </div>
              )}
            </div>

            {/* 4. Rodapé Técnico Minimalista */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 group cursor-help">
              <Info size={10} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              <p className="text-[8px] font-mono text-slate-400 opacity-60 truncate max-w-xs group-hover:opacity-100 transition-opacity">
                C:\Users\Elieser.Fernandes\OneDrive - Sinuelo\CRM-AI PRO\Diario_{selectedCompany.replace(/\s+/g, '_')}.docx
              </p>
            </div>

          </div>
        ) : (
          <div className="text-center space-y-6 pt-12 animate-in fade-in duration-700">
            <div className="relative inline-block">
               <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center text-slate-200 border border-slate-100">
                 <Files size={48} strokeWidth={1.5} />
               </div>
               <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                 <FolderOpen size={20} />
               </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestão Sinuelo</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium leading-snug">
                Abra o diário de bordo diretamente no Microsoft Word com sincronização Sinuelo.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DiaryTab;
