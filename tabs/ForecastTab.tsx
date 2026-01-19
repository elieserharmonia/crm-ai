
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Upload, 
  Plus,
  Check,
  X as CloseIcon,
  Columns,
  Table as TableIcon,
  AlertCircle,
  MessageCircle,
  MoreHorizontal,
  Terminal,
  FileWarning,
  CheckCircle2,
  Database
} from 'lucide-react';
import { ForecastRow, User } from '../types';

interface ForecastTabProps {
  data: ForecastRow[];
  setData: (data: ForecastRow[]) => void;
  onRowSelect: (row: ForecastRow) => void;
  user: User;
}

interface DebugLog {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

const ForecastTab: React.FC<ForecastTabProps> = ({ data, setData, onRowSelect, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [importPreview, setImportPreview] = useState<ForecastRow[] | null>(null);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setDebugLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), message, type }, ...prev]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrors([]);
    setDebugLogs([]);
    addLog(`Iniciando leitura bruta do arquivo: ${file.name}`);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        // Lemos com raw: true para evitar que a biblioteca tente adivinhar tipos e perca dados
        const wb = XLSX.read(bstr, { type: 'binary', raw: true });
        
        const sheetName = "01.2026";
        const ws = wb.Sheets[sheetName];
        
        if (!ws) { 
          const msg = `Aba "${sheetName}" não encontrada. Verifique o nome da aba no Excel.`;
          addLog(msg, 'error');
          setImportErrors([msg]);
          return; 
        }

        // Converter para matriz de strings para garantir leitura de todas as células
        const matrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
        
        if (matrix.length < 1) {
          addLog("O arquivo parece estar vazio.", "error");
          return;
        }

        // Mapeamento exato de cabeçalhos
        const headers = matrix[0].map(h => String(h || '').trim().toUpperCase());
        addLog(`Colunas detectadas: ${headers.join(' | ')}`);

        const findIdx = (names: string[]) => {
          return headers.findIndex(h => names.some(n => h === n.toUpperCase()));
        };

        const colMap = {
          resp: findIdx(['RESP.', 'RESP', 'RESPONSÁVEL']),
          customer: findIdx(['CUSTOMER', 'CLIENTE']),
          supplier: findIdx(['SUPPLIER', 'FORNECEDOR']),
          description: findIdx(['DESCRIPTION', 'DESCRIÇÃO']),
          amount: findIdx(['AMOUNT', 'VALOR']),
          uf: findIdx(['UF']),
          confidence: findIdx(['CONFIDENCE', 'CONFIANÇA', 'CONF.']),
          jan: findIdx(['JAN']),
          fev: findIdx(['FEV']),
          mar: findIdx(['MAR']),
          y2026: findIdx(['2026']),
          followUp: findIdx(['FOLLOW-UP', 'FOLLOWUP', 'ACOMPANHAMENTO']),
          contacts: findIdx(['CONTATOS', 'CONTATO', 'CONTACTS'])
        };

        // Validação estrita das colunas pedidas pelo usuário
        const criticalMissing = [];
        if (colMap.description === -1) criticalMissing.push("DESCRIPTION (DESCRIÇÃO)");
        if (colMap.amount === -1) criticalMissing.push("AMOUNT (VALOR)");
        if (colMap.followUp === -1) criticalMissing.push("FOLLOW-UP");
        if (colMap.contacts === -1) criticalMissing.push("CONTATOS");

        if (criticalMissing.length > 0) {
          const msg = `Colunas obrigatórias não encontradas: ${criticalMissing.join(', ')}`;
          addLog(msg, 'error');
          setImportErrors([msg]);
          return;
        }

        const rows: ForecastRow[] = matrix.slice(1)
          .filter(row => row.some(cell => String(cell).trim() !== ""))
          .map((row, idx) => {
            // Limpeza de Valor (Trata R$ 1.500,00 ou 1500.00)
            const rawAmount = String(row[colMap.amount] || '0');
            const cleanAmount = parseFloat(rawAmount.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

            // Confiança (Trata 0.9 como 90 ou 90 como 90)
            const rawConf = row[colMap.confidence];
            let confidence = typeof rawConf === 'number' ? (rawConf <= 1 ? rawConf * 100 : rawConf) : parseFloat(String(rawConf)) || 0;

            return {
              id: `row-${idx}-${Date.now()}`,
              'Unnamed: 0': idx + 1,
              'RESP.': String(row[colMap.resp] || '').trim(),
              'CUSTOMER': String(row[colMap.customer] || '').trim().toUpperCase(),
              'SUPPLIER': String(row[colMap.supplier] || '').trim(),
              'DESCRIPTION': String(row[colMap.description] || '').trim(),
              'AMOUNT': cleanAmount,
              'UF': String(row[colMap.uf] || '').toUpperCase().trim(),
              'Confidence': Math.round(confidence),
              'JAN': String(row[colMap.jan] || '').toLowerCase() === 'x' ? 'x' : '',
              'FEV': String(row[colMap.fev] || '').toLowerCase() === 'x' ? 'x' : '',
              'MAR': String(row[colMap.mar] || '').toLowerCase() === 'x' ? 'x' : '',
              '2026': String(row[colMap.y2026] || '').toLowerCase() === 'x' ? 'x' : '',
              'FOLLOW-UP': String(row[colMap.followUp] || '').trim(),
              'CONTATOS': String(row[colMap.contacts] || '').trim(),
              oweInfoToClient: false,
            };
          });

        addLog(`Sucesso: ${rows.length} linhas processadas integralmente.`, 'success');
        setImportPreview(rows);
      } catch (err: any) {
        addLog(`Erro crítico no processamento: ${err.message}`, 'error');
        setImportErrors([`Erro ao processar arquivo: ${err.message}`]);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const filteredData = useMemo(() => {
    return data.filter(row => 
      [row.CUSTOMER, row.SUPPLIER, row.DESCRIPTION, row.UF, row['RESP.']]
        .some(val => val?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data, searchTerm]);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] space-y-6">
      {/* Search and Upload Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
        <div className="flex gap-4 items-center flex-1 w-full max-w-xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar no forecast..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200">
            <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}><TableIcon size={16}/></button>
            <button onClick={() => setViewMode('kanban')} className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}><Columns size={16}/></button>
          </div>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 cursor-pointer font-black shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
            <Upload size={20} /> Importar Planilha 2026
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-[13px] text-left border-collapse min-w-[1500px]">
            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Ações</th>
                {['Resp.', 'Cliente', 'Fornecedor', 'Descrição', 'Valor', 'UF', 'Conf. %', 'Jan', 'Fev', 'Mar', '2026'].map(h => (
                  <th key={h} className="p-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => (
                <tr 
                  key={row.id} 
                  className={`cursor-pointer hover:bg-slate-50 transition-all group border-l-4 border-transparent hover:border-blue-500 ${row.oweInfoToClient ? 'row-owe-info' : ''}`} 
                  onClick={() => onRowSelect(row)}
                >
                  <td className="p-5 text-center">
                    <button className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:text-blue-600 transition-all"><MoreHorizontal size={14}/></button>
                  </td>
                  <td className="p-5 font-bold text-slate-500">{row['RESP.']}</td>
                  <td className="p-5 font-black text-slate-900 uppercase">{row.CUSTOMER}</td>
                  <td className="p-5 font-bold text-slate-400">{row.SUPPLIER}</td>
                  <td className="p-5 truncate max-w-[250px] italic font-medium text-slate-600">{row.DESCRIPTION || <span className="text-red-300">Vazio</span>}</td>
                  <td className="p-5 font-mono font-black text-slate-900 text-sm">
                    {row.AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="p-5 text-center font-black text-slate-300">{row.UF}</td>
                  <td className="p-5 text-center">
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black">{row.Confidence}%</span>
                  </td>
                  {['JAN', 'FEV', 'MAR', '2026'].map(m => (
                    <td key={m} className="p-5 text-center">
                      {row[m as keyof ForecastRow] === 'x' && <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-white shadow-lg"><Check size={12} strokeWidth={4}/></div>}
                    </td>
                  ))}
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <Database size={48} className="opacity-20" />
                      <p className="font-bold">Nenhum dado encontrado. Importe sua planilha para começar.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation & Preview Modal */}
      {importPreview && (
        <div className="fixed inset-0 bg-slate-900/95 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden border-4 border-white/10">
             <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-4">
                 <div className="p-4 bg-green-100 text-green-600 rounded-3xl">
                   <CheckCircle2 size={32}/>
                 </div>
                 <div>
                   <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Validar Importação</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Conferência de Integridade das Colunas Criticas</p>
                 </div>
               </div>
               <button onClick={() => {setImportPreview(null); setDebugLogs([]);}} className="p-4 hover:bg-white rounded-2xl shadow-sm text-slate-400 transition-all"><CloseIcon size={24}/></button>
             </div>

             <div className="flex-1 flex flex-col min-h-0">
                {/* Debug Panel */}
                <div className="bg-slate-900 p-6 font-mono text-[10px] text-slate-400 space-y-1 overflow-auto max-h-40 border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-2 text-blue-400 font-black mb-2 uppercase tracking-widest">
                    <Terminal size={14}/> Log de Processamento Bruto
                  </div>
                  {debugLogs.map((log, i) => (
                    <div key={i} className={`flex gap-3 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : ''}`}>
                      <span className="opacity-40">[{log.timestamp}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 overflow-auto p-10 custom-scrollbar">
                   {importErrors.length > 0 ? (
                     <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
                        <FileWarning size={64} className="text-red-500 animate-bounce" />
                        <div className="space-y-2">
                           <h4 className="text-2xl font-black text-slate-900">Erro de Mapeamento</h4>
                           {importErrors.map((err, i) => (
                             <p key={i} className="text-red-600 font-bold bg-red-50 px-4 py-2 rounded-xl">{err}</p>
                           ))}
                        </div>
                     </div>
                   ) : (
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-widest text-[9px]">
                        <tr>
                          <th className="p-4">Cliente</th>
                          <th className="p-4">Descrição</th>
                          <th className="p-4 text-right">Valor Bruto</th>
                          <th className="p-4">Follow-up</th>
                          <th className="p-4">Contatos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.slice(0, 10).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-4 font-black uppercase text-blue-600">{row.CUSTOMER}</td>
                            <td className="p-4 italic text-slate-600 truncate max-w-[200px]">{row.DESCRIPTION || <span className="text-red-500 font-black">VAZIO</span>}</td>
                            <td className="p-4 text-right font-mono font-black">{row.AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="p-4 italic text-slate-400 truncate max-w-[200px]">{row['FOLLOW-UP'] || <span className="text-red-500 font-black">VAZIO</span>}</td>
                            <td className="p-4 font-bold truncate max-w-[150px]">{row.CONTATOS || <span className="text-red-500 font-black">VAZIO</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                   )}
                </div>
             </div>

             <div className="p-10 border-t bg-slate-50/50 flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <AlertCircle size={20} className="text-amber-500"/>
                 <p className="text-xs font-bold text-slate-500">Foram processadas {importPreview.length} linhas. Confira os dados acima.</p>
               </div>
               <div className="flex gap-6">
                 <button onClick={() => {setImportPreview(null); setDebugLogs([]);}} className="px-10 py-4 font-black text-slate-400 uppercase tracking-widest">Cancelar</button>
                 <button 
                  disabled={importErrors.length > 0}
                  onClick={() => { setData(importPreview); setImportPreview(null); setDebugLogs([]); }} 
                  className={`px-14 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 uppercase text-xs tracking-widest ${importErrors.length > 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                 >
                   Confirmar Importação
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastTab;
