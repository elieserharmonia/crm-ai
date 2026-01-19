
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
import { ForecastRow, Contact, User } from '../types';

interface ForecastTabProps {
  data: ForecastRow[];
  setData: (data: ForecastRow[]) => void;
  onRowSelect: (row: ForecastRow) => void;
  user: User;
  contacts: Contact[];
}

const ForecastTab: React.FC<ForecastTabProps> = ({ data, setData, onRowSelect, user, contacts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [importPreview, setImportPreview] = useState<ForecastRow[] | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRow, setNewRow] = useState<Partial<ForecastRow>>({
    'RESP.': user.role === 'vendedor' ? user.name : '',
    'CUSTOMER': '',
    'SUPPLIER': '',
    'DESCRIPTION': '',
    'AMOUNT': 0,
    'UF': '',
    'Confidence': 10,
    'JAN': '',
    'FEV': '',
    'MAR': '',
    '2026': '',
    'FOLLOW-UP': '',
    'CONTATOS': '',
    oweInfoToClient: false
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets["01.2026"];
      if (!ws) { 
        alert('Aba "01.2026" não encontrada no arquivo Excel!'); 
        return; 
      }
      const jsonData = XLSX.utils.sheet_to_json(ws);
      const mappedData: ForecastRow[] = jsonData.map((row: any, idx: number) => {
        let confidence = Number(row['Confidence']) || 0;
        // Se vier como decimal (ex: 0.1), converte para porcentagem inteira (ex: 10)
        if (confidence > 0 && confidence <= 1) confidence = confidence * 100;

        return {
          id: `row-${idx}-${Date.now()}`,
          'Unnamed: 0': row['Unnamed: 0'] || '',
          'RESP.': String(row['RESP.'] || '').trim(),
          'CUSTOMER': String(row['CUSTOMER'] || '').trim(),
          'SUPPLIER': String(row['SUPPLIER'] || '').trim(),
          'DESCRIPTION': String(row['DESCRIPTION'] || '').trim(),
          'AMOUNT': Number(row['AMOUNT']) || 0,
          'UF': String(row['UF'] || '').toUpperCase().trim().slice(0, 2),
          'Confidence': Math.round(confidence),
          'JAN': String(row['JAN'] || '').toLowerCase() === 'x' ? 'x' : '',
          'FEV': String(row['FEV'] || '').toLowerCase() === 'x' ? 'x' : '',
          'MAR': String(row['MAR'] || '').toLowerCase() === 'x' ? 'x' : '',
          '2026': String(row['2026'] || '').toLowerCase() === 'x' ? 'x' : '',
          'FOLLOW-UP': String(row['FOLLOW-UP'] || '').trim(),
          'CONTATOS': String(row['CONTATOS'] || '').trim(),
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

  const getRowClass = (row: ForecastRow) => {
    if (row.Confidence === 0) return 'bg-[#D9D9D9] text-slate-700 opacity-60';
    if (row.Confidence >= 50 && (row.DESCRIPTION?.toLowerCase().includes('contrato') || row.Confidence === 100)) return 'bg-[#FF0000] text-white hover:bg-red-600';
    if (row.oweInfoToClient) return 'row-owe-info text-slate-800';
    return 'bg-white hover:bg-slate-50';
  };

  const kanbanColumns = [10, 30, 50, 80, 90, 100, 0];

  const handleQuickWhatsApp = (row: ForecastRow, e: React.MouseEvent) => {
    e.stopPropagation();
    const phoneMatch = row.CONTATOS.match(/\d{10,13}/);
    const phone = phoneMatch ? phoneMatch[0] : '';
    const message = encodeURIComponent(`Olá, sou do CRM-IA. Gostaria de falar sobre o projeto de ${row.DESCRIPTION}.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shrink-0">
        <div className="flex gap-4 items-center flex-1 w-full max-w-xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Busque por cliente, fornecedor ou UF..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200 backdrop-blur-sm">
            <button 
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-black transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <TableIcon size={16} /> Tabela
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-black transition-all ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Columns size={16} /> Kanban
            </button>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setIsAddingNew(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-black shadow-lg shadow-blue-900/10 active:scale-95 transition-all"><Plus size={20} /> Nova Lead</button>
          
          <label className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 cursor-pointer font-bold shadow-sm active:scale-95 transition-all">
            <Upload size={20} /> Importar Excel
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'table' ? (
        <div className="flex-1 bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden flex flex-col min-h-0 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex-1 overflow-auto custom-scrollbar relative">
            <table className="w-full text-[13px] text-left border-collapse min-w-[1700px]">
              <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md shadow-sm">
                <tr>
                  <th className="p-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Ações</th>
                  {['RESP.', 'CLIENTE', 'FORNECEDOR', 'DESCRIÇÃO', 'VALOR', 'UF', 'CONF. %', 'JAN', 'FEV', 'MAR', '2026', 'FOLLOW-UP', 'CONTATOS'].map(h => (
                    <th key={h} className={`p-5 font-black text-slate-500 uppercase tracking-widest text-[10px] whitespace-nowrap ${h === 'VALOR' ? 'text-right' : h.includes('UF') || h.includes('CONF') || h.length <= 4 ? 'text-center' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row) => (
                  <tr key={row.id} className={`transition-all cursor-pointer group border-l-4 border-transparent hover:z-10 relative ${getRowClass(row)}`} onClick={() => onRowSelect(row)}>
                    <td className="p-5">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={(e) => handleQuickWhatsApp(row, e)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-600 hover:text-white transition-all">
                           <MessageCircle size={14} />
                         </button>
                         <button className="p-2 bg-slate-100 text-slate-400 rounded-lg">
                           <MoreHorizontal size={14} />
                         </button>
                      </div>
                    </td>
                    <td className="p-5 font-bold">{row['RESP.']}</td>
                    <td className="p-5 font-black uppercase tracking-tight text-sm">{row.CUSTOMER}</td>
                    <td className="p-5 font-bold opacity-70">{row.SUPPLIER}</td>
                    <td className="p-5 truncate max-w-[300px] italic">{row.DESCRIPTION}</td>
                    <td className="p-5 font-mono font-black text-right text-sm">{row.AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-5 font-black text-center opacity-40">{row.UF}</td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1.5 rounded-full text-[11px] font-black border-2 ${row.Confidence === 100 ? 'bg-green-500 border-green-400 text-white' : 'bg-white/20 border-white/30'}`}>{row.Confidence}%</span>
                    </td>
                    <td className="p-5 text-center">{row.JAN === 'x' && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mx-auto text-white"><Check size={12} strokeWidth={4} /></div>}</td>
                    <td className="p-5 text-center">{row.FEV === 'x' && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mx-auto text-white"><Check size={12} strokeWidth={4} /></div>}</td>
                    <td className="p-5 text-center">{row.MAR === 'x' && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mx-auto text-white"><Check size={12} strokeWidth={4} /></div>}</td>
                    <td className="p-5 text-center">{row['2026'] === 'x' && <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center mx-auto text-white"><Check size={14} strokeWidth={4} /></div>}</td>
                    <td className="p-5 text-xs italic opacity-60 truncate max-w-[200px] font-medium">{row['FOLLOW-UP']}</td>
                    <td className="p-5 text-xs truncate max-w-[150px] font-bold opacity-50">{row.CONTATOS}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="flex-1 overflow-x-auto pb-6 flex gap-6 min-h-0 animate-in slide-in-from-right-8 duration-700">
          {kanbanColumns.map(conf => {
            const columnData = filteredData.filter(r => r.Confidence === conf);
            const columnTotal = columnData.reduce((acc, r) => acc + r.AMOUNT, 0);
            return (
              <div key={conf} className="flex-none w-80 flex flex-col bg-slate-200/30 rounded-[2.5rem] border border-slate-200/50 p-2">
                <div className="p-6 flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full shadow-sm ${conf === 100 ? 'bg-green-500' : conf === 0 ? 'bg-slate-400' : 'bg-blue-600'}`} />
                      {conf}% 
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-tighter">{columnData.length} leads</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Budget</p>
                    <p className="text-sm font-black text-blue-700">
                      R${(columnTotal / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
                  {columnData.map(row => (
                    <div 
                      key={row.id} 
                      onClick={() => onRowSelect(row)}
                      className={`p-5 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-2xl hover:-translate-y-1 hover:border-blue-400 transition-all group relative overflow-hidden ${getRowClass(row)}`}
                    >
                      {row.oweInfoToClient && <div className="absolute top-0 right-0 p-2"><AlertCircle size={16} className="text-yellow-600" /></div>}
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">{row.SUPPLIER}</span>
                          <span className="px-2 py-0.5 bg-black/5 rounded font-black text-[9px] uppercase tracking-tighter">{row.UF}</span>
                        </div>
                        <h4 className="font-black text-[15px] uppercase leading-tight line-clamp-2 tracking-tight">{row.CUSTOMER}</h4>
                        <div className="pt-3 flex justify-between items-end border-t border-black/5">
                           <div className="flex items-center gap-1 font-mono font-black text-xs">
                             <DollarSign size={14} className="text-blue-500" />
                             {row.AMOUNT.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                           </div>
                           <div onClick={(e) => handleQuickWhatsApp(row, e)} className="p-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-600 hover:text-white transition-all">
                             <MessageCircle size={14} />
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {importPreview && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden border-4 border-white/20">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Análise de Importação</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Planilha: 01.2026 • {importPreview.length} Linhas Identificadas</p>
              </div>
              <button onClick={() => setImportPreview(null)} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm"><CloseIcon size={24} /></button>
            </div>
            <div className="flex-1 overflow-auto p-10">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm font-black text-slate-400 uppercase tracking-widest text-[10px]">
                  <tr>
                    <th className="p-4 border-b">Cliente</th>
                    <th className="p-4 border-b text-right">Valor Projetado</th>
                    <th className="p-4 border-b text-center">Confidence</th>
                    <th className="p-4 border-b">Descrição da Oportunidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importPreview.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-black uppercase text-xs">{row.CUSTOMER}</td>
                      <td className="p-4 text-right font-mono font-black text-blue-600 text-sm">{row.AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="p-4 text-center"><span className="px-3 py-1 rounded-full bg-slate-900 text-white font-black text-[10px]">{row.Confidence}%</span></td>
                      <td className="p-4 opacity-70 italic text-xs">{row.DESCRIPTION}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-10 border-t flex justify-end gap-4 bg-slate-50/50">
              <button onClick={() => setImportPreview(null)} className="px-10 py-4 border-2 border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-white transition-all uppercase tracking-widest text-xs">Descartar</button>
              <button onClick={() => { setData(importPreview); setImportPreview(null); }} className="px-14 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all uppercase tracking-widest text-xs active:scale-95">Salvar Forecast</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-slate-900/90 z-[110] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 space-y-8 relative border-4 border-white/20">
             <div className="space-y-2">
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">Nova Oportunidade</h3>
             </div>
             
             <div className="space-y-4">
               <div className="space-y-1">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Cliente</label>
                 <input placeholder="EX: CATERPILLAR" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold uppercase" onChange={e => setNewRow({...newRow, CUSTOMER: e.target.value.toUpperCase()})} />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Valor Estimado (R$)</label>
                 <input placeholder="0.00" type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold" onChange={e => setNewRow({...newRow, AMOUNT: Number(e.target.value)})} />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Descrição</label>
                 <input placeholder="EX: Dispositivo de montagem" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" onChange={e => setNewRow({...newRow, DESCRIPTION: e.target.value})} />
               </div>
             </div>

             <div className="flex gap-4 pt-4">
               <button onClick={() => setIsAddingNew(false)} className="flex-1 p-4 font-black text-slate-400 uppercase tracking-widest text-xs hover:text-slate-600 transition-colors">Cancelar</button>
               <button onClick={() => { setData([{...newRow, id: String(Date.now())} as ForecastRow, ...data]); setIsAddingNew(false); }} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Salvar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastTab;
