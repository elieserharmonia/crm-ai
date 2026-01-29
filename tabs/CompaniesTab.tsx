
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
  TrendingUp,
  Phone,
  AtSign,
  Trash2,
  DollarSign,
  Briefcase
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
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({ name: '', role: '', phone: '', email: '' });

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

  const handleAddContact = () => {
    if (!selectedCompany || !newContact.name) return;
    const contact: Contact = {
      id: Date.now().toString(),
      companyName: selectedCompany,
      name: newContact.name || '',
      role: newContact.role || '',
      phone: newContact.phone || '',
      email: newContact.email || ''
    };
    setContacts([...contacts, contact]);
    setNewContact({ name: '', role: '', phone: '', email: '' });
    setIsAddingContact(false);
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  if (selectedCompany) {
    const stats = companyStats.find(([name]) => name === selectedCompany)?.[1];
    const companyContacts = contacts.filter(c => c.companyName === selectedCompany);

    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setSelectedCompany(null)} 
          className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-all bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
        >
          <ChevronLeft size={14} /> Voltar para Lista
        </button>

        {/* Header Consolidado */}
        <div className="bg-slate-900 rounded-[3rem] text-white p-12 shadow-2xl border-4 border-white relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><Building size={32} /></div>
                   <div>
                      <h2 className="text-4xl font-black uppercase tracking-tight leading-none">{selectedCompany}</h2>
                      <p className="text-blue-400 font-bold mt-1 uppercase text-[10px] tracking-widest">Painel de Inteligência Consolidado</p>
                   </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-right min-w-[180px]">
                   <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Pipeline Total</p>
                   <p className="text-2xl font-black font-mono">R$ {(stats?.total || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-right min-w-[120px]">
                   <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Oportunidades</p>
                   <p className="text-2xl font-black font-mono">{stats?.count || 0}</p>
                </div>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna de Contatos */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <UserCheck size={16} /> Decisores e Contatos
                  </h3>
                  <button 
                    onClick={() => setIsAddingContact(true)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
               </div>

               {isAddingContact && (
                 <div className="mb-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
                    <input 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      placeholder="Nome do Contato"
                      value={newContact.name}
                      onChange={e => setNewContact({...newContact, name: e.target.value})}
                    />
                    <input 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      placeholder="Cargo/Role"
                      value={newContact.role}
                      onChange={e => setNewContact({...newContact, role: e.target.value})}
                    />
                    <div className="flex gap-2">
                       <button onClick={handleAddContact} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-[10px] font-black uppercase">Adicionar</button>
                       <button onClick={() => setIsAddingContact(false)} className="px-4 bg-slate-200 text-slate-600 py-2 rounded-xl text-[10px] font-black uppercase">X</button>
                    </div>
                 </div>
               )}

               <div className="space-y-4">
                  {companyContacts.map(contact => (
                    <div key={contact.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group relative hover:border-blue-200 transition-all">
                       <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1">{contact.name}</p>
                       <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight mb-3">{contact.role}</p>
                       <div className="flex flex-col gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                            <Phone size={10} /> {contact.phone || 'Sem telefone'}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                            <AtSign size={10} /> {contact.email || 'Sem e-mail'}
                          </div>
                       </div>
                       <button 
                        onClick={() => removeContact(contact.id)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                       >
                         <Trash2 size={12} />
                       </button>
                    </div>
                  ))}
                  {companyContacts.length === 0 && (
                    <div className="text-center py-8 text-slate-300 italic text-xs">Nenhum decisor cadastrado.</div>
                  )}
               </div>
            </div>
          </div>

          {/* Coluna de Oportunidades Relacionadas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-8">
                 <Briefcase size={16} /> Negócios Vinculados no Forecast
               </h3>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Conf.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {stats?.rows.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => onFilterByCompany(selectedCompany)}>
                          <td className="py-4 text-[11px] font-bold text-slate-600">{row['RESP.']}</td>
                          <td className="py-4">
                            <p className="text-[11px] font-black text-slate-900 uppercase truncate max-w-[200px]">{row.DESCRIPTION}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{row.SUPPLIER}</p>
                          </td>
                          <td className="py-4 text-right font-mono font-black text-slate-900 text-[11px]">
                            {row.AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="py-4 text-center">
                            <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-black">{row.Confidence}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
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
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ver Painel Consolidado</span>
                  <ChevronRight className="text-blue-600" size={18} />
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden animate-in fade-in duration-500">
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
