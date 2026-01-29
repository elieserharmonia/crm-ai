
import React, { useState, useMemo, useEffect } from 'react';
import { Target, Plus, Trash2, TrendingUp, X, Building, Briefcase, CheckCircle2, ChevronDown, UserPlus } from 'lucide-react';
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
  
  // Lista local de fornecedores para a empresa selecionada (Inicia com os do Forecast + Manuais)
  const [currentSuppliersList, setCurrentSuppliersList] = useState<string[]>([]);
  const [supplierGoals, setSupplierGoals] = useState<Record<string, number>>({});
  const [newSupplierName, setNewSupplierName] = useState('');

  // Lista única de clientes do forecast
  const customers = useMemo(() => Array.from(new Set(data.map(r => r.CUSTOMER))).sort(), [data]);

  // Efeito para carregar fornecedores do forecast ao mudar de cliente
  useEffect(() => {
    if (selectedCustomer) {
      const forecastSuppliers = data
        .filter(r => r.CUSTOMER.toLowerCase() === selectedCustomer.toLowerCase())
        .map(r => r.SUPPLIER);
      const unique = Array.from(new Set(forecastSuppliers)).sort();
      setCurrentSuppliersList(unique);
      setSupplierGoals({});
    } else {
      setCurrentSuppliersList([]);
      setSupplierGoals({});
    }
  }, [selectedCustomer, data]);

  const handleValueChange = (supplier: string, val: string) => {
    setSupplierGoals(prev => ({ ...prev, [supplier]: parseFloat(val) || 0 }));
  };

  const addNewSupplierManual = () => {
    const name = newSupplierName.trim().toUpperCase();
    if (!name) return;
    if (currentSuppliersList.includes(name)) {
      alert('Este fornecedor já está na lista.');
      return;
    }
    setCurrentSuppliersList(prev => [...prev, name]);
    setNewSupplierName('');
  };

  const removeSupplierFromList = (name: string) => {
    setCurrentSuppliersList(prev => prev.filter(s => s !== name));
    const newGoals = { ...supplierGoals };
    delete newGoals[name];
    setSupplierGoals(newGoals);
  };

  const saveAllGoals = () => {
    const newGoalsList: Goal[] = [];
    
    (Object.entries(supplierGoals) as [string, number][]).forEach(([supplier, value]) => {
      if (value > 0) {
        // Verifica se já existe uma meta para este par Cliente/Fornecedor
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

    if (newGoalsList.length === 0) {
      alert('Nenhum valor de meta válido foi preenchido.');
      return;
    }

    setGoals([...goals, ...newGoalsList]);
    setIsAdding(false);
    setSelectedCustomer('');
    setCurrentSuppliersList([]);
    setSupplierGoals({});
  };

  const removeGoalRecord = (id: string) => {
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
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                <Target size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Metas por Empresa</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Defina objetivos linha a linha por fornecedor</p>
              </div>
            </div>
            <button onClick={() => { setIsAdding(false); setSelectedCustomer(''); }} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400">
              <X size={24} />
            </button>
          </div>
          
          <div className="space-y-10">
            {/* 1. SELEÇÃO DO CLIENTE */}
            <div className="max-w-md">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest px-1">1. Escolha o Cliente</label>
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
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                
                {/* 2. ADIÇÃO MANUAL DE FORNECEDOR */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">2. Adicionar Novo Fornecedor (Opcional)</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs uppercase"
                        placeholder="Nome do Fornecedor..."
                        value={newSupplierName}
                        onChange={e => setNewSupplierName(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && addNewSupplierManual()}
                      />
                    </div>
                    <button 
                      onClick={addNewSupplierManual}
                      className="px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
                    >
                      <Plus size={16} /> Adicionar na Lista
                    </button>
                  </div>
                </div>

                {/* 3. LISTAGEM EM LINHAS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor da Meta (R$)</span>
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {currentSuppliersList.map(supplier => (
                      <div key={supplier} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl group hover:border-blue-200 transition-all shadow-sm">
                        <div className="flex-1 flex items-center gap-3 min-w-0">
                           <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                              <Briefcase size={14} />
                           </div>
                           <span className="text-xs font-black text-slate-900 uppercase truncate">{supplier}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="relative w-full md:w-48">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">R$</span>
                            <input 
                              type="number"
                              placeholder="0,00"
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono font-black text-sm text-slate-700"
                              value={supplierGoals[supplier] || ''}
                              onChange={e => handleValueChange(supplier, e.target.value)}
                            />
                          </div>
                          <button 
                            onClick={() => removeSupplierFromList(supplier)}
                            className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                            title="Remover desta lista"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {currentSuppliersList.length === 0 && (
                      <div className="text-center py-12 text-slate-300 italic text-xs uppercase font-bold tracking-widest">Nenhum fornecedor disponível. Adicione um acima.</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-8 border-t border-slate-100">
                  <button 
                    onClick={saveAllGoals}
                    disabled={currentSuppliersList.length === 0}
                    className="px-14 py-5 bg-blue-600 text-white rounded-[1.8rem] font-black shadow-2xl hover:bg-slate-900 transition-all active:scale-95 uppercase text-xs tracking-widest flex items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 size={18} />
                    Confirmar e Gerar Metas
                  </button>
                </div>
              </div>
            )}

            {!selectedCustomer && (
              <div className="py-24 text-center border-4 border-dashed border-slate-100 rounded-[3rem]">
                <Building size={64} className="mx-auto text-slate-100 mb-6" />
                <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Selecione uma empresa para começar a definir as metas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid de Metas Cadastradas */}
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
                  onClick={(e) => { e.stopPropagation(); removeGoalRecord(goal.id); }}
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
