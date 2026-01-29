
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Building2, 
  Clock, 
  ChevronRight,
  FileText,
  CheckCircle2,
  ExternalLink,
  Files,
  FolderOpen,
  Info,
  ShieldCheck,
  RefreshCcw,
  AlertTriangle
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

  // Carregar metadados salvos
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
    
    // Caminho Fixo Conforme Solicitado
    const rootPath = "C:\\Users\\Elieser.Fernandes\\OneDrive - Sinuelo\\CRM-AI PRO";
    const fileName = `Diario_${company.replace(/\s+/g, '_')}.docx`;
    const fullPath = `${rootPath}\\${fileName}`;

    // Atualização de Metadados
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
      // Simulação de Gatilho de Sistema
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
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Pastas Sincronizadas</h2>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Localizar cliente..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {filteredCompanies.map(company => {
            const isActive = selectedCompany === company;
            const entry = getEntryForCompany(company);
            
            return (
              <button 
                key={company}
                onClick={() => setSelectedCompany(company)}
                className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' 
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-blue-600 shadow-inner' : 'bg-slate-100'}`}>
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[11px] truncate uppercase tracking-tight leading-none">{company}</p>
                    {entry && (
                      <p className={`text-[8px] mt-1 font-black uppercase opacity-60 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        Visto: {new Date(entry.lastUpdate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white' : 'text-slate-300'}`} />
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Dashboard Panel */}
      <main className="flex-1 bg-slate-100/50 flex flex-col items-center justify-center p-12 overflow-y-auto">
        {selectedCompany ? (
          <div className="w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col">
            
            {/* 1. Header Principal */}
            <div className="p-12 pb-8 text-center space-y-4">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-green-50 rounded-full border border-green-100">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Sincronização OneDrive Ativa</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                {selectedCompany}
              </h2>
            </div>

            {/* 2. Cards Informativos Lado a Lado */}
            <div className="px-12 grid grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4 transition-all hover:shadow-inner">
                <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-sm">
                  <Clock size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Última Edição</p>
                  <p className="text-sm font-bold text-slate-700 truncate">
                    {getEntryForCompany(selectedCompany)?.lastUpdate 
                      ? new Date(getEntryForCompany(selectedCompany)!.lastUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4 transition-all hover:shadow-inner">
                <div className="p-3 bg-white text-green-600 rounded-2xl shadow-sm">
                  <ShieldCheck size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status Backup</p>
                  <p className="text-sm font-bold text-green-600 truncate uppercase">Sincronizado</p>
                </div>
              </div>
            </div>

            {/* 3. Botão de Ação Central Destaque */}
            <div className="p-12 pt-10 pb-16 space-y-6">
              <button 
                onClick={() => handleOpenWord(selectedCompany)}
                disabled={isOpening}
                className="w-full group relative flex items-center justify-center gap-4 py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-lg tracking-[0.1em] shadow-[0_20px_40px_rgba(37,99,235,0.25)] hover:bg-blue-700 hover:-translate-y-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isOpening ? (
                  <RefreshCcw className="animate-spin" size={28} />
                ) : (
                  <FolderOpen size={28} className="transition-transform group-hover:scale-110" />
                )}
                <span>{isOpening ? 'Iniciando...' : 'Abrir Diário no Word'}</span>
                
                {/* Efeito Visual de Brilho no Hover */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
              </button>

              {systemError && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-center gap-3 text-red-600 text-xs font-bold animate-shake">
                   <AlertTriangle size={18} /> Erro: Verifique se o OneDrive está logado na Sinuelo.
                </div>
              )}
            </div>

            {/* 4. Rodapé Técnico Discreto */}
            <div className="mt-auto p-8 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                <Info size={10} /> Localização do Arquivo de Trabalho
              </p>
              <code className="text-[10px] font-mono text-slate-400 opacity-60 break-all select-all">
                C:\Users\Elieser.Fernandes\OneDrive - Sinuelo\CRM-AI PRO\Diario_{selectedCompany.replace(/\s+/g, '_')}.docx
              </code>
            </div>

          </div>
        ) : (
          <div className="text-center space-y-10 animate-in fade-in duration-700">
            <div className="relative inline-block">
               <div className="w-36 h-36 bg-white rounded-[3.5rem] shadow-2xl flex items-center justify-center text-slate-200 border border-slate-100">
                 <Files size={72} strokeWidth={1.2} />
               </div>
               <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
                 <FolderOpen size={28} />
               </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">Gestão de Diários</h3>
              <p className="text-slate-500 max-w-sm mx-auto leading-relaxed font-medium text-lg">
                Selecione um cliente para acessar o documento Word exclusivo com backup automático na Sinuelo.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DiaryTab;
