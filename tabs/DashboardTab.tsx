
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
  // Stats
  const stats = useMemo(() => {
    // Fix: Corrected property names from VALOR to AMOUNT and CONFIDÊNCIA to Confidence
    const totalValue = data.reduce((acc, r) => acc + (r.AMOUNT || 0), 0);
    const wonValue = data.filter(r => r.Confidence === 100).reduce((acc, r) => acc + (r.AMOUNT || 0), 0);
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
      // Fix: Corrected property name from VALOR to AMOUNT
      total: data.reduce((acc, r) => acc + (r[m as keyof ForecastRow] === 'x' ? (r.AMOUNT || 0) : 0), 0)
    }));
  }, [data]);

  const amountByCustomer = useMemo(() => {
    const groups: Record<string, number> = {};
    data.forEach(r => {
      // Fix: Corrected property names from CLIENTE to CUSTOMER and VALOR to AMOUNT
      groups[r.CUSTOMER] = (groups[r.CUSTOMER] || 0) + (r.AMOUNT || 0);
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
      // Fix: Corrected property name from CONFIDÊNCIA to Confidence
      value: data.filter(r => r.Confidence === c).length
    }));
  }, [data]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Pipeline Total 2026', value: stats.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Ganhos Confirmados', value: stats.wonValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Conversão (Valor)', value: `${stats.conversionRateValue.toFixed(1)}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Volume Oportunidades', value: stats.totalCount, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' }
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`${kpi.bg} p-3 rounded-lg ${kpi.color}`}><Icon size={24} /></div>
              <div><p className="text-sm text-slate-500 font-medium">{kpi.label}</p><p className="text-xl font-bold text-slate-900">{kpi.value}</p></div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><PieIcon size={18} className="text-blue-500" />Principais Clientes (Valor)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={amountByCustomer} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Pipeline por Fornecedor</h3>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50"><tr className="text-left border-b border-slate-200"><th className="p-2 font-semibold">Fornecedor</th><th className="p-2 font-semibold text-right">Valor</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(data.reduce((acc, r) => {
                  // Fix: Corrected property names from FORNECEDOR to SUPPLIER and VALOR to AMOUNT
                  acc[r.SUPPLIER] = (acc[r.SUPPLIER] || 0) + (r.AMOUNT || 0);
                  return acc;
                }, {} as any)).map(([name, val]: any) => (
                  <tr key={name}><td className="p-2 font-medium">{name}</td><td className="p-2 text-right font-mono">{val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>
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
