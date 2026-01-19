
import React, { useMemo, useState } from 'react';
import { 
  Building2, 
  User, 
  Plus, 
  X, 
  Trash2, 
  Phone, 
  Mail, 
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { ForecastRow, Contact } from '../types';

interface CompaniesTabProps {
  data: ForecastRow[];
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  onFilterByCompany: (company: string) => void;
}

const CompaniesTab: React.FC<CompaniesTabProps> = ({ data, contacts, setContacts, onFilterByCompany }) => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({ name: '', role: '', phone: '', email: '' });

  const companyStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    data.forEach(r => {
      // Fix: Corrected property names from CLIENTE to CUSTOMER and VALOR to AMOUNT
      if (!map.has(r.CUSTOMER)) map.set(r.CUSTOMER, { count: 0, total: 0 });
      const entry = map.get(r.CUSTOMER)!;
      entry.count++;
      entry.total += r.AMOUNT;
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [data]);

  const addContact = () => {
    if (!selectedCompany || !newContact.name) return;
    const contact: Contact = {
      id: Date.now().toString(),
      companyName: selectedCompany,
      name: newContact.name,
      role: newContact.role || 'Sem Cargo',
      phone: newContact.phone || '',
      email: newContact.email || ''
    };
    setContacts([...contacts, contact]);
    setIsAddingContact(false);
    setNewContact({ name: '', role: '', phone: '', email: '' });
  };

  if (selectedCompany) {
    const companyContacts = contacts.filter(c => c.companyName === selectedCompany);
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <button onClick={() => setSelectedCompany(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-xs hover:text-blue-600 transition-all">
          <ChevronLeft size={16} /> Voltar para lista
        </button>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight">{selectedCompany}</h2>
              <p className="text-blue-400 font-bold mt-1 uppercase text-xs tracking-widest">Perfil da Empresa</p>
            </div>
            <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
              <Building2 size={40} />
            </div>
          </div>

          <div className="p-10 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <User size={18} className="text-blue-600"/> Contatos Cadastrados
              </h3>
              <button onClick={() => setIsAddingContact(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-blue-700 transition-all">
                <Plus size={16}/> ADICIONAR CONTATO
              </button>
            </div>

            {isAddingContact && (
              <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 space-y-4 animate-in zoom-in-95">
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Nome Completo" className="p-3 rounded-xl border outline-none" onChange={e => setNewContact({...newContact, name: e.target.value})} />
                  <input placeholder="Cargo" className="p-3 rounded-xl border outline-none" onChange={e => setNewContact({...newContact, role: e.target.value})} />
                  <input placeholder="Telefone" className="p-3 rounded-xl border outline-none" onChange={e => setNewContact({...newContact, phone: e.target.value})} />
                  <input placeholder="E-mail" className="p-3 rounded-xl border outline-none" onChange={e => setNewContact({...newContact, email: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setIsAddingContact(false)} className="text-slate-400 font-bold text-xs">CANCELAR</button>
                  <button onClick={addContact} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black">SALVAR CONTATO</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {companyContacts.map(c => (
                 <div key={c.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-blue-400 transition-all flex justify-between group">
                    <div className="space-y-1">
                      <p className="font-black text-slate-800 uppercase text-sm">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.role}</p>
                      <div className="flex gap-3 mt-4">
                        {c.phone && <Phone size={14} className="text-green-500" />}
                        {c.email && <Mail size={14} className="text-blue-500" />}
                      </div>
                    </div>
                    <button onClick={() => setContacts(contacts.filter(item => item.id !== c.id))} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                 </div>
               ))}
               {companyContacts.length === 0 && (
                 <p className="col-span-2 text-center py-20 text-slate-300 italic font-medium">Nenhum contato cadastrado para esta empresa.</p>
               )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {companyStats.map(([name, stats], i) => (
        <div key={i} onClick={() => setSelectedCompany(name)} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all cursor-pointer group">
           <div className="flex justify-between items-start mb-6">
             <div className="p-4 bg-slate-100 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 size={24}/></div>
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline</p>
                <p className="font-mono font-black text-slate-900 group-hover:text-blue-600">R$ {(stats.total/1000).toFixed(0)}k</p>
             </div>
           </div>
           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">{name}</h3>
           <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">{stats.count} Negócios</p>
           <div className="mt-6 pt-6 border-t flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ver Perfil Detalhado</span>
              <ExternalLink size={14} className="text-blue-600" />
           </div>
        </div>
      ))}
    </div>
  );
};

export default CompaniesTab;
