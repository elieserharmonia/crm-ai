
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
  DollarSign,
  AlertCircle,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react';
import { ForecastRow, User } from '../types';

interface ForecastTabProps {
  data: ForecastRow[];
  setData: (data: ForecastRow[]) => void;
  onRowSelect: (row: ForecastRow) => void;
  user: User;
}

const ForecastTab: React.FC<ForecastTabProps> = ({ data, setData, onRowSelect, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [importPreview, setImportPreview] = useState<ForecastRow[] | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets["01.2026"];
      if (!ws) { 
        alert('Planilha "01.2026" não encontrada no arquivo Excel.'); 
        return; 
      }
      
      const jsonData = XLSX.utils.sheet_to_json(ws);
      
      // Função auxiliar para buscar valor em chaves alternativas (Português/Inglês/Abreviações)
      const findVal = (row: any, keys: string[]) => {
        const foundKey = Object.keys(row).find(k => 
          keys.some(searchKey => k.toUpperCase().trim() === searchKey.toUpperCase().trim())
        );
        return foundKey ? row[foundKey] : '';
      };

      const mappedData: ForecastRow[] = jsonData.map((row: any, idx: number) => {
        let confidence = findVal(row, ['Confidence', 'CONF.', 'CONF', 'CONF%']);
        if (typeof confidence === 'number' && confidence <= 1) {
          confidence = confidence * 100;
        }

        // Limpeza robusta de valor monetário
        const rawAmount = findVal(row, ['AMOUNT', 'VALOR', 'PREÇO', 'PRICE']);
        const cleanAmount = typeof rawAmount === 'number' ? rawAmount : 
          parseFloat(String(rawAmount || '0').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

        return {
          id: `row-${idx}-${Date.now()}`,
          'Unnamed: 0': row['Unnamed: 0'] || '',
          'RESP.': String(findVal(row, ['RESP.', 'RESPONSÁVEL', 'VENDEDOR']) || '').trim(),
          'CUSTOMER': String(findVal(row, ['CUSTOMER', 'CLIENTE', 'EMPRESA']) || '').trim().toUpperCase(),
          'SUPPLIER': String(findVal(row, ['SUPPLIER', 'FORNECEDOR']) || '').trim(),
          'DESCRIPTION': String(findVal(row, ['DESCRIPTION', 'DESCRIÇÃO', 'PROJETO']) || '').trim(),
          'AMOUNT': cleanAmount,
          'UF': String(findVal(row, ['UF', 'ESTADO']) || '').toUpperCase().trim().slice(0, 2),
          'Confidence': Math.round(Number(confidence)) || 0,
          'JAN': String(findVal(row, ['JAN']) || '').toLowerCase() === 'x' ? 'x' : '',
          'FEV': String(findVal(row, ['FEV']) || '').toLowerCase() === 'x' ? 'x' : '',
          'MAR': String(findVal(row, ['MAR']) || '').toLowerCase() === 'x' ? 'x' : '',
          '2026': String(findVal(row, ['2026']) || '').toLowerCase() === 'x' ? 'x' : '',
          'FOLLOW-UP': String(findVal(row, ['FOLLOW-UP', 'ACOMPANHAMENTO', 'FOLLOWUP']) || '').trim(),
          'CONTATOS': String(findVal(row, ['CONTATOS', 'CONTATO', 'TELEFONE']) || '').trim(),
          oweInfoToClient: false,
        };
      });
      setImportPreview(mappedData);
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
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
        <div className="flex gap-4 items-center flex-1 w-full max-w-xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Busque clientes ou projetos..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200">
            <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500'}`}><TableIcon size={16}/></button>
            <button onClick={() => setViewMode('kanban')} className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500'}`}><Columns size={16}/></button>
          </div>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 cursor-pointer font-black shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
            <Upload size={20} /> Importar Excel
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col min-h-0 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-[13px] text-left border-collapse min-w-[1400px]">
            <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md border-b border-slate-200">
              <tr>
                {['Ações', 'Resp.', 'Cliente', 'Fornecedor', 'Descrição', 'Valor', 'UF', 'Conf. %', 'Jan', 'Fev', 'Mar', '2026'].map(h => (
                  <th key={h} className="p-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => (
                <tr 
                  key={row.id} 
                  className={`cursor-pointer hover:bg-slate-50 transition-all group border-l-4 border-transparent hover:border-blue-500 ${row.oweInfoToClient ? 'bg-amber-50/50' : ''}`} 
                  onClick={() => onRowSelect(row)}
                >
                  <td className="p-5">
                    <button className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all"><MoreHorizontal size={14}/></button>
                  </td>
                  <td className="p-5 font-bold text-slate-500">{row['RESP.']}</td>
                  <td className="p-5 font-black text-slate-900 uppercase tracking-tight">{row.CUSTOMER}</td>
                  <td className="p-5 font-bold text-slate-400">{row.SUPPLIER}</td>
                  <td className="p-5 truncate max-w-[250px] italic font-medium text-slate-600">{row.DESCRIPTION}</td>
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
            </tbody>
          </table>
        </div>
      </div>

      {importPreview && (
        <div className="fixed inset-0 bg-slate-900/90 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden border-4 border-white/10">
             <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
               <div>
                 <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Validar Importação</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Identificamos {importPreview.length} linhas na aba 01.2026</p>
               </div>
               <button onClick={() => setImportPreview(null)} className="p-4 hover:bg-white rounded-2xl shadow-sm text-slate-400 transition-all"><CloseIcon size={24}/></button>
             </div>
             <div className="flex-1 overflow-auto p-10 custom-scrollbar">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-widest text-[9px]">
                    <tr>
                      <th className="p-4">Responsável</th>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Descrição</th>
                      <th className="p-4 text-right">Valor</th>
                      <th className="p-4 text-center">Confiança</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importPreview.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-400">{row['RESP.']}</td>
                        <td className="p-4 font-black uppercase">{row.CUSTOMER}</td>
                        <td className="p-4 italic text-slate-500">{row.DESCRIPTION || '(Vazio)'}</td>
                        <td className="p-4 text-right font-mono font-black">{row.AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-1 bg-slate-900 text-white rounded font-black">{row.Confidence}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
             <div className="p-10 border-t bg-slate-50/50 flex justify-end gap-6">
               <button onClick={() => setImportPreview(null)} className="px-10 py-4 font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
               <button onClick={() => { setData(importPreview); setImportPreview(null); }} className="px-14 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95 uppercase text-xs tracking-widest">Salvar Forecast</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastTab;
