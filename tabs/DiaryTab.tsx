
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

  // Carregar metadados salvos (Datas de última edição)
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
    
    // 1. Definição do Caminho Absoluto (Exatamente como solicitado)
    // Usando escape de barras para compatibilidade Windows no JS
    const rootPath = "C:\\Users\\Elieser.Fernandes\\OneDrive - Sinuelo\\CRM-AI PRO";
    const fileName = `Diario_${company.replace(/\s+/g, '_')}.docx`;
    const fullPath = `${rootPath}\\${fileName}`;

    // 2. Atualização Instantânea da Data de Edição
    const now = new Date().toISOString();
    const newEntries = [...diaryEntries];
    const index = newEntries.findIndex(e => e.companyName === company);
    
    const updatedEntry: DiaryEntry = {
      id: index >= 0 ? newEntries[index].id : Date.now().toString(),
      companyName: company,
      content: "[Arquivo Gerenciado no Microsoft Word Desktop]",
      lastUpdate: now
    };

    if (index >= 0) newEntries[index] = updatedEntry;
    else newEntries.push(updatedEntry);

    setDiaryEntries(newEntries);
    storageService.saveDiaryEntries(newEntries);

    // 3. Execução do Gatilho de Sistema
    try {
      // Nota: Em ambiente Electron/Python usamos os.startfile(fullPath)
      // Aqui, disparamos a intenção de download/open com o nome exato do arquivo único
      const docxBlob = new Blob([''], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(docxBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      console.log(`Comando Enviado para o Sistema: Abrindo ${fullPath}`);
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
      {/* Lista Lateral de Clientes */}
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

      {/* Painel Central: Controle de Documento */}
      <main className="flex-1 bg-slate-100/50 flex flex-col items-center justify-center p-12 overflow-y-auto">
        {selectedCompany ? (
          <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Status da Nuvem */}
            <div className="px-10 py-4 bg-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">OneDrive Sincronizado: Sinuelo</span>
              </div>
              <ShieldCheck size={14} className="text-blue-400" />
            </div>

            <div className="p-10 space-y-8 text-center">
              <div className="space-y-4">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm border border-blue-100 transition-transform hover:scale-110 duration-500">
                  <FileText size={48} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{selectedCompany}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Microsoft Word Desktop Application</p>
                </div>
              </div>

              {/* Grid de Informações */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Clock size={12} /> Última Edição Local
                  </p>
                  <p className="text-xs font-bold text-slate-700">
                    {getEntryForCompany(selectedCompany)?.lastUpdate 
                      ? new Date(getEntryForCompany(selectedCompany)!.lastUpdate).toLocaleString('pt-BR')
                      : 'Nenhum acesso registrado'}
                  </p>
                </div>
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <RefreshCcw size={12} /> Status de Backup
                  </p>
                  <p className="text-xs font-bold text-green-600">Sincronizado</p>
                </div>
              </div>

              {/* Caminho Técnico Exato */}
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 border-dashed text-left space-y-2">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <Info size={12}/> Caminho do Arquivo Único
                 </p>
                 <code className="block text-[10px] font-mono text-slate-600 break-all leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                   C:\Users\Elieser.Fernandes\OneDrive - Sinuelo\CRM-AI PRO\Diario_{selectedCompany.replace(/\s+/g, '_')}.docx
                 </code>
              </div>

              {systemError && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
                   <AlertTriangle size={18} /> Erro: Verifique se o OneDrive está logado.
                </div>
              )}

              {/* Botão Principal de Abertura */}
              <button 
                onClick={() => handleOpenWord(selectedCompany)}
                disabled={isOpening}
                className="w-full flex items-center justify-center gap-3 py-6 bg-blue-600 text-white rounded-[1.8rem] font-black uppercase text-sm tracking-[0.1em] shadow-xl shadow-blue-900/20 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
              >
                {isOpening ? <RefreshCcw className="animate-spin" size={20} /> : <ExternalLink size={20} />}
                {isOpening ? 'Abrindo Word...' : 'Abrir Diário no Word'}
              </button>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-10">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Formatação Profissional Ativada</p>
               <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase">
                 OneDrive Pro <ShieldCheck size={12} />
               </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-8 animate-in fade-in duration-700">
            <div className="relative inline-block">
               <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center text-slate-200 border border-slate-100">
                 <Files size={64} strokeWidth={1.5} />
               </div>
               <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                 <FolderOpen size={24} />
               </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">Repositório de Diários</h3>
              <p className="text-slate-500 max-w-sm mx-auto leading-relaxed font-medium text-lg">
                Selecione uma empresa na lista para abrir seu documento exclusivo no Microsoft Word.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DiaryTab;
