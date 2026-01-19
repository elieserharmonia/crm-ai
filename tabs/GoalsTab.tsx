
import React, { useState, useMemo } from 'react';
import { Target, Plus, Trash2, TrendingUp, X } from 'lucide-react';
import { ForecastRow, Goal } from '../types';

interface GoalsTabProps {
  data: ForecastRow[];
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  onGoalClick: (target: string) => void;
}

const GoalsTab: React.FC<GoalsTabProps> = ({ data, goals, setGoals, onGoalClick }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({ customer: '', supplier: '', value: 0 });

  // Fix: Changed r.CUSTOMER to r.CLIENTE and r.SUPPLIER to r.FORNECEDOR
  const customers = useMemo(() => Array.from(new Set(data.map(r => r.CLIENTE))).sort(), [data]);
  const suppliers = useMemo(() => Array.from(new Set(data.map(r => r.FORNECEDOR))).sort(), [data]);

  const addGoal = () => {
    if ((!newGoal.customer && !newGoal.supplier) || !newGoal.value) {
      alert('Preencha ao menos um Cliente ou Fornecedor e defina um valor para a meta.');
      return;
    }
    setGoals([...goals, { ...newGoal, id: Date.now().toString() } as Goal]);
    setIsAdding(false);
    setNewGoal({ customer: '', supplier: '', value: 0 });
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const getRealized = (goal: Goal) => {
    return data
      // Fix: Changed r.Confidence to r.CONFIDÊNCIA
      .filter(r => r.CONFIDÊNCIA === 100)
      .filter(r => {
        // Fix: Changed r.CUSTOMER to r.CLIENTE and r.SUPPLIER to r.FORNECEDOR
        const matchCustomer = goal.customer ? r.CLIENTE.toLowerCase() === goal.customer.toLowerCase() : true;
        const matchSupplier = goal.supplier ? r.FORNECEDOR.toLowerCase() === goal.supplier.toLowerCase() : true;
        return matchCustomer && matchSupplier;
      })
      // Fix: Changed r.AMOUNT to r.VALOR
      .reduce((acc, r) => acc + r.VALOR, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">Metas de Vendas e Objetivos</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-bold"
          >
            <Plus size={18} />
            Nova Meta
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Target size={18} className="text-blue-600" />
              Configurar Meta
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Cliente</label>
              <input 
                list="customers-list"
                placeholder="Digite ou selecione o cliente..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                value={newGoal.customer}
                onChange={e => setNewGoal({...newGoal, customer: e.target.value})}
              />
              <datalist id="customers-list">
                {customers.map(item => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Fornecedor</label>
              <input 
                list="suppliers-list"
                placeholder="Digite ou selecione the fornecedor..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                value={newGoal.supplier}
                onChange={e => setNewGoal({...newGoal, supplier: e.target.value})}
              />
              <datalist id="suppliers-list">
                {suppliers.map(item => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Valor da Meta (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                <input 
                  type="number" 
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono font-bold"
                  placeholder="0,00"
                  value={newGoal.value || ''}
                  onChange={e => setNewGoal({...newGoal, value: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button 
              onClick={() => setIsAdding(false)}
              className="px-6 py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={addGoal}
              className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-700 transition-all active:scale-95"
            >
              Salvar Meta
            </button>
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
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:border-blue-400 transition-all cursor-pointer group hover:shadow-md"
              onClick={() => onGoalClick(goal.customer || goal.supplier || '')}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Target size={22} />
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeGoal(goal.id); }}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="font-black text-slate-900 leading-tight uppercase">
                  {goal.customer || <span className="text-slate-400 font-medium italic text-sm normal-case">Todos os Clientes</span>}
                </h3>
                {goal.supplier && (
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Fornecedor: {goal.supplier}
                  </p>
                )}
              </div>

              <div className="space-y-5 mt-auto">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Realizado</p>
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {realized.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Alvo</p>
                    <p className="font-bold text-blue-600 text-sm truncate">
                      {goal.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider">
                    <span className={percent >= 100 ? 'text-green-600' : 'text-blue-600'}>
                      {percent.toFixed(1)}% Concluído
                    </span>
                    <span className="text-slate-400">Objetivo 2026</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div 
                      className={`h-full transition-all duration-1000 ${percent >= 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                   <TrendingUp size={14} />
                   Ver Oportunidades
                </div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && !isAdding && (
          <div className="col-span-full py-24 bg-white border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
              <Target size={40} className="opacity-20" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-bold text-slate-700">Nenhuma meta definida</p>
              <p className="text-sm max-w-[250px] mx-auto">Crie objetivos para seus principais clientes e fornecedores e acompanhe o progresso em tempo real.</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
            >
              Criar Primeira Meta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsTab;
