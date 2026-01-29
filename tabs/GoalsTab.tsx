
import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Target, 
  Plus, 
  Trash2, 
  TrendingUp, 
  X, 
  Building, 
  Briefcase, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  BarChart3, 
  Pencil, 
  AlertCircle, 
  Upload, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from 'recharts';
import { ForecastRow, Goal, PurchaseOrder, SalesPersonProfile } from '../types';
import { storageService } from '../services/storageService';

interface GoalsTabProps {
  data: ForecastRow[];
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  onGoalClick: (target: string) => void;
  profile: SalesPersonProfile;
}

const GoalsTab: React.FC<GoalsTabProps> = ({ data, goals, setGoals, onGoalClick, profile }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [supplierGoals, setSupplierGoals] = useState<Array<{ supplier: string; v2025: number; v2026: number }>>([]);
  
  // Stats do Realizado (POs)
  const pos = storageService.getPOs() || [];

  // Iniciais para o Budget ID
  const userInitials = useMemo(() => {
    if (!profile.name) return '??';
    return profile.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }, [profile.name]);

  const budgetId = `BUDGET 2026_${userInitials}`;

  // Agrupamento de Metas por Cliente
  const groupedGoals = useMemo(() => {
    const map = new Map<string, Goal[]>();
    (goals || []).forEach(goal => {
      const customer = goal.customer || 'Global';
      if (!map.has(customer)) map.set(customer, []);
      map.get(customer)!.push(goal);
    });
    return Array.from(map.entries()).sort((a, b) => {
      const totalA = a[1].reduce((sum, g) => sum + (g.value || 0), 0);
      const totalB = b[1].reduce((sum, g) => sum + (g.value || 0), 0);
      return totalB - totalA; // Ordena por maior budget
    });
  }, [goals]);

  // Totais do Dashboard
  const stats = useMemo(() => {
    const totalMeta = (goals || []).reduce((acc, g) => acc + (g.value || 0), 0);
    const totalMeta2025 = (goals || []).reduce((acc, g) => acc + (g.value2025 || 0), 0);
    const totalRealized = pos.reduce((acc, p) => acc + (p.amount || 0), 0);
    const atingimento = totalMeta > 0 ? (totalRealized / totalMeta) * 100 : 0;
    const crescimento = totalMeta2025 > 0 ? ((totalMeta - totalMeta2025) / totalMeta2025) * 100 : 0;

    return { totalMeta, totalRealized, atingimento, totalMeta2025, crescimento };
  }, [goals, pos]);

  // Dados para o Gráfico YoY (Top 5 Clientes)
  const chartData = useMemo(() => {
    return groupedGoals.slice(0, 5).map(([name, items]) => ({
      name: name.substring(0, 15),
      '2025': items.reduce((acc, g) => acc + (g.value2025 || 0), 0),
      '2026': items.reduce((acc, g) => acc + (g.value || 0), 0)
    }));
  }, [groupedGoals]);

  const toggleExpand = (customer: string) => {
    const next = new Set(expandedCustomers);
    if (next.has(customer)) next.delete(customer);
    else next.add(customer);
    setExpandedCustomers(next);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);
        
        const newGoals: Goal[] = rows.map((row, idx) => ({
          id: `import-${Date.now()}-${idx}`,
          customer: row.CLIENTE || row.Customer || 'Desconhecido',
          supplier: row.FORNECEDOR || row.Supplier || 'N/A',
          value2025: parseFloat(row['META 2025'] || row.Value2025 || 0),
          value: parseFloat(row['META 2026'] || row.Value2026 || 0)
        })).filter(g => g.value > 0);

        if (confirm(`Encontradas ${newGoals.length} metas. Deseja substituir o planejamento atual?`)) {
          setGoals(newGoals);
        }
      } catch (err) {
        alert("Erro ao processar planilha. Use colunas: CLIENTE, FORNECEDOR, META 2025, META 2026.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const saveManualGoal = () => {
    if (!selectedCustomer || supplierGoals.length === 0) return;
    
    const otherGoals = (goals || []).filter(g => g.customer !== selectedCustomer);
    const newItems: Goal[] = supplierGoals.map((sg, i) => ({
      id: `manual-${Date.now()}-${i}`,
      customer: selectedCustomer,
      supplier: sg.supplier,
      value2025: sg.v2025,
      value: sg.v2026
    }));

    setGoals([...otherGoals, ...newItems]);
    setIsAdding(false);
    setSelectedCustomer('');
    setSupplierGoals([]);
  };

  return (
    <div className="space-y-8 pb-20 max-w-[1400px] mx-auto">
      
      {/* 1. Header & ID Estratégico */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-slate-900 text-blue-400 text-[10px] font-black rounded-lg uppercase tracking-widest shadow-xl">
              {budgetId}
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Strategic Budget Planner</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Comparativo de performance e projeção de crescimento</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:border-blue-500 cursor-pointer font-black shadow-sm transition-all uppercase text-[10px] tracking-widest active:scale-95">
            <Upload size={16} /> Importar Planilha
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-xl shadow-blue-900/10 font-black uppercase text-[10px] tracking-widest active:scale-95"
          >
            <Plus size={18} /> Nova Meta Manual
          </button>
        </div>
      </div>

      {/* 2. Resumo Executivo (Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Total 2026</p>
           <div className="flex items-center justify-between">
              <p className="text-2xl font-black font-mono text-slate-900">
                R$ {(stats.totalMeta || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </p>
              <div className={`flex items-center gap-1 text-[10px] font-black ${stats.crescimento >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats.crescimento >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                {Math.abs(stats.crescimento || 0).toFixed(1)}% YoY
              </div>
           </div>
           <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-full" />
           </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl border-4 border-white">
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Realizado (Vendas PO)</p>
           <p className="text-2xl font-black font-mono">
             R$ {(stats.totalRealized || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
           </p>
           <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${Math.min(stats.atingimento || 0, 100)}%` }} />
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Atingimento Geral</p>
              <p className="text-4xl font-black tracking-tighter text-slate-900">{(stats.atingimento || 0).toFixed(1)}%</p>
           </div>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Baseado em {(pos || []).length} pedidos faturados</p>
        </div>

        <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 shadow-sm flex flex-col justify-between">
           <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Growth Forecast (YoY)</p>
              <p className="text-4xl font-black tracking-tighter text-blue-700">
                {stats.crescimento >= 0 ? '+' : ''}{(stats.crescimento || 0).toFixed(1)}%
              </p>
           </div>
           <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest italic">Comparado a R$ {(stats.totalMeta2025 || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* 3. Gráfico YoY e Lista de Metas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Gráfico YoY */}
        <div className="xl:col-span-1 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm h-fit">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 mb-8">
            <BarChart3 size={24} className="text-blue-600" />
            Top Growth YoY
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'black' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Bar dataKey="2025" name="Meta 2025" fill="#e2e8f0" radius={[10, 10, 0, 0]} />
                <Bar dataKey="2026" name="Meta 2026" fill="#3b82f6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lista de Metas Expansível */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-4 mb-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Filter size={14}/> Detalhamento por Cliente / Fornecedor
            </h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Total Planejado: {groupedGoals.length} Empresas</span>
          </div>

          {groupedGoals.map(([customer, items]) => {
            const customerMeta = items.reduce((acc, g) => acc + (g.value || 0), 0);
            const customerReal = pos.filter(p => p.customer.toLowerCase() === customer.toLowerCase()).reduce((sum, p) => sum + (p.amount || 0), 0);
            const isExpanded = expandedCustomers.has(customer);
            const atingimento = customerMeta > 0 ? (customerReal / customerMeta) * 100 : 0;

            return (
              <div key={customer} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden transition-all hover:shadow-lg group">
                <button 
                  onClick={() => toggleExpand(customer)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-5 min-w-0">
                    <div className={`p-4 rounded-2xl transition-all ${atingimento >= 100 ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'} group-hover:scale-110`}>
                      <Building size={24} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate">{customer}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{items.length} Fornecedores</span>
                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${atingimento >= 100 ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'}`}>
                          {atingimento.toFixed(0)}% REALIZADO
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target 2026</p>
                      <p className="text-xl font-mono font-black text-slate-900">
                        R$ {(customerMeta || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown className="text-slate-300" size={24} />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {items.map(goal => {
                        const goalReal = pos.filter(p => 
                          p.customer.toLowerCase() === customer.toLowerCase() && 
                          p.supplier.toLowerCase() === goal.supplier.toLowerCase()
                        ).reduce((acc, curr) => acc + (curr.amount || 0), 0);
                        const goalPct = goal.value > 0 ? (goalReal / goal.value) * 100 : 0;

                        return (
                          <div key={goal.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-blue-300 hover:bg-white transition-all">
                             <div className="flex items-center gap-4">
                                <div className="p-2 bg-white rounded-xl text-slate-400 border border-slate-100"><Briefcase size={16}/></div>
                                <div>
                                   <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{goal.supplier}</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase">YoY: R$ {(goal.value2025 || 0).toLocaleString()} → R$ {(goal.value || 0).toLocaleString()}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[11px] font-mono font-black text-slate-900">R$ {(goalReal || 0).toLocaleString()}</p>
                                <div className="flex items-center gap-1 justify-end mt-0.5">
                                   <span className={`text-[8px] font-black uppercase ${goalPct >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                                      {goalPct.toFixed(0)}% REALIZADO
                                   </span>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end gap-3">
                       <button 
                        onClick={() => {
                          const updated = (goals || []).filter(g => g.customer !== customer);
                          setGoals(updated);
                        }}
                        className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                        title="Remover Meta do Cliente"
                       >
                         <Trash2 size={18} />
                       </button>
                       <button 
                        onClick={() => onGoalClick(customer)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-600 transition-all"
                       >
                         Ver Pipeline <ChevronRight size={14} />
                       </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Manual Simplificado */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/90 z-[300] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-3xl"><Target size={32}/></div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Manual Meta Entry</h3>
                    </div>
                 </div>
                 <button onClick={() => setIsAdding(false)} className="p-4 hover:bg-white rounded-2xl shadow-sm text-slate-400 transition-all"><X size={24}/></button>
              </div>
              
              <div className="p-10 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">Nome da Empresa</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 uppercase focus:ring-2 focus:ring-blue-500"
                    placeholder="CLIENTE S/A"
                    value={selectedCustomer}
                    onChange={e => setSelectedCustomer(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="bg-blue-50 p-6 rounded-[1.5rem] border border-blue-100 space-y-4">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Adicionar Linha de Fornecedor</p>
                   <div className="flex gap-3">
                      <input 
                        id="new-supp"
                        className="flex-1 p-3 bg-white border border-blue-200 rounded-xl outline-none text-xs font-bold uppercase"
                        placeholder="NOME DO FORNECEDOR"
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById('new-supp') as HTMLInputElement;
                          if (input.value) {
                            setSupplierGoals([...supplierGoals, { supplier: input.value.toUpperCase(), v2025: 0, v2026: 0 }]);
                            input.value = '';
                          }
                        }}
                        className="px-6 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase"
                      >
                        Add
                      </button>
                   </div>
                </div>

                <div className="space-y-3">
                  {supplierGoals.map((sg, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                       <span className="flex-1 text-[11px] font-black text-slate-900">{sg.supplier}</span>
                       <div className="flex gap-2">
                          <input 
                            type="number" 
                            className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold" 
                            placeholder="2025"
                            value={sg.v2025 || ''}
                            onChange={e => {
                              const next = [...supplierGoals];
                              next[i].v2025 = parseFloat(e.target.value) || 0;
                              setSupplierGoals(next);
                            }}
                          />
                          <input 
                            type="number" 
                            className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold" 
                            placeholder="2026"
                            value={sg.v2026 || ''}
                            onChange={e => {
                              const next = [...supplierGoals];
                              next[i].v2026 = parseFloat(e.target.value) || 0;
                              setSupplierGoals(next);
                            }}
                          />
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 flex justify-end gap-6 border-t bg-slate-50/50">
                <button 
                  onClick={saveManualGoal}
                  className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-blue-600 transition-all uppercase text-xs tracking-widest"
                >
                  Confirmar Planejamento
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GoalsTab;
