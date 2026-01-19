
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
    addLog(`Lendo planilha: ${file.name}`);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', raw: true });
        const sheetName = "01.2026";
        const ws = wb.Sheets[sheetName];
        
        if (!ws) { 
          const msg = `Aba "${sheetName}" não encontrada.`;
          addLog(msg, 'error');
          setImportErrors([msg]);
          return; 
        }

        const matrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
        if (matrix.length < 1) return;

        const headers = matrix[0].map(h => String(h || '').trim().toUpperCase());
        addLog(`Colunas na planilha: ${headers.join(' | ')}`);

        const findIdx = (names: string[]) => {
          return headers.findIndex(h => names.some(n => h === n.toUpperCase()));
        };

        const colMap = {
          resp: findIdx(['RESP.', 'RESP']),
          cliente: findIdx(['CLIENTE', 'CUSTOMER']),
          fornecedor: findIdx(['FORNECEDOR', 'SUPPLIER']),
          descricao: findIdx(['DESCRIÇÃO', 'DESCRIPTION']),
          valor: findIdx(['VALOR', 'AMOUNT']),
          uf: findIdx(['UF']),
          conf: findIdx(['CONFIDÊNCIA', 'CONFIANÇA', 'CONF.', 'CONF']),
          jan: findIdx(['JAN']),
          fev: findIdx(['FEV']),
          mar: findIdx(['MAR']),
          y2026: findIdx(['2026']),
          followUp: findIdx(['FOLLOW-UP', 'FOLLOWUP']),
          contacts: findIdx(['CONTATOS', 'CONTATO'])
        };

        const rows: ForecastRow[] = matrix.slice(1)
          .filter(row => row.some(cell => String(cell).trim() !== ""))
          .map((row, idx) => {
            const rawAmount = String(row[colMap.valor] || '0');
            const cleanAmount = parseFloat(rawAmount.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
            const rawConf = row[colMap.conf];
            let confidence = typeof rawConf === 'number' ? (rawConf <= 1 ? rawConf * 100 : rawConf) : parseFloat(String(rawConf)) || 0;

            return {
              id: `row-${idx}-${Date.now()}`,
              'Unnamed: 0': idx + 1,
              'RESP.': String(row[colMap.resp] || '').trim(),
              'CLIENTE': String(row[colMap.cliente] || '').trim().toUpperCase(),
              'FORNECEDOR': String(row[colMap.fornecedor] || '').trim(),
              'DESCRIÇÃO': String(row[colMap.descricao] || '').trim(),
              'VALOR': cleanAmount,
              'UF': String(row[colMap.uf] || '').toUpperCase().trim(),
              'CONFIDÊNCIA': Math.round(confidence),
              'JAN': String(row[colMap.jan] || '').toLowerCase() === 'x' ? 'x' : '',
              'FEV': String(row[colMap.fev] || '').toLowerCase() === 'x' ? 'x' : '',
              'MAR': String(row[colMap.mar] || '').toLowerCase() === 'x' ? 'x' : '',
              '2026': String(row[colMap.y2026] || '').toLowerCase() === 'x' ? 'x' : '',
              'FOLLOW-UP': String(row[colMap.followUp] || '').trim(),
              'CONTATOS': String(row[colMap.contacts] || '').trim(),
              oweInfoToClient: false,
            };
          });

        setImportPreview(rows);
      } catch (err: any) {
        addLog(`Erro: ${err.message}`, 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const filteredData = useMemo(() => {
    return data.filter(row => 
      [row.CLIENTE, row.FORNECEDOR, row.DESCRIÇÃO, row.UF, row['RESP.']]
        .some(val => val?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data, searchTerm]);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
        <div className="flex gap-4 items-center flex-1 w-full max-w-xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar..."
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
        <button className="relative overflow-hidden group">
          <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 cursor-pointer font-black shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
            <Upload size={20} /> Importar Planilha
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
        </button>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-[13px] text-left border-collapse min-w-[1500px]">
            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Ações</th>
                {['RESP.', 'CLIENTE', 'FORNECEDOR', 'DESCRIÇÃO', 'VALOR', 'UF', 'CONF. %', 'JAN', 'FEV', 'MAR', '2026'].map(h => (
                  <th key={h} className="p-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => (
                <tr key={row.id} className="cursor-pointer hover:bg-slate-50 transition-all group border-l-4 border-transparent hover:border-blue-500" onClick={() => onRowSelect(row)}>
                  <td className="p-5 text-center"><MoreHorizontal size={14} className="text-slate-400" /></td>
                  <td className="p-5 font-bold text-slate-500">{row['RESP.']}</td>
                  <td className="p-5 font-black text-slate-900 uppercase">{row.CLIENTE}</td>
                  <td className="p-5 font-bold text-slate-400">{row.FORNECEDOR}</td>
                  <td className="p-5 truncate max-w-[250px] italic font-medium text-slate-600">{row['DESCRIÇÃO']}</td>
                  <td className="p-5 font-mono font-black text-slate-900 text-sm">{row.VALOR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="p-5 text-center font-black text-slate-300">{row.UF}</td>
                  <td className="p-5 text-center"><span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black">{row.CONFIDÊNCIA}%</span></td>
                  {['JAN', 'FEV', 'MAR', '2026'].map(m => (
                    <td key={m} className="p-5 text-center">
                      {row[m as keyof ForecastRow] === 'x' && <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-white shadow-lg"><Check size={12} strokeWidth={4}/></div>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {importPreview && (
        <div className="fixed inset-0 bg-slate-900/95 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
             <div className="p-10 border-b flex justify-between items-center">
               <h3 className="text-3xl font-black text-slate-800 uppercase">Validar Importação</h3>
               <button onClick={() => setImportPreview(null)}><CloseIcon size={24} className="text-slate-400" /></button>
             </div>
             <div className="flex-1 overflow-auto p-10 custom-scrollbar">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-widest text-[9px]">
                    <tr>
                      <th className="p-4">CLIENTE</th>
                      <th className="p-4">DESCRIÇÃO</th>
                      <th className="p-4 text-right">VALOR</th>
                      <th className="p-4">FOLLOW-UP</th>
                      <th className="p-4">CONTATOS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importPreview.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-4 font-black uppercase text-blue-600">{row.CLIENTE}</td>
                        <td className="p-4 italic text-slate-600 truncate max-w-[200px]">{row.DESCRIÇÃO || "---"}</td>
                        <td className="p-4 text-right font-mono font-black">{row.VALOR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td className="p-4 italic text-slate-400 truncate max-w-[200px]">{row['FOLLOW-UP'] || "---"}</td>
                        <td className="p-4 font-bold truncate max-w-[150px]">{row.CONTATOS || "---"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
             <div className="p-10 border-t bg-slate-50/50 flex justify-end gap-6">
               <button onClick={() => setImportPreview(null)} className="px-10 py-4 font-black text-slate-400 uppercase">Cancelar</button>
               <button onClick={() => { setData(importPreview); setImportPreview(null); }} className="px-14 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest">Confirmar Importação</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastTab;
