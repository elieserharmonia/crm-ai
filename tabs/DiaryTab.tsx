
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
  Link as LinkIcon,
  Globe,
  Save,
  CheckCircle2,
  CloudCheck,
  AlertTriangle,
  Settings
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
  const [linkInput, setLinkInput] = useState('');
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setDiaryEntries(storageService.getDiaryEntries());
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      const entry = diaryEntries.find(e => e.companyName === selectedCompany);
      setLinkInput(entry?.diaryLink || '');
      setIsEditingLink(!entry?.diaryLink);
    }
  }, [selectedCompany, diaryEntries]);

  const companies = useMemo(() => {
    return Array.from(new Set(data.map(r => r.CUSTOMER))).filter(Boolean).sort();
  }, [data]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [companies, searchTerm]);

  const handleSaveLink = () => {
    if (!selectedCompany) return;

    storageService.saveDiaryLink(selectedCompany, linkInput);
    setDiaryEntries(storageService.getDiaryEntries());
    setIsEditingLink(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleOpenDiary = () => {
    const entry = diaryEntries.find(e => e.companyName === selectedCompany);
    if (entry?.diaryLink) {
      const officeUrl = `ms-word:ofe|u|${entry.diaryLink}`;
      
      try {
        window.location.href = officeUrl;
        
        // Atualizar data de último acesso
        const now = new Date().toISOString();
        const newEntries = diaryEntries.map(e => 
          e.companyName === selectedCompany ? { ...e, lastUpdate: now } : e
        );
        setDiaryEntries(newEntries);
        storageService.saveDiaryEntries(newEntries);
      } catch (e) {
        console.error("Falha ao abrir o Word Desktop:", e);
        window.open(entry.diaryLink, '_blank', 'noopener,noreferrer');
      }
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
          <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Diretório de Diários</h2>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Localizar cliente..."
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
                    {entry?.lastUpdate && (
                      <p className={`text-[7px] mt-0.5 font-black uppercase opacity-60 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        Visto: {new Date(entry.lastUpdate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {entry?.diaryLink && <CloudCheck size={12} className={isActive ? 'text-blue-400' : 'text-green-500'} />}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Panel Compacto e Focado em Ação */}
      <main className="flex-1 bg-slate-100/50 flex flex-col items-center justify-start p-8 overflow-y-auto">
        {selectedCompany ? (
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            
            <div className="p-8 space-y-5">
              {/* 1. Header Horizontal Compacto */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight truncate max-w-[300px]">
                    {selectedCompany}
                  </h2>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getEntryForCompany(selectedCompany)?.diaryLink ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${getEntryForCompany(selectedCompany)?.diaryLink ? 'bg-blue-500' : 'bg-amber-500'}`} />
                    <span className={`text-[8px] font-black uppercase tracking-widest ${getEntryForCompany(selectedCompany)?.diaryLink ? 'text-blue-700' : 'text-amber-700'}`}>
                      {getEntryForCompany(selectedCompany)?.diaryLink ? 'OneDrive Pronto' : 'Ação Necessária'}
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100">
                  <FileText size={20} />
                </div>
              </div>

              {/* 2. Barra de Status Horizontal */}
              <div className="flex items-center gap-8 py-4 px-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acesso:</span>
                  <span className="text-[10px] font-bold text-slate-700">
                    {getEntryForCompany(selectedCompany)?.lastUpdate 
                      ? new Date(getEntryForCompany(selectedCompany)!.lastUpdate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </span>
                </div>
                <div className="h-4 w-[1px] bg-slate-200" />
                <div className="flex items-center gap-2">
                  <CloudCheck size={14} className={getEntryForCompany(selectedCompany)?.diaryLink ? 'text-green-500' : 'text-slate-300'} />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${getEntryForCompany(selectedCompany)?.diaryLink ? 'text-green-600' : 'text-slate-400'}`}>
                    {getEntryForCompany(selectedCompany)?.diaryLink ? 'Sincronizado' : 'Não Configurado'}
                  </span>
                </div>
              </div>

              {/* 3. Botão de Ação Primário Destaque */}
              <button 
                onClick={handleOpenDiary}
                disabled={!linkInput || isEditingLink}
                className={`w-full flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl transition-all active:scale-95 ${
                  !linkInput || isEditingLink 
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200' 
                    : 'bg-slate-900 text-white hover:bg-blue-600 hover:-translate-y-1'
                }`}
              >
                {!linkInput ? <AlertTriangle size={18} /> : <ExternalLink size={18} />}
                {!linkInput ? 'Link não configurado' : 'Abrir Diário no Word'}
              </button>

              {/* Input de Link Ocultável */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Settings size={12} /> Configuração do Cliente
                  </label>
                  {!isEditingLink && (
                    <button 
                      onClick={() => setIsEditingLink(true)}
                      className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                    >
                      Alterar Link
                    </button>
                  )}
                </div>
                
                {isEditingLink ? (
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 p-3 bg-white border border-slate-200 rounded-xl outline-none text-xs focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      placeholder="Cole a URL do documento OneDrive aqui..."
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                    />
                    <button 
                      onClick={handleSaveLink}
                      className="px-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                    >
                      <Save size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-xl truncate">
                    <Globe size={14} className={linkInput ? 'text-blue-500' : 'text-slate-300'} />
                    <span className="text-[10px] text-slate-400 truncate font-mono">
                      {linkInput || 'Nenhum link configurado para este cliente.'}
                    </span>
                  </div>
                )}
                
                {saveSuccess && (
                  <p className="text-[10px] font-bold text-green-600 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 size={12} /> Link salvo no cadastro do cliente!
                  </p>
                )}
              </div>

              {!linkInput && (
                <div className="p-4 bg-amber-50 rounded-xl flex items-start gap-3 border border-amber-100">
                   <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                   <p className="text-[9px] text-amber-700 font-bold leading-relaxed uppercase tracking-tight">
                     <strong>Atenção:</strong> Adicione o link do OneDrive acima ou no cadastro da oportunidade para habilitar o acesso direto ao Word Desktop.
                   </p>
                </div>
              )}
            </div>

            {/* 4. Rodapé Técnico Minimalista */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 group">
              <Info size={10} className="text-slate-200 group-hover:text-blue-400 transition-colors" />
              <p className="text-[7px] font-mono text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-xs">
                Protocolo Ativo: ms-word:ofe|u|{linkInput || 'null'}
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
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestão de Diários</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium leading-snug">
                Selecione um cliente para abrir o Word via protocolo oficial da Microsoft.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DiaryTab;
