
import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { TrendingUp, Users, DollarSign, Target, PieChart as PieIcon, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';
import { ForecastRow, Goal, PurchaseOrder, SalesPersonProfile } from '../types';
import { storageService } from '../services/storageService';

interface DashboardTabProps {
  data: ForecastRow[];
  profile: SalesPersonProfile;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ data, profile }) => {
  const goals = storageService.getGoals();
  const pos = storageService.getPOs();

  // Função para pegar iniciais do nome
  const userInitials = useMemo(() => {
    if (!profile.name) return '??';
    return profile.name
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, [profile.name]);

  // Stats
  const stats = useMemo(() => {
    const totalForecastValue = data.reduce((acc, r) => acc + (r.AMOUNT || 0), 0);
    const totalBudgetGoal = goals.reduce((acc, g) => acc + g.value, 0);
    const totalRealizedFromPOs = pos.reduce((acc, p) => acc + p.amount, 0);
    
    const goalPercent = totalBudgetGoal > 0 ? (totalRealizedFromPOs / totalBudgetGoal) * 100 : 0;
    
    return {
      totalForecastValue,
      totalBudgetGoal,
      totalRealizedFromPOs,
      goalPercent,
      totalCount: data.length,
      closedCount: pos.length
    };
  }, [data, goals, pos]);

  // Charts Data
  const amountByCustomer = useMemo(() => {
    const groups: Record<string, number> = {};
    data.forEach(r => {
      groups[r.CUSTOMER] = (groups[r.CUSTOMER] || 0) + (r.AMOUNT || 0);
    });
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  return (
    <div className="space-y-8 pb-20">
      {/* KPIs de Meta e Realização */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-[2rem] border-4 border-white shadow-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/50"><Target size={24}/></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Target Financeiro</span>
          </div>
          <div className="mt-6">
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
               BUDGET 2026_{userInitials}
             </p>
             <p className="text-2xl font-black font-mono">
               R$ {stats.totalBudgetGoal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
             </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CheckCircle2 size={24}/></div>
             <div className="text-right">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest leading-none">Realizado (POs)</p>
                <p className="text-xs font-bold text-slate-400 mt-1">{stats.closedCount} Pedidos</p>
             </div>
          </div>
          <div className="mt-6">
             <p className="text-2xl font-black font-mono text-slate-900">
               R$ {stats.totalRealizedFromPOs.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
             </p>
             <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${stats.goalPercent >= 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                  style={{ width: `${Math.min(stats.goalPercent, 100)}%` }} 
                />
             </div>
          </div>
        </div>

        <div className="bg-blue-600 text-white p-8 rounded-[2rem] shadow-xl flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Atingimento da Meta</p>
            <p className="text-5xl font-black tracking-tighter">
              {stats.goalPercent.toFixed(1)}%
            </p>
            <p className="text-[10px] font-bold mt-4 uppercase tracking-widest opacity-80 flex items-center gap-1">
              <TrendingUp size={12}/> Performance Real
            </p>
          </div>
          <DollarSign className="absolute -right-4 -bottom-4 text-white/10" size={120} />
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Briefcase size={24}/></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline Aberto</span>
          </div>
          <div className="mt-6">
             <p className="text-2xl font-black font-mono text-slate-900">
               R$ {(stats.totalForecastValue / 1000000).toFixed(1)}M
             </p>
             <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{stats.totalCount} Oportunidades</p>
          </div>
        </div>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 mb-10">
            <PieIcon size={24} className="text-blue-600" />
            Top Clientes (Forecast)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={amountByCustomer} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'black' }}
                  formatter={(val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={24}>
                   {amountByCustomer.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 mb-10">
            <AlertCircle size={24} className="text-amber-500" />
            Resumo por Fornecedor
          </h3>
          <div className="overflow-auto max-h-[320px] custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Volume Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.entries(data.reduce((acc, r) => {
                  acc[r.SUPPLIER] = (acc[r.SUPPLIER] || 0) + (r.AMOUNT || 0);
                  return acc;
                }, {} as any)).map(([name, val]: any) => (
                  <tr key={name} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4">
                      <p className="text-xs font-black text-slate-900 uppercase">{name}</p>
                    </td>
                    <td className="py-4 text-right">
                      <p className="font-mono font-black text-blue-600 text-sm">{val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
