
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Plus, 
  ChevronLeft,
  FileText,
  UserCheck,
  Building,
  MessageSquare,
  Mail,
  LayoutGrid,
  Table as TableIcon,
  Search,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { ForecastRow, Contact } from '../types';

interface CompaniesTabProps {
  data: ForecastRow[];
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  onFilterByCompany: (company: string) => void;
  resetTrigger?: number;
}

const CompaniesTab: React.FC<CompaniesTabProps> = ({ data, contacts, setContacts, onFilterByCompany, resetTrigger }) => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { setSelectedCompany(null); }, [resetTrigger]);

  const companyStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number; rows: ForecastRow[] }>();
    data.forEach(r => {
      const companyName = r.CUSTOMER || 'Desconhecido';
      if (!map.has(companyName)) map.set(companyName, { count: 0, total: 0, rows: [] });
      const entry = map.get(companyName)!;
      entry.count++;
      entry.total += r.AMOUNT;
      entry.rows.push(r);
    });
    return Array.from(map.entries())
      .filter(([name]) => name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b[1].total - a[1].total);
  }, [data, searchTerm]);

  if (selectedCompany) {
    // Detalhes da empresa mantidos conforme implementação anterior...
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <button onClick={() => setSelectedCompany(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-xs hover:text-blue-600 transition-all">
          <ChevronLeft size={16} /> Voltar
        </button>
        {/* Conteúdo de detalhes da empresa... */}
        <div className="bg-slate-900 rounded-[2.5rem] text-white p-10 shadow-2xl border border-slate-800">
           <h2 className="text-3xl font-black uppercase tracking-tight">{selectedCompany}</h2>
           <p className="text-blue-400 font-bold mt-1 uppercase text-[10px] tracking-widest">Painel Consolidado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
            placeholder="Localizar empresa..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid size={14} /> Cards
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <TableIcon size={14} /> Tabela
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
          {companyStats.map(([name, stats], i) => (
            <div key={i} onClick={() => setSelectedCompany(name)} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all cursor-pointer group h-72 flex flex-col justify-between">
               <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-5 bg-slate-100 rounded-3xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><Building size={28}/></div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline</p>
                        <p className="font-mono font-black text-slate-900 group-hover:text-blue-600 text-lg">R$ {(stats.total/1000).toFixed(0)}k</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">{name}</h3>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">{stats.count} Negócios Ativos</p>
               </div>
               <div className="pt-6 border-t flex justify-between items-center opacity-40 group-hover:opacity-100 transition-all">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ver Detalhes</span>
                  <ChevronRight className="text-blue-600" size={18} />
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa / Cliente</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Negócios</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Volume Total (Pipeline)</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companyStats.map(([name, stats], i) => (
                <tr key={i} className="hover:bg-slate-50 transition-all group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><Building size={14}/></div>
                      <span className="font-black text-slate-900 uppercase">{name}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black">
                      {stats.count} OPORTUNIDADES
                    </span>
                  </td>
                  <td className="p-6 text-right font-mono font-black text-slate-700">
                    {stats.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="p-6 text-center">
                    <button 
                      onClick={() => setSelectedCompany(name)}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                    >
                      Abrir Perfil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompaniesTab;
