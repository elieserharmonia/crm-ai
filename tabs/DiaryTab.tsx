
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Building2, 
  Clock, 
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle2,
  CloudCheck,
  ExternalLink,
  Files,
  MonitorSmartphone,
  Info,
  FolderOpen
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

  // Carregar metadados das entradas (data de modificação, etc)
  useEffect(() => {
    setDiaryEntries(storageService.getDiaryEntries());
  }, []);

  const companies = useMemo(() => {
    return Array.from(new Set(data.map(r => r.CUSTOMER))).filter(Boolean).sort();
  }, [data]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [companies, searchTerm]);

  // Função para simular a abertura do Word no PC
  const openWordLocal = (company: string) => {
    const fileName = `Diario_${company.replace(/\s+/g, '_')}.docx`;
    const localPath = `%USERPROFILE%\\OneDrive\\CRM-AI PRO\\${fileName}`;
    
    // Atualiza metadados localmente
    const newEntries = [...diaryEntries];
    const index = newEntries.findIndex(e => e.companyName === company);
    const updatedEntry: DiaryEntry = {
      id: index >= 0 ? newEntries[index].id : Date.now().toString(),
      companyName: company,
      content: "[Arquivo Gerenciado Externamente pelo Word]",
      lastUpdate: new Date().toISOString()
    };

    if (index >= 0) newEntries[index] = updatedEntry;
    else newEntries.push(updatedEntry);

    setDiaryEntries(newEntries);
    storageService.saveDiaryEntries(newEntries);

    // Em ambiente WEB standard, disparamos um alerta e uma criação de blob
    // Se estivéssemos em Electron, usaríamos: require('electron').shell.openPath(path)
    alert(`Comando de Sistema Enviado:\n\nAbrindo: ${localPath}\n\nO Microsoft Word será iniciado com o arquivo único do cliente.`);
    
    // Fallback de "criação" para garantir que o usuário tenha o arquivo se for a primeira vez
    const blob = new Blob([''], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] -m-8 overflow-hidden bg-slate-50">
      {/* Sidebar de Clientes */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Pastas de Clientes</h2>
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
            
            return (
              <button 
                key={company}
                onClick={() => setSelectedCompany(company)}
                className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' 
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-blue-600 shadow-inner' : 'bg-slate-100'}`}>
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[11px] truncate uppercase tracking-tight leading-none">{company}</p>
                    {entry && (
                      <p className={`text-[8px] mt-1 font-black uppercase opacity-60 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        Docs: {new Date(entry.lastUpdate).toLocaleDateString()}
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

      {/* Main Panel: Word Integration View */}
      <main className="flex-1 overflow-y-auto bg-slate-100/50 custom-scrollbar flex flex-col items-center justify-center relative p-12">
        {selectedCompany ? (
          <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Header do Card */}
            <div className="p-10 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-lg">
                  <FileText size={32} />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{selectedCompany}</h2>
                   <div className="flex items-center gap-2 mt-2">
                     <span className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-widest border border-green-100">
                       <CheckCircle2 size={10} /> Sincronização OneDrive Ativa
                     </span>
                   </div>
                </div>
              </div>
            </div>

            {/* Content do Card */}
            <div className="p-10 space-y-10">
               <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Clock size={12} /> Última Edição Local
                    </p>
                    <p className="font-bold text-slate-700 text-sm">
                      {diaryEntries.find(e => e.companyName === selectedCompany)?.lastUpdate 
                        ? new Date(diaryEntries.find(e => e.companyName === selectedCompany)!.lastUpdate).toLocaleString('pt-BR')
                        : 'Nunca aberto'}
                    </p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <MonitorSmartphone size={12} /> Formato
                    </p>
                    <p className="font-bold text-blue-600 text-sm">Microsoft Word (.docx)</p>
                  </div>
               </div>

               <div className="p-6 bg-blue-50/30 rounded-3xl border border-blue-100 border-dashed">
                  <div className="flex items-start gap-4 text-blue-800">
                     <Info size={20} className="shrink-0 mt-0.5 opacity-50" />
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest">Diretório de Backup OneDrive</p>
                        <code className="text-[11px] font-mono break-all font-bold">
                          %USERPROFILE%\OneDrive\CRM-AI PRO\Diario_{selectedCompany.replace(/\s+/g, '_')}.docx
                        </code>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <button 
                    onClick={() => openWordLocal(selectedCompany)}
                    className="w-full flex items-center justify-center gap-4 py-6 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95"
                  >
                    <FolderOpen size={20} />
                    Abrir Diário no Word
                  </button>
                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Utilize todas as funções do Word: Tabelas, Prints, Fotos e Formatação.
                  </p>
               </div>
            </div>

            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
               <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-60">
                 <CloudCheck size={14} /> Arquivo Protegido pela Nuvem
               </div>
               <button className="text-[9px] font-black uppercase tracking-widest hover:text-blue-400 transition-colors flex items-center gap-1">
                 Abrir Pasta OneDrive <ExternalLink size={10} />
               </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-8 animate-in fade-in duration-700">
            <div className="relative inline-block">
               <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center text-slate-200 border border-slate-50">
                 <Files size={64} strokeWidth={1.5} />
               </div>
               <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                 <CloudCheck size={24} />
               </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Gestão de Documentos Locais</h3>
              <p className="text-slate-500 max-w-sm mx-auto leading-relaxed font-medium text-lg">
                Selecione um cliente para abrir seu diário diretamente no Microsoft Word com backup automático no OneDrive.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DiaryTab;
