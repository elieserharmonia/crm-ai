
import React, { useState, useMemo, useEffect } from 'react';
import { Target, Plus, Trash2, TrendingUp, X, Building, Briefcase, CheckCircle2, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';
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
  const [currentSuppliersList, setCurrentSuppliersList] = useState<string[]>([]);
  const [supplierGoals, setSupplierGoals] = useState<Record<string, number>>({});
  const [newSupplierName, setNewSupplierName] = useState('');

  const customers = useMemo(() => Array.from(new Set(data.map(r => r.CUSTOMER))).sort(), [data]);

  // Agrupamento de metas por empresa para a visualização principal
  const groupedGoals = useMemo(() => {
    const map = new Map<string, Goal[]>();
    goals.forEach(goal => {
      const customer = goal.customer || 'Global';
      if (!map.has(customer)) map.set(customer, []);
      map.get(customer)!.push(goal);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [goals]);

  useEffect(() => {
    if (selectedCustomer) {
      const forecastSuppliers = data
        .filter(r => r.CUSTOMER.toLowerCase() === selectedCustomer.toLowerCase())
        .map(r => r.SUPPLIER);
      const unique = Array.from(new Set(forecastSuppliers)).sort();
      setCurrentSuppliersList(unique);
      setSupplierGoals({});
    }
  }, [selectedCustomer, data]);

  const handleValueChange = (supplier: string, val: string) => {
    setSupplierGoals(prev => ({ ...prev, [supplier]: parseFloat(val) || 0 }));
  };

  const addNewSupplierManual = () => {
    const name = newSupplierName.trim().toUpperCase();
    if (!name || currentSuppliersList.includes(name)) return;
    setCurrentSuppliersList(prev => [...prev, name]);
    setNewSupplierName('');
  };

  const removeSupplierFromList = (name: string) => {
    setCurrentSuppliersList(prev => prev.filter(s => s !== name));
  };

  const saveAllGoals = () => {
    const newGoalsList: Goal[] = [];
    (Object.entries(supplierGoals) as [string, number][]).forEach(([supplier, value]) => {
      if (value > 0) {
        const exists = goals.some(g => 
          g.customer?.toLowerCase() === selectedCustomer.toLowerCase() && 
          g.supplier?.toLowerCase() === supplier.toLowerCase()
        );
        if (!exists) {
          newGoalsList.push({
            id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            customer: selectedCustomer,
            supplier: supplier,
            value: value
          });
        }
      }
    });
    setGoals([...goals, ...newGoalsList]);
    setIsAdding(false);
    setSelectedCustomer('');
  };

  const removeGoalRecord = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const getRealizedForGoal = (goal: Goal) => {
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
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestão de Metas 2026</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Acompanhamento consolidado por empresa</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl font-black uppercase text-[10px] tracking-widest active:scale-95"
          >
            <Plus size={18} />
            Gerenciar Metas
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-lg">
                <Target size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Configurar por Cliente</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Defina metas linha a linha para todos os fornecedores</p>
              </div>
            </div>
            <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400">
              <X size={24} />
            </button>
          </div>
          
          <div className="space-y-10">
            <div className="max-w-md">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest px-1">Selecione a Empresa</label>
              <div className="relative">
                <select 
                  className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-800 uppercase text-xs appearance-none cursor-pointer"
                  value={selectedCustomer}
                  onChange={e => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Escolher Cliente...</option>
                  {customers.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
              </div>
            </div>

            {selectedCustomer && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                  <div className="flex gap-3">
                    <input 
                      className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-xs uppercase"
                      placeholder="Novo Fornecedor Manual..."
                      value={newSupplierName}
                      onChange={e => setNewSupplierName(e.target.value)}
                    />
                    <button onClick={addNewSupplierManual} className="px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Adicionar Linha</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {currentSuppliersList.map(supplier => (
                    <div key={supplier} className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white border border-slate-200 rounded-[1.8rem] hover:border-blue-400 transition-all">
                      <div className="flex-1 flex items-center gap-4">
                         <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Briefcase size={16} /></div>
                         <span className="text-sm font-black text-slate-900 uppercase">{supplier}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">R$</span>
                          <input 
                            type="number"
                            className="w-48 pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-black text-sm text-slate-800"
                            value={supplierGoals[supplier] || ''}
                            onChange={e => handleValueChange(supplier, e.target.value)}
                          />
                        </div>
                        <button onClick={() => removeSupplierFromList(supplier)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-8 border-t border-slate-100">
                  <button onClick={saveAllGoals} className="px-14 py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-2xl hover:bg-slate-900 transition-all active:scale-95 uppercase text-xs tracking-widest flex items-center gap-3">
                    <CheckCircle2 size={18} /> Salvar Metas da Empresa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid de Metas Agrupadas por Empresa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {groupedGoals.map(([customer, companyGoals]) => {
          const totalGoal = companyGoals.reduce((acc, g) => acc + g.value, 0);
          const totalRealized = companyGoals.reduce((acc, g) => acc + getRealizedForGoal(g), 0);
          const totalPercent = totalGoal > 0 ? (totalRealized / totalGoal) * 100 : 0;

          return (
            <div key={customer} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-500 transition-all overflow-hidden flex flex-col group">
              {/* Cabeçalho do Card da Empresa */}
              <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-5 bg-slate-900 text-white rounded-[2rem] shadow-xl"><Building size={28} /></div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{customer}</h3>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">{companyGoals.length} Fornecedores com Metas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Meta</p>
                    <p className="text-xl font-mono font-black text-slate-900">
                      R$ {totalGoal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Progresso Consolidado da Empresa */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-blue-600">Performance Geral: {totalPercent.toFixed(1)}%</span>
                    <span className="text-slate-400 italic">Target 2026</span>
                  </div>
                  <div className="h-4 bg-white border border-slate-200 rounded-full overflow-hidden p-[2px] shadow-inner">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-lg" 
                      style={{ width: `${Math.min(totalPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Detalhamento por Fornecedor (Linhas) */}
              <div className="flex-1 p-8 space-y-3">
                {companyGoals.map(goal => {
                  const goalRealized = getRealizedForGoal(goal);
                  const goalPercent = goal.value > 0 ? (goalRealized / goal.value) * 100 : 0;
                  return (
                    <div key={goal.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl group/row hover:bg-white hover:border-blue-200 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4 min-w-0">
                         <div className="p-2 bg-white rounded-xl text-slate-400 border border-slate-100"><Briefcase size={14}/></div>
                         <div className="min-w-0">
                           <p className="text-[11px] font-black text-slate-900 uppercase truncate">{goal.supplier}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">Meta: R$ {goal.value.toLocaleString()}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="text-right">
                           <p className="text-[10px] font-mono font-black text-slate-900">R$ {goalRealized.toLocaleString()}</p>
                           <div className="flex items-center gap-1 justify-end">
                              <span className={`text-[8px] font-black uppercase ${goalPercent >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                                {goalPercent.toFixed(0)}%
                              </span>
                           </div>
                         </div>
                         <button 
                          onClick={() => removeGoalRecord(goal.id)}
                          className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover/row:opacity-100"
                         >
                           <Trash2 size={14} />
                         </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rodapé de Ação */}
              <div className="p-6 border-t border-slate-50 flex justify-center opacity-0 group-hover:opacity-100 transition-all">
                 <button 
                  onClick={() => onGoalClick(customer)}
                  className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                 >
                   Ver Detalhes no Forecast <ChevronRight size={14} />
                 </button>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && !isAdding && (
          <div className="col-span-full py-40 bg-white border-4 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center text-slate-400 gap-8">
            <div className="w-28 h-28 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-slate-100 shadow-inner">
              <BarChart3 size={56} className="opacity-10" />
            </div>
            <div className="text-center space-y-3">
              <p className="text-3xl font-black text-slate-800 uppercase tracking-tight">Sem Metas Ativas</p>
              <p className="text-sm max-w-[350px] mx-auto text-slate-400 font-medium leading-relaxed">Agrupe fornecedores por empresa para uma gestão de pipeline muito mais estratégica e visual.</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-14 py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-2xl active:scale-95"
            >
              Começar Agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsTab;
