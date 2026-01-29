
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Upload, 
  Check,
  X as CloseIcon,
  MoreHorizontal,
  Terminal,
  CheckCircle2,
  Database,
  XCircle,
  Eye,
  AlertCircle,
  Plus,
  Save,
  Link as LinkIcon
} from 'lucide-react';
import { ForecastRow, User } from '../types';
import { storageService } from '../services/storageService';

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
  const [importPreview, setImportPreview] = useState<ForecastRow[] | null>(null);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  
  const [manualRow, setManualRow] = useState<Partial<ForecastRow> & { diaryLink?: string }>({
    CUSTOMER: '',
    SUPPLIER: '',
    DESCRIPTION: '',
    AMOUNT: 0,
    UF: 'SP',
    Confidence: 10,
    'RESP.': user.name.toUpperCase(),
    diaryLink: ''
  });

  const expandMergedCells = (ws: XLSX.WorkSheet) => {
    if (!ws['!merges']) return;
    ws['!merges'].forEach((merge) => {
      const startCellRef = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
      const cellValue = ws[startCellRef];
      if (!cellValue) return;
      for (let r = merge.s.r; r <= merge.e.r; r++) {
        for (let c = merge.s.c; c <= merge.e.c; c++) {
          if (r === merge.s.r && c === merge.s.c) continue;
          const targetRef = XLSX.utils.encode_cell({ r, c });
          ws[targetRef] = { ...cellValue };
        }
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportErrors([]);
    setDebugLogs([]);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets["01.2026"];
        if (!ws) { 
          const msg = `Planilha "01.2026" não encontrada.`;
          setImportErrors([msg]);
          return; 
        }
        expandMergedCells(ws);
        const matrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const criticalMarkers = ["DESCRIPTION", "AMOUNT", "CUSTOMER", "RESP."];
        let headerRowIndex = -1;
        let detectedHeaders: string[] = [];
        for (let r = 0; r < Math.min(30, matrix.length); r++) {
          const row = matrix[r].map(c => String(c || "").trim());
          if (criticalMarkers.filter(marker => row.includes(marker)).length >= 3) {
            headerRowIndex = r;
            detectedHeaders = row;
            break;
          }
        }
        if (headerRowIndex === -1) {
          setImportErrors(["Cabeçalhos não localizados."]);
          return;
        }
        const getIdx = (name: string) => detectedHeaders.indexOf(name);
        const colMap = {
          resp: getIdx("RESP."), customer: getIdx("CUSTOMER"), supplier: getIdx("SUPPLIER"),
          description: getIdx("DESCRIPTION"), amount: getIdx("AMOUNT"), uf: getIdx("UF"),
          confidence: getIdx("Confidence"), jan: getIdx("JAN"), fev: getIdx("FEV"),
          mar: getIdx("MAR"), y2026: getIdx("2026"), followUp: getIdx("FOLLOW-UP"),
          contatos: getIdx("CONTATOS")
        };
        const importedRows: ForecastRow[] = matrix.slice(headerRowIndex + 1)
          .filter(row => row.some(cell => String(cell).trim() !== ""))
          .map((row, idx) => ({
            id: `row-${idx}-${Date.now()}`,
            'Unnamed: 0': idx + 1,
            'RESP.': String(row[colMap.resp] || "").trim(),
            'CUSTOMER': String(row[colMap.customer] || "").trim(),
            'SUPPLIER': String(row[colMap.supplier] || "").trim(),
            'DESCRIPTION': String(row[colMap.description] || ""),
            'AMOUNT': parseFloat(String(row[colMap.amount] || '0').replace(/[^\d.-]/g, '')) || 0,
            'UF': String(row[colMap.uf] || "").trim(),
            'Confidence': Math.round(parseFloat(String(row[colMap.confidence] || '0')) || 0),
            'JAN': String(row[colMap.jan] || "").toLowerCase() === 'x' ? 'x' : '',
            'FEV': String(row[colMap.fev] || "").toLowerCase() === 'x' ? 'x' : '',
            'MAR': String(row[colMap.mar] || "").toLowerCase() === 'x' ? 'x' : '',
            '2026': String(row[colMap.y2026] || "").toLowerCase() === 'x' ? 'x' : '',
            'FOLLOW-UP': String(row[colMap.followUp] || ""),
            'CONTATOS': String(row[colMap.contatos] || ""),
            oweInfoToClient: false,
          }));
        setImportPreview(importedRows);
      } catch (err: any) {
        setImportErrors([err.message]);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const saveManualRow = () => {
    if (!manualRow.CUSTOMER || !manualRow.DESCRIPTION || !manualRow.AMOUNT) {
      alert("Por favor, preencha os campos obrigatórios: Cliente, Descrição e Valor.");
      return;
    }
    
    // Salvar link do diário se fornecido
    if (manualRow.diaryLink) {
      storageService.saveDiaryLink(manualRow.CUSTOMER, manualRow.diaryLink);
    }

    const newEntry: ForecastRow = {
      id: `manual-${Date.now()}`,
      'Unnamed: 0': data.length + 1,
      'RESP.': manualRow['RESP.'] || user.name.toUpperCase(),
      CUSTOMER: manualRow.CUSTOMER || '',
      SUPPLIER: manualRow.SUPPLIER || '',
      DESCRIPTION: manualRow.DESCRIPTION || '',
      AMOUNT: manualRow.AMOUNT || 0,
      UF: manualRow.UF || 'SP',
      Confidence: manualRow.Confidence || 10,
      JAN: '', FEV: '', MAR: '', '2026': '',
      'FOLLOW-UP': '',
      'CONTATOS': '',
      oweInfoToClient: false
    };
    setData([newEntry, ...data]);
    setIsAddingManual(false);
    setManualRow({
      CUSTOMER: '', SUPPLIER: '', DESCRIPTION: '', AMOUNT: 0, UF: 'SP', Confidence: 10, 'RESP.': user.name.toUpperCase(), diaryLink: ''
    });
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
              placeholder="Pesquisar em todas as colunas..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddingManual(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 cursor-pointer font-black shadow-lg shadow-slate-900/10 active:scale-95 transition-all uppercase text-[11px] tracking-widest"
          >
            <Plus size={18} /> Nova Oportunidade
          </button>

          <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 cursor-pointer font-black shadow-lg shadow-blue-900/20 active:scale-95 transition-all uppercase text-[11px] tracking-widest">
            <Upload size={18} /> Importar Dados
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-[13px] text-left border-collapse min-w-[1800px]">
            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Ações</th>
                {excelHeaders.map(h => (
                  <th key={h} className="p-5 font-black text-slate-900 uppercase tracking-widest text-[11px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => (
                <tr key={row.id} className="cursor-pointer hover:bg-slate-50 transition-all group border-l-4 border-transparent hover:border-blue-500" onClick={() => onRowSelect(row)}>
                  <td className="p-5 text-center">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:text-blue-600 transition-all shadow-sm"><Eye size={14}/></div>
                  </td>
                  <td className="p-5 font-bold text-slate-500 whitespace-nowrap">{row['RESP.']}</td>
                  <td className="p-5 font-black text-slate-900 uppercase whitespace-nowrap">{row.CUSTOMER}</td>
                  <td className="p-5 font-bold text-slate-400 whitespace-nowrap">{row.SUPPLIER}</td>
                  <td className="p-5 truncate max-w-[350px] italic font-medium text-slate-600">{row.DESCRIPTION}</td>
                  <td className="p-5 font-mono font-black text-slate-900 text-sm whitespace-nowrap">
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
                  <td className="p-5 truncate max-w-[200px] text-slate-500 font-medium italic">{row['FOLLOW-UP']}</td>
                  <td className="p-5 truncate max-w-[200px] text-slate-400 font-bold">{row.CONTATOS}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={14} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <Database size={56} className="opacity-10" />
                      <p className="font-bold text-lg">Nenhum dado encontrado.</p>
                      <p className="text-sm">Importe um arquivo Excel ou adicione uma nova oportunidade manual.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro Manual */}
      {isAddingManual && (
        <div className="fixed inset-0 bg-slate-900/90 z-[300] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-3xl"><Plus size={32}/></div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Nova Oportunidade</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Cadastro Manual de Negócio</p>
                    </div>
                 </div>
                 <button onClick={() => setIsAddingManual(false)} className="p-4 hover:bg-white rounded-2xl shadow-sm text-slate-400 transition-all"><CloseIcon size={24}/></button>
              </div>

              <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cliente (Obrigatório)</label>
                       <input 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-800"
                          placeholder="Ex: Caterpillar Brasil"
                          value={manualRow.CUSTOMER}
                          onChange={e => setManualRow({...manualRow, CUSTOMER: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fornecedor</label>
                       <input 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-800"
                          placeholder="Ex: Eaton"
                          value={manualRow.SUPPLIER}
                          onChange={e => setManualRow({...manualRow, SUPPLIER: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Descrição do Negócio (Obrigatório)</label>
                    <textarea 
                       className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-24 outline-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                       placeholder="Descreva os itens ou escopo da proposta..."
                       value={manualRow.DESCRIPTION}
                       onChange={e => setManualRow({...manualRow, DESCRIPTION: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Valor (R$)</label>
                       <input 
                          type="number"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black"
                          placeholder="0.00"
                          value={manualRow.AMOUNT}
                          onChange={e => setManualRow({...manualRow, AMOUNT: parseFloat(e.target.value) || 0})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">UF</label>
                       <select 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black"
                          value={manualRow.UF}
                          onChange={e => setManualRow({...manualRow, UF: e.target.value})}
                       >
                          {['SP', 'MG', 'PR', 'RS', 'SC', 'RJ', 'GO', 'AM', 'MT', 'MS', 'PE', 'CE', 'BA'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confiança (%)</label>
                       <select 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black"
                          value={manualRow.Confidence}
                          onChange={e => setManualRow({...manualRow, Confidence: parseInt(e.target.value)})}
                       >
                          {[0, 10, 30, 50, 80, 90, 100].map(c => <option key={c} value={c}>{c}%</option>)}
                       </select>
                    </div>
                 </div>

                 {/* Novo Campo: Link do Diário */}
                 <div className="space-y-2 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1 flex items-center gap-2">
                      <LinkIcon size={12} /> Link do Diário (OneDrive Web)
                    </label>
                    <input 
                        className="w-full p-4 bg-white border border-blue-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-xs font-mono"
                        placeholder="Cole o link do OneDrive aqui para acesso rápido no Word..."
                        value={manualRow.diaryLink}
                        onChange={e => setManualRow({...manualRow, diaryLink: e.target.value})}
                    />
                    <p className="text-[9px] text-blue-400 font-bold uppercase tracking-tight pl-1 italic">
                      Dica: Use o link de compartilhamento com permissão de edição.
                    </p>
                 </div>
              </div>

              <div className="p-10 border-t bg-slate-50/50 flex justify-end gap-6">
                 <button onClick={() => setIsAddingManual(false)} className="px-10 py-4 font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all text-xs">Cancelar</button>
                 <button 
                    onClick={saveManualRow}
                    className="flex items-center gap-3 px-14 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95 uppercase text-xs tracking-widest"
                 >
                    <Save size={18} /> Salvar Oportunidade
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Importação */}
      {importPreview && (
        <div className="fixed inset-0 bg-slate-900/95 z-[400] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
             <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-4">
                 <div className="p-4 bg-green-100 text-green-600 rounded-3xl"><CheckCircle2 size={32}/></div>
                 <div>
                   <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Validar Importação</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Verificação de Integridade</p>
                 </div>
               </div>
               <button onClick={() => setImportPreview(null)} className="p-4 hover:bg-white rounded-2xl shadow-sm text-slate-400 transition-all"><CloseIcon size={24}/></button>
             </div>

             <div className="flex-1 overflow-auto p-10 custom-scrollbar">
                {importErrors.length > 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
                     <XCircle size={64} className="text-red-500" />
                     <h4 className="text-2xl font-black text-slate-900 uppercase">Falha na Validação</h4>
                     {importErrors.map((err, i) => (
                       <div key={i} className="flex items-center gap-3 text-red-600 font-bold bg-red-50 px-6 py-4 rounded-2xl border border-red-100 shadow-sm max-w-2xl">
                          <AlertCircle size={20} /> {err}
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">Amostra dos primeiros 5 registros</div>
                    <table className="w-full text-[11px] text-left border rounded-xl overflow-hidden shadow-sm">
                      <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-widest text-[10px]">
                        <tr>
                          <th className="p-4 border-r">CLIENTE</th>
                          <th className="p-4 border-r">DESCRIÇÃO</th>
                          <th className="p-4 border-r text-right">VALOR</th>
                          <th className="p-4">CONF.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.slice(0, 5).map((row, i) => (
                          <tr key={i}>
                            <td className="p-4 font-black uppercase text-blue-600 border-r">{row.CUSTOMER || "MISSING"}</td>
                            <td className="p-4 italic text-slate-600 truncate max-w-[250px] border-r">{row.DESCRIPTION || "MISSING"}</td>
                            <td className="p-4 text-right font-mono font-black border-r">{row.AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="p-4 font-bold">{row.Confidence}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
             </div>

             <div className="p-10 border-t bg-slate-50/50 flex justify-end gap-6">
               <button onClick={() => setImportPreview(null)} className="px-10 py-4 font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all text-xs">Cancelar</button>
               <button 
                  disabled={importErrors.length > 0}
                  onClick={() => { setData(importPreview); setImportPreview(null); }} 
                  className={`px-14 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 uppercase text-xs tracking-widest ${importErrors.length > 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
               >
                 Confirmar Importação
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastTab;
