
import React, { useState, useMemo, useEffect } from 'react';
import { Target, Plus, Trash2, TrendingUp, X, Building, Briefcase, CheckCircle2, ChevronDown, ChevronRight, BarChart3, Pencil, AlertCircle } from 'lucide-react';
import { ForecastRow, Goal } from '../types';

interface GoalsTabProps {
  data: ForecastRow[];
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  onGoalClick: (target: string) => void;
}

const GoalsTab: React.FC<GoalsTabProps> = ({ data, goals, setGoals, onGoalClick }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [currentSuppliersList, setCurrentSuppliersList] = useState<string[]>([]);
  const [supplierGoals, setSupplierGoals] = useState<Record<string, number>>({});
  const [newSupplierName, setNewSupplierName] = useState('');

  const customers = useMemo(() => Array.from(new Set(data.map(r => r.CUSTOMER))).sort(), [data]);

  const groupedGoals = useMemo(() => {
    const map = new Map<string, Goal[]>();
    goals.forEach(goal => {
      const customer = goal.customer || 'Global';
      if (!map.has(customer)) map.set(customer, []);
      map.get(customer)!.push(goal);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [goals]);

  // Carrega fornecedores do Forecast ao selecionar cliente (apenas se não estiver editando)
  useEffect(() => {
    if (selectedCustomer && !isEditing) {
      const forecastSuppliers = data
        .filter(r => r.CUSTOMER.toLowerCase() === selectedCustomer.toLowerCase())
        .map(r => r.SUPPLIER);
      const unique = Array.from(new Set(forecastSuppliers)).sort();
      setCurrentSuppliersList(unique);
      setSupplierGoals({});
    }
  }, [selectedCustomer, data, isEditing]);

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
    const nextGoals = { ...supplierGoals };
    delete nextGoals[name];
    setSupplierGoals(nextGoals);
  };

  const startEditCompany = (customer: string, companyGoals: Goal[]) => {
    setIsAdding(true);
    setIsEditing(true);
    setSelectedCustomer(customer);
    
    // Preenche a lista de fornecedores com o que já existe na meta
    const existingSuppliers = companyGoals.map(g => g.supplier || '');
    setCurrentSuppliersList(existingSuppliers);
    
    // Preenche os valores
    const existingValues: Record<string, number> = {};
    companyGoals.forEach(g => {
      if (g.supplier) existingValues[g.supplier] = g.value;
    });
    setSupplierGoals(existingValues);
    
    // Scroll para o topo para ver o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveAllGoals = () => {
    // 1. Remove todas as metas antigas deste cliente (para sobrescrever)
    const otherGoals = goals.filter(g => g.customer?.toLowerCase() !== selectedCustomer.toLowerCase());
    
    // 2. Cria as novas metas baseadas no formulário
    const newGoalsFromForm: Goal[] = [];
    (Object.entries(supplierGoals) as [string, number][]).forEach(([supplier, value]) => {
      if (value > 0 && currentSuppliersList.includes(supplier)) {
        newGoalsFromForm.push({
          id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          customer: selectedCustomer,
          supplier: supplier,
          value: value
        });
      }
    });

    if (newGoalsFromForm.length === 0 && currentSuppliersList.length > 0) {
        if (!confirm("Você não preencheu valores de meta. Deseja remover todas as metas desta empresa?")) return;
    }

    setGoals([...otherGoals, ...newGoalsFromForm]);
    setIsAdding(false);
    setIsEditing(false);
    setSelectedCustomer('');
    setCurrentSuppliersList([]);
    setSupplierGoals({});
  };

  const removeGoalRecord = (id: string) => {
    if (confirm("Deseja remover esta meta de fornecedor individual?")) {
      setGoals(goals.filter(g => g.id !== id));
    }
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
            onClick={() => { setIsAdding(true); setIsEditing(false); setSelectedCustomer(''); setCurrentSuppliersList([]); setSupplierGoals({}); }}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl font-black uppercase text-[10px] tracking-widest active:scale-95"
          >
            <Plus size={18} />
            Nova Meta de Empresa
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className={`p-4 ${isEditing ? 'bg-amber-500' : 'bg-blue-600'} text-white rounded-[1.5rem] shadow-lg`}>
                {isEditing ? <Pencil size={28} /> : <Target size={28} />}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                  {isEditing ? 'Editar Planejamento' : 'Configurar por Cliente'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {isEditing ? `Alterando metas para ${selectedCustomer}` : 'Defina metas linha a linha para todos os fornecedores'}
                </p>
              </div>
            </div>
            <button onClick={() => { setIsAdding(false); setIsEditing(false); setSelectedCustomer(''); }} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400">
              <X size={24} />
            </button>
          </div>
          
          <div className="space-y-10">
            <div className="max-w-md">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest px-1">Selecione a Empresa</label>
              <div className="relative">
                <select 
                  disabled={isEditing}
                  className={`w-full pl-6 pr-12 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-800 uppercase text-xs appearance-none cursor-pointer ${isEditing ? 'bg-slate-100 opacity-60' : 'bg-slate-50'}`}
                  value={selectedCustomer}
                  onChange={e => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Escolher Cliente...</option>
                  {customers.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
                {!isEditing && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />}
              </div>
            </div>

            {selectedCustomer && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                   <div className="flex items-center gap-2 mb-4 px-1">
                      <Plus size={14} className="text-blue-600" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adicionar Novo Fornecedor na Lista</span>
                   </div>
                  <div className="flex gap-3">
                    <input 
                      className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-xs uppercase focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do Fornecedor Manual..."
                      value={newSupplierName}
                      onChange={e => setNewSupplierName(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addNewSupplierManual()}
                    />
                    <button onClick={addNewSupplierManual} className="px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Adicionar Linha</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {currentSuppliersList.map(supplier => (
                    <div key={supplier} className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white border border-slate-200 rounded-[1.8rem] hover:border-blue-400 transition-all shadow-sm group">
                      <div className="flex-1 flex items-center gap-4">
                         <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Briefcase size={16} /></div>
                         <span className="text-sm font-black text-slate-900 uppercase">{supplier}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">R$</span>
                          <input 
                            type="number"
                            placeholder="0,00"
                            className="w-48 pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-black text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                            value={supplierGoals[supplier] || ''}
                            onChange={e => handleValueChange(supplier, e.target.value)}
                          />
                        </div>
                        <button 
                            onClick={() => removeSupplierFromList(supplier)} 
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            title="Remover fornecedor"
                        >
                            <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>
                  ))}
                  {currentSuppliersList.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 italic text-xs uppercase font-bold tracking-widest">
                        Nenhum fornecedor na lista. Use o campo acima para adicionar.
                    </div>
                  )}
                </div>

                {isEditing && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                        <AlertCircle size={18} className="text-amber-500" />
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Você está no modo de edição. Salvar substituirá o planejamento atual deste cliente.</p>
                    </div>
                )}

                <div className="flex justify-end pt-8 border-t border-slate-100">
                  <button onClick={saveAllGoals} className="px-14 py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-2xl hover:bg-slate-900 transition-all active:scale-95 uppercase text-xs tracking-widest flex items-center gap-3">
                    <CheckCircle2 size={18} /> {isEditing ? 'Confirmar Alterações' : 'Salvar Planejamento'}
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
                    <div className="p-5 bg-slate-900 text-white rounded-[2rem] shadow-xl group-hover:bg-blue-600 transition-all"><Building size={28} /></div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{customer}</h3>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">{companyGoals.length} Fornecedores Planejados</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={() => startEditCompany(customer, companyGoals)}
                      className="p-3 bg-white text-slate-400 rounded-xl border border-slate-100 shadow-sm hover:text-blue-600 hover:border-blue-200 transition-all active:scale-90"
                      title="Editar Planejamento da Empresa"
                    >
                        <Pencil size={16} />
                    </button>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Meta</p>
                        <p className="text-xl font-mono font-black text-slate-900">
                        R$ {totalGoal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                  </div>
                </div>

                {/* Progresso Consolidado da Empresa */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className={totalPercent >= 100 ? 'text-green-600' : 'text-blue-600'}>
                        Performance: {totalPercent.toFixed(1)}%
                    </span>
                    <span className="text-slate-400 italic">Target 2026</span>
                  </div>
                  <div className="h-4 bg-white border border-slate-200 rounded-full overflow-hidden p-[2px] shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 shadow-lg ${totalPercent >= 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
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
                   Analisar Pipeline no Forecast <ChevronRight size={14} />
                 </button>
              </div>
            </div>
          );
        })}

        {groupedGoals.length === 0 && !isAdding && (
          <div className="col-span-full py-40 bg-white border-4 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center text-slate-400 gap-8">
            <div className="w-28 h-28 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-slate-100 shadow-inner">
              <BarChart3 size={56} className="opacity-10" />
            </div>
            <div className="text-center space-y-3">
              <p className="text-3xl font-black text-slate-800 uppercase tracking-tight">Sem Planejamento Ativo</p>
              <p className="text-sm max-w-[350px] mx-auto text-slate-400 font-medium leading-relaxed">Defina metas de venda por fornecedor para cada cliente e acompanhe o sucesso da conta em tempo real.</p>
            </div>
            <button 
              onClick={() => { setIsAdding(true); setIsEditing(false); setSelectedCustomer(''); }}
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
