
import React, { useMemo, useState } from 'react';
import { 
  Building2, 
  MessageCircle, 
  Phone, 
  Mail, 
  ExternalLink,
  Share2,
  LayoutGrid,
  List as ListIcon,
  TrendingUp,
  User,
  Plus,
  X,
  Trash2
} from 'lucide-react';
import { ForecastRow, Contact } from '../types';

interface CompaniesTabProps {
  data: ForecastRow[];
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  onFilterByCompany: (company: string) => void;
}

const CompaniesTab: React.FC<CompaniesTabProps> = ({ data, contacts, setContacts, onFilterByCompany }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({ name: '', role: '', phone: '', email: '' });

  const companyStats = useMemo(() => {
    const map = new Map<string, { 
      name: string; 
      count: number; 
      total: number;
    }>();

    data.forEach(r => {
      if (!map.has(r.CUSTOMER)) {
        map.set(r.CUSTOMER, { name: r.CUSTOMER, count: 0, total: 0 });
      }
      const entry = map.get(r.CUSTOMER)!;
      entry.count++;
      entry.total += r.AMOUNT;
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [data]);

  const addContact = () => {
    if (!selectedCompany || !newContact.name) return;
    const contact: Contact = {
      id: Date.now().toString(),
      companyName: selectedCompany,
      name: newContact.name,
      role: newContact.role || '',
      phone: newContact.phone || '',
      email: newContact.email || ''
    };
    setContacts([...contacts, contact]);
    setIsAddingContact(false);
    setNewContact({ name: '', role: '', phone: '', email: '' });
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  if (selectedCompany) {
    const companyData = companyStats.find(c => c.name === selectedCompany);
    const companyContacts = contacts.filter(c => c.companyName === selectedCompany);
    const companyOpportunities = data.filter(r => r.CUSTOMER === selectedCompany);

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <button onClick={() => setSelectedCompany(null)} className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-slate-600 transition-all">
            <X size={16} /> Voltar para lista
          </button>
          <button onClick={() => onFilterByCompany(selectedCompany)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all">
            Ver Forecast
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-10 bg-slate-50 border-b border-slate-100 flex items-center gap-8">
             <div className="w-24 h-24 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center text-slate-300">
               <Building2 size={48} />
             </div>
             <div className="flex-1">
               <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{selectedCompany}</h2>
               <div className="flex gap-4 mt-2">
                 <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{companyData?.count} Oportunidades</span>
                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{companyData?.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em Pipeline</span>
               </div>
             </div>
          </div>

          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contacts Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <User size={16} /> Contatos da Empresa
                </h3>
                <button onClick={() => setIsAddingContact(true)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  <Plus size={16} />
                </button>
              </div>

              {isAddingContact && (
                <div className="p-6 bg-slate-50 rounded-2xl border border-blue-100 space-y-4 animate-in zoom-in duration-300">
                  <input placeholder="Nome" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm" onChange={e => setNewContact({...newContact, name: e.target.value})} />
                  <input placeholder="Cargo" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm" onChange={e => setNewContact({...newContact, role: e.target.value})} />
                  <input placeholder="Telefone" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm" onChange={e => setNewContact({...newContact, phone: e.target.value})} />
                  <div className="flex gap-2">
                    <button onClick={() => setIsAddingContact(false)} className="flex-1 py-2 text-xs font-bold text-slate-400">Cancelar</button>
                    <button onClick={addContact} className="flex-2 py-2 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md">Adicionar</button>
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-[400px] overflow-auto custom-scrollbar pr-2">
                {companyContacts.map(c => (
                  <div key={c.id} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all flex justify-between items-start group shadow-sm">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.role}</p>
                      <div className="flex gap-3 mt-2">
                        {c.phone && <button className="text-green-500 hover:scale-110 transition-transform"><Phone size={14}/></button>}
                        {c.email && <button className="text-blue-500 hover:scale-110 transition-transform"><Mail size={14}/></button>}
                        <button className="text-green-600 hover:scale-110 transition-transform"><MessageCircle size={14}/></button>
                      </div>
                    </div>
                    <button onClick={() => removeContact(c.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {companyContacts.length === 0 && !isAddingContact && (
                   <p className="text-center py-10 text-slate-300 italic text-sm border-2 border-dashed border-slate-100 rounded-2xl">Nenhum contato adicionado.</p>
                )}
              </div>
            </div>

            {/* Opportunities Summary */}
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={16} /> Projetos Recentes
              </h3>
              <div className="space-y-3">
                {companyOpportunities.slice(0, 5).map(opp => (
                  <div key={opp.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{opp.DESCRIPTION}</p>
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-0.5">{opp.Confidence}% Confiança</p>
                    </div>
                    <span className="font-mono font-black text-xs text-slate-900 whitespace-nowrap ml-4">
                      {opp.AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{companyStats.length} Clientes Identificados</span>
        <div className="flex p-1 bg-slate-200/50 rounded-lg border border-slate-200">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <LayoutGrid size={14} /> Cards
          </button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <ListIcon size={14} /> Lista
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {companyStats.map((company, i) => (
            <div key={i} onClick={() => setSelectedCompany(company.name)} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:border-blue-400 hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-pointer">
              <div className="p-8 border-b border-slate-50">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <Building2 size={28} />
                </div>
                <div className="mt-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">{company.name}</h3>
                  <p className="text-[10px] text-blue-600 mt-1 uppercase tracking-[0.2em] font-black">{company.count} Negócios Ativos</p>
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-50/50 flex justify-between items-center">
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pipeline Total</p>
                   <p className="font-black text-slate-800 text-lg">{company.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600 group-hover:scale-110 transition-all">
                  <TrendingUp size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-black text-slate-400 uppercase tracking-widest text-[10px]">
              <tr>
                <th className="p-6">Empresa</th>
                <th className="p-6 text-center">Negócios</th>
                <th className="p-6 text-right">Pipeline</th>
                <th className="p-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companyStats.map((company, i) => (
                <tr key={i} onClick={() => setSelectedCompany(company.name)} className="hover:bg-blue-50/50 group transition-colors cursor-pointer">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <Building2 className="text-slate-300 group-hover:text-blue-600" size={20} />
                      <span className="font-black text-slate-800 uppercase text-xs tracking-tight">{company.name}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 group-hover:bg-blue-600 group-hover:text-white">{company.count}</span>
                  </td>
                  <td className="p-6 text-right font-mono font-black text-slate-900 group-hover:text-blue-600">
                    {company.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="p-6 text-right">
                     <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-300 group-hover:text-blue-600 group-hover:border-blue-200 transition-all"><ExternalLink size={18}/></button>
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
