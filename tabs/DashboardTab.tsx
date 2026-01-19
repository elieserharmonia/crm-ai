
import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, Users, DollarSign, Target, PieChart as PieIcon, Layers } from 'lucide-react';
import { ForecastRow } from '../types';

interface DashboardTabProps {
  data: ForecastRow[];
}

const DashboardTab: React.FC<DashboardTabProps> = ({ data }) => {
  const [conversionType, setConversionType] = useState<'count' | 'value'>('value');

  // Stats
  const stats = useMemo(() => {
    const totalValue = data.reduce((acc, r) => acc + r.AMOUNT, 0);
    const wonValue = data.filter(r => r.Confidence === 100).reduce((acc, r) => acc + r.AMOUNT, 0);
    const totalCount = data.length;
    const wonCount = data.filter(r => r.Confidence === 100).length;
    
    return {
      totalValue,
      wonValue,
      totalCount,
      wonCount,
      conversionRateValue: totalValue > 0 ? (wonValue / totalValue) * 100 : 0,
      conversionRateCount: totalCount > 0 ? (wonCount / totalCount) * 100 : 0
    };
  }, [data]);

  // Charts Data
  const amountByMonth = useMemo(() => {
    const months = ['JAN', 'FEV', 'MAR'];
    return months.map(m => ({
      name: m,
      total: data.reduce((acc, r) => acc + (Number(r[m as keyof ForecastRow]) || 0), 0)
    }));
  }, [data]);

  const amountByCustomer = useMemo(() => {
    const groups: Record<string, number> = {};
    data.forEach(r => {
      groups[r.CUSTOMER] = (groups[r.CUSTOMER] || 0) + r.AMOUNT;
    });
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data]);

  const confidenceFunnel = useMemo(() => {
    const confs = [0, 10, 30, 50, 80, 90, 100];
    return confs.map(c => ({
      name: `${c}%`,
      value: data.filter(r => r.Confidence === c).length
    }));
  }, [data]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Previsão Total 2026', value: stats.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Oportunidades Ganhas', value: stats.wonValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Conversão (Valor)', value: `${stats.conversionRateValue.toFixed(1)}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Conversão (Quantidade)', value: `${stats.conversionRateCount.toFixed(1)}%`, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' }
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`${kpi.bg} p-3 rounded-lg ${kpi.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{kpi.label}</p>
                <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Forecast Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <PieIcon size={18} className="text-blue-500" />
              Valor Previsto por Mês
            </h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={amountByMonth}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                <Tooltip formatter={(val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            Principais Clientes por Valor
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={amountByCustomer} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Funnel */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Layers size={18} className="text-blue-500" />
            Funil de Confiança (Quantidade)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={confidenceFunnel}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {confidenceFunnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Resumo por Fornecedor</h3>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left border-b border-slate-200">
                  <th className="p-2 font-semibold">Fornecedor</th>
                  <th className="p-2 font-semibold text-right">Oportunidades</th>
                  <th className="p-2 font-semibold text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(data.reduce((acc, r) => {
                  acc[r.SUPPLIER] = acc[r.SUPPLIER] || { count: 0, amount: 0 };
                  acc[r.SUPPLIER].count++;
                  acc[r.SUPPLIER].amount += r.AMOUNT;
                  return acc;
                }, {} as any)).map(([name, info]: any) => (
                  <tr key={name}>
                    <td className="p-2 font-medium">{name}</td>
                    <td className="p-2 text-right">{info.count}</td>
                    <td className="p-2 text-right font-mono">{info.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
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
