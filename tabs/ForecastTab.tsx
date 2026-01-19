
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Upload, 
  Check,
  X as CloseIcon,
  Columns,
  Table as TableIcon,
  AlertCircle,
  MoreHorizontal,
  Terminal,
  FileWarning,
  CheckCircle2,
  Database,
  XCircle
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
  type: 'info' | 'error' | 'success' | 'debug';
}

const ForecastTab: React.FC<ForecastTabProps> = ({ data, setData, onRowSelect, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [importPreview, setImportPreview] = useState<ForecastRow[] | null>(null);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const addLog = (message: string, type: 'info' | 'error' | 'success' | 'debug' = 'info') => {
    setDebugLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), message, type }, ...prev]);
  };

  const expandMergedCells = (ws: XLSX.WorkSheet) => {
    if (!ws['!merges']) return;
    ws['!merges'].forEach((merge) => {
      const startCell = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
      const value = ws[startCell];
      if (!value) return;

      for (let r = merge.s.r; r <= merge.e.r; r++) {
        for (let c = merge.s.c; c <= merge.e.c; c++) {
          if (r === merge.s.r && c === merge.s.c) continue;
          ws[XLSX.utils.encode_cell({ r, c })] = { ...value };
        }
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrors([]);
    setDebugLogs([]);
    addLog(`Reading File: ${file.name}`);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellNF: true, cellStyles: true });
        
        const sheetName = "01.2026";
        const ws = wb.Sheets[sheetName];
        
        if (!ws) { 
          const msg = `CRITICAL: Sheet "${sheetName}" not found.`;
          addLog(msg, 'error');
          setImportErrors([msg]);
          return; 
        }

        addLog("Expanding merged cells for data integrity...");
        expandMergedCells(ws);

        const matrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
        
        // Header Detection Logic
        const criticalHeaders = ["DESCRIPTION", "AMOUNT", "FOLLOW-UP", "CONTATOS", "CUSTOMER", "SUPPLIER", "RESP.", "Confidence"];
        let headerRowIndex = -1;
        
        for (let r = 0; r < Math.min(30, matrix.length); r++) {
          const row = matrix[r].map(c => String(c || "").trim().toUpperCase());
          const matchCount = criticalHeaders.filter(h => row.includes(h)).length;
          if (matchCount >= 6) { // Most critical headers found
            headerRowIndex = r;
            break;
          }
        }

        if (headerRowIndex === -1) {
          const msg = "CRITICAL: Could not detect header row. Required: " + criticalHeaders.join(", ");
          addLog(msg, "error");
          setImportErrors([msg]);
          return;
        }

        addLog(`Header detected at row ${headerRowIndex + 1}`, 'success');
        const rawHeaders = matrix[headerRowIndex].map(h => String(h || '').trim());
        addLog(`Raw Headers: ${rawHeaders.join(' | ')}`, 'debug');

        const idxOf = (name: string) => rawHeaders.findIndex(h => h.trim().toUpperCase() === name.toUpperCase());

        const colMap = {
          resp: idxOf("RESP."),
          customer: idxOf("CUSTOMER"),
          supplier: idxOf("SUPPLIER"),
          description: idxOf("DESCRIPTION"),
          amount: idxOf("AMOUNT"),
          uf: idxOf("UF"),
          confidence: idxOf("Confidence"),
          jan: idxOf("JAN"),
          fev: idxOf("FEV"),
          mar: idxOf("MAR"),
          y2026: idxOf("2026"),
          followUp: idxOf("FOLLOW-UP"),
          contatos: idxOf("CONTATOS")
        };

        // Validate critical columns are present
        const missing = Object.entries(colMap).filter(([k, v]) => v === -1).map(([k]) => k.toUpperCase());
        if (missing.length > 0) {
          const msg = `FATAL: Missing critical columns: ${missing.join(", ")}`;
          addLog(msg, "error");
          setImportErrors([msg]);
          return;
        }

        const importedRows: ForecastRow[] = matrix.slice(headerRowIndex + 1)
          .filter(row => row.some(cell => String(cell).trim() !== ""))
          .map((row, idx) => {
            const rawAmount = String(row[colMap.amount] || '0');
            const cleanAmount = parseFloat(rawAmount.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
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
              'CONTATOS': String(row[colMap.contatos] || '').trim(),
              oweInfoToClient: false,
            };
          });

        addLog(`Successfully parsed ${importedRows.length} rows.`, 'success');
        
        // Debug first 5 rows for critical columns
        importedRows.slice(0, 5).forEach((r, i) => {
          addLog(`Row ${i+1} Sample: DESC="${r.DESCRIPTION.substring(0, 15)}..." | AMT=${r.AMOUNT} | CONT=${r.CONTATOS.substring(0, 10)}...`, 'debug');
        });

        setImportPreview(importedRows);
      } catch (err: any) {
        addLog(`Fatal Error: ${err.message}`, 'error');
        setImportErrors([`Process failed: ${err.message}`]);
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

  const excelHeaders = ["RESP.", "CUSTOMER", "SUPPLIER", "DESCRIPTION", "AMOUNT", "UF", "Confidence", "JAN", "FEV", "MAR", "2026", "FOLLOW-UP", "CONTATOS"];

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
        <div className="flex gap-4 items-center flex-1 w-full max-w-xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search in all columns..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 cursor-pointer font-black shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
          <Upload size={20} /> IMPORT EXCEL (.XLSX)
          <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </label>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-[13px] text-left border-collapse min-w-[1800px]">
            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">ACTIONS</th>
                {excelHeaders.map(h => (
                  <th key={h} className="p-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => (
                <tr key={row.id} className="cursor-pointer hover:bg-slate-50 transition-all group border-l-4 border-transparent hover:border-blue-500" onClick={() => onRowSelect(row)}>
                  <td className="p-5 text-center"><MoreHorizontal size={14} className="text-slate-300" /></td>
                  <td className="p-5 font-bold text-slate-500">{row['RESP.']}</td>
                  <td className="p-5 font-black text-slate-900">{row.CUSTOMER}</td>
                  <td className="p-5 font-bold text-slate-400">{row.SUPPLIER}</td>
                  <td className="p-5 truncate max-w-[300px] italic font-medium text-slate-600">{row.DESCRIPTION}</td>
                  <td className="p-5 font-mono font-black text-slate-900 text-sm">{row.AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="p-5 text-center font-black text-slate-300">{row.UF}</td>
                  <td className="p-5 text-center"><span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black">{row.Confidence}%</span></td>
                  {['JAN', 'FEV', 'MAR', '2026'].map(m => (
                    <td key={m} className="p-5 text-center">
                      {row[m as keyof ForecastRow] === 'x' && <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-white shadow-lg"><Check size={12} strokeWidth={4}/></div>}
                    </td>
                  ))}
                  <td className="p-5 truncate max-w-[200px] text-slate-400">{row['FOLLOW-UP']}</td>
                  <td className="p-5 truncate max-w-[150px] text-slate-400">{row.CONTATOS}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {importPreview && (
        <div className="fixed inset-0 bg-slate-900/95 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
             <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-4">
                 <div className="p-4 bg-green-100 text-green-600 rounded-3xl"><CheckCircle2 size={32}/></div>
                 <div>
                   <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">VALIDATE IMPORT</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Schema verification & integrity check</p>
                 </div>
               </div>
               <button onClick={() => setImportPreview(null)} className="p-4 hover:bg-white rounded-2xl shadow-sm text-slate-400 transition-all"><CloseIcon size={24}/></button>
             </div>

             <div className="flex-1 flex flex-col min-h-0">
                <div className="bg-slate-900 p-6 font-mono text-[10px] text-slate-400 space-y-1 overflow-auto max-h-40 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-blue-400 font-black mb-2 uppercase tracking-widest"><Terminal size={14}/> Import Logic Trace</div>
                  {debugLogs.map((log, i) => (
                    <div key={i} className={`flex gap-3 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'debug' ? 'text-blue-300 opacity-80' : ''}`}>
                      <span className="opacity-40">[{log.timestamp}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 overflow-auto p-10 custom-scrollbar">
                   {importErrors.length > 0 ? (
                     <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
                        <XCircle size={64} className="text-red-500" />
                        <h4 className="text-2xl font-black text-slate-900 uppercase">Schema Mismatch</h4>
                        {importErrors.map((err, i) => <p key={i} className="text-red-600 font-bold bg-red-50 px-6 py-3 rounded-2xl border border-red-100">{err}</p>)}
                     </div>
                   ) : (
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-widest text-[9px]">
                        <tr>
                          <th className="p-4">CUSTOMER</th>
                          <th className="p-4">DESCRIPTION</th>
                          <th className="p-4 text-right">AMOUNT</th>
                          <th className="p-4">FOLLOW-UP</th>
                          <th className="p-4">CONTATOS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.slice(0, 10).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-4 font-black uppercase text-blue-600">{row.CUSTOMER}</td>
                            <td className="p-4 italic text-slate-600 truncate max-w-[250px]">{row.DESCRIPTION || "---"}</td>
                            <td className="p-4 text-right font-mono font-black">{row.AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="p-4 italic text-slate-400 truncate max-w-[200px]">{row['FOLLOW-UP'] || "---"}</td>
                            <td className="p-4 font-bold truncate max-w-[150px]">{row.CONTATOS || "---"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                   )}
                </div>
             </div>

             <div className="p-10 border-t bg-slate-50/50 flex justify-end gap-6">
               <button onClick={() => setImportPreview(null)} className="px-10 py-4 font-black text-slate-400 uppercase tracking-widest">Discard</button>
               <button 
                  disabled={importErrors.length > 0}
                  onClick={() => { setData(importPreview); setImportPreview(null); }} 
                  className={`px-14 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 uppercase text-xs tracking-widest ${importErrors.length > 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
               >
                 COMMIT DATA TO DATABASE
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastTab;
