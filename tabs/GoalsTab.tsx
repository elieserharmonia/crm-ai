
import React, { useState, useMemo } from 'react';
import { Target, Plus, Trash2, TrendingUp, X, Building, Briefcase, CheckCircle2, ChevronDown } from 'lucide-react';
import { ForecastRow, Goal } from '../types';

interface GoalsTabProps {
  data: ForecastRow[];
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  onGoalClick: (target: string) => void;
}

const GoalsTab: React.FC<GoalsTabProps> = ({ data, goals, setGoals, onGoalClick }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  // Mapa de fornecedor -> valor da meta
  const [supplierGoals, setSupplierGoals] = useState<Record<string, number>>({});

  // Lista única de clientes do forecast
  const customers = useMemo(() => Array.from(new Set(data.map(r => r.CUSTOMER))).sort(), [data]);

  // Fornecedores vinculados ao cliente selecionado no forecast
  const availableSuppliers = useMemo(() => {
    if (!selectedCustomer) return [];
    const suppliers = data
      .filter(r => r.CUSTOMER.toLowerCase() === selectedCustomer.toLowerCase())
      .map(r => r.SUPPLIER);
    return Array.from(new Set(suppliers)).sort();
  }, [data, selectedCustomer]);

  const handleValueChange = (supplier: string, val: string) => {
    setSupplierGoals(prev => ({ ...prev, [supplier]: parseFloat(val) || 0 }));
  };

  const saveAllGoals = () => {
    const newGoalsList: Goal[] = [];
    
    // Explicitly casting Object.entries to fix 'unknown' type issues in some TS environments
    (Object.entries(supplierGoals) as [string, number][]).forEach(([supplier, value]) => {
      // Fix: Now 'value' is correctly recognized as number for comparison
      if (value > 0) {
        // Verifica se já existe uma meta para este par Cliente/Fornecedor para evitar duplicatas
        const exists = goals.some(g => 
          g.customer?.toLowerCase() === selectedCustomer.toLowerCase() && 
          g.supplier?.toLowerCase() === supplier.toLowerCase()
        );
        
        if (!exists) {
          newGoalsList.push({
            id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            customer: selectedCustomer,
            supplier: supplier,
            // Fix: 'value' is correctly recognized as number for assignment
            value: value
          });
        }
      }
    });

    if (newGoalsList.length === 0) {
      alert('Nenhuma nova meta válida para adicionar.');
      return;
    }

    setGoals([...goals, ...newGoalsList]);
    setIsAdding(false);
    setSelectedCustomer('');
    setSupplierGoals({});
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const getRealized = (goal: Goal) => {
    return data
      .filter(r => r.Confidence === 100)
      .filter(r => {
        const matchCustomer = goal.customer ? r.CUSTOMER.toLowerCase() === goal.customer.toLowerCase() : true;
        const matchSupplier = goal.supplier ? r.SUPPLIER.toLowerCase() === goal.supplier.toLowerCase() : true;
        return matchCustomer && matchSupplier;
      })
      .reduce((acc, r) => acc + r.AMOUNT, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Metas de Vendas e Objetivos</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg font-black uppercase text-[10px] tracking-widest active:scale-95"
          >
            <Plus size={18} />
            Gerenciar Metas por Empresa
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                <Target size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Adicionar Metas em Lote</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Defina objetivos para todos os fornecedores da empresa</p>
              </div>
            </div>
            <button onClick={() => { setIsAdding(false); setSelectedCustomer(''); setSupplierGoals({}); }} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400">
              <X size={24} />
            </button>
          </div>
          
          <div className="space-y-8">
            <div className="max-w-md">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest px-1">1. Selecionar Empresa (Cliente)</label>
              <div className="relative group">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                <select 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-800 uppercase text-xs appearance-none cursor-pointer"
                  value={selectedCustomer}
                  onChange={e => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Selecione um cliente...</option>
                  {customers.map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
              </div>
            </div>

            {selectedCustomer && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">2. Definir Metas por Fornecedor (Forecast 2026)</label>
                  <span className="text-[9px] font-bold text-blue-500 uppercase">{availableSuppliers.length} Fornecedores Encontrados</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableSuppliers.map(supplier => (
                    <div key={supplier} className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-200 rounded-3xl group hover:border-blue-200 transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <Briefcase size={12} className="text-slate-400" />
                           <span className="text-[10px] font-black text-slate-900 uppercase truncate">{supplier}</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">R$</span>
                          <input 
                            type="number"
                            placeholder="0,00"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono font-black text-sm text-slate-700"
                            value={supplierGoals[supplier] || ''}
                            onChange={e => handleValueChange(supplier, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-6">
                  <button 
                    onClick={saveAllGoals}
                    className="px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase text-xs tracking-widest flex items-center gap-3"
                  >
                    <CheckCircle2 size={18} />
                    Gerar Todas as Metas Selecionadas
                  </button>
                </div>
              </div>
            )}

            {!selectedCustomer && (
              <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                <Building size={48} className="mx-auto text-slate-100 mb-4" />
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Escolha uma empresa para gerenciar seus fornecedores</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {goals.map(goal => {
          const realized = getRealized(goal);
          const percent = goal.value > 0 ? (realized / goal.value) * 100 : 0;
          return (
            <div 
              key={goal.id} 
              className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col hover:border-blue-400 transition-all cursor-pointer group hover:shadow-2xl hover:-translate-y-1"
              onClick={() => onGoalClick(goal.customer || goal.supplier || '')}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
                  <Target size={24} />
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeGoal(goal.id); }}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 rounded-xl opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-1 mb-8">
                <h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight truncate">
                  {goal.customer || <span className="text-slate-400 font-medium italic text-sm normal-case">Global</span>}
                </h3>
                {goal.supplier && (
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Briefcase size={12} /> {goal.supplier}
                  </p>
                )}
              </div>

              <div className="space-y-6 mt-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Realizado</p>
                    <p className="font-mono font-black text-slate-900 text-sm">
                      {realized.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Alvo (2026)</p>
                    <p className="font-mono font-black text-blue-600 text-sm">
                      {goal.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className={percent >= 100 ? 'text-green-600' : 'text-blue-600'}>
                      {percent.toFixed(1)}% Concluído
                    </span>
                    <span className="text-slate-400 italic">Objetivo Anual</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-[1px]">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 shadow-sm ${percent >= 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 text-blue-600 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                   <TrendingUp size={14} />
                   Ver Negócios no Forecast
                </div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && !isAdding && (
          <div className="col-span-full py-32 bg-white border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 gap-8">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-inner">
              <Target size={48} className="opacity-10" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">Painel de Metas Vazio</p>
              <p className="text-sm max-w-[300px] mx-auto text-slate-400 font-medium leading-relaxed">Defina objetivos estratégicos para seus principais fornecedores e acompanhe o pipeline em tempo real.</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-2xl active:scale-95"
            >
              Configurar Metas em Lote
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsTab;
