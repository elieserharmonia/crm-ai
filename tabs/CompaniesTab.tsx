
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Plus, 
  X, 
  Trash2, 
  Phone, 
  Mail, 
  ExternalLink,
  ChevronLeft,
  FileText,
  MapPin,
  ShieldCheck,
  UserCheck
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
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({ name: '', role: '', phone: '', email: '' });

  // Reset view when resetTrigger changes (sidebar click logic)
  useEffect(() => {
    setSelectedCompany(null);
  }, [resetTrigger]);

  const companyStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number; rows: ForecastRow[] }>();
    data.forEach(r => {
      if (!map.has(r.CUSTOMER)) map.set(r.CUSTOMER, { count: 0, total: 0, rows: [] });
      const entry = map.get(r.CUSTOMER)!;
      entry.count++;
      entry.total += r.AMOUNT;
      entry.rows.push(r);
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
    const companyData = companyStats.find(([name]) => name === selectedCompany)?.[1];
    const representative = companyData?.rows[0]?.['RESP.'] || 'Não definido';
    
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
        <button onClick={() => setSelectedCompany(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-xs hover:text-blue-600 transition-all">
          <ChevronLeft size={16} /> Voltar para lista
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] text-white p-10 shadow-2xl overflow-hidden relative border border-slate-800">
               <div className="relative z-10 space-y-6">
                  <div className="p-5 bg-white/10 rounded-3xl w-fit backdrop-blur-md">
                    <Building2 size={42} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight leading-tight">{selectedCompany}</h2>
                    <p className="text-blue-400 font-bold mt-1 uppercase text-xs tracking-widest">Unidade Fabril / Montadora</p>
                  </div>
                  <div className="pt-6 border-t border-white/10 space-y-4">
                     <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pipeline Total</p>
                       <p className="text-2xl font-black font-mono">
                         {companyData?.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                       </p>
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Oportunidades Ativas</p>
                       <p className="text-xl font-black">{companyData?.count}</p>
                     </div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>

            {/* Contacts Mini Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={16} /> Contatos
                </h3>
                <button onClick={() => setIsAddingContact(true)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all">
                  <Plus size={16}/>
                </button>
              </div>

              {isAddingContact && (
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3 animate-in zoom-in-95">
                  <input placeholder="Nome" className="w-full p-2.5 text-xs rounded-xl border outline-none" onChange={e => setNewContact({...newContact, name: e.target.value})} />
                  <input placeholder="Cargo" className="w-full p-2.5 text-xs rounded-xl border outline-none" onChange={e => setNewContact({...newContact, role: e.target.value})} />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAddingContact(false)} className="text-[10px] font-black text-slate-400">CANCELAR</button>
                    <button onClick={addContact} className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black">SALVAR</button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                 {companyContacts.map(c => (
                   <div key={c.id} className="flex justify-between items-center group">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase">{c.role}</p>
                      </div>
                      <button onClick={() => setContacts(contacts.filter(item => item.id !== c.id))} className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                   </div>
                 ))}
                 {companyContacts.length === 0 && (
                   <p className="text-[11px] text-slate-300 italic">Sem contatos registrados.</p>
                 )}
              </div>
            </div>
          </div>

          {/* Registration Details Form-like Layout */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
               <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                 <FileText size={20} className="text-blue-600" />
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Dados Cadastrais e Segmentação</h3>
               </div>
               
               <div className="p-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                   {/* Column 1 */}
                   <div className="space-y-8">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ</label>
                        <p className="text-sm font-bold text-slate-900 font-mono">11.123.456/0001-99</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ 2 (Bruto)</label>
                        <p className="text-sm font-bold text-slate-900 font-mono">11123456000199</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inscrição Estadual (IE)</label>
                        <p className="text-sm font-bold text-slate-900 font-mono">123456789123</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente (Razão Social)</label>
                        <p className="text-sm font-black text-slate-900 uppercase">{selectedCompany}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apelido</label>
                        <p className="text-sm font-bold text-blue-600 uppercase font-mono tracking-tighter">CAT</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><UserCheck size={12}/> Vendedor Responsável</label>
                        <p className="text-sm font-black text-slate-900 uppercase">ELIESER FERNANDES</p>
                      </div>
                   </div>

                   {/* Column 2 */}
                   <div className="space-y-8">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={12}/> Endereço</label>
                        <p className="text-sm font-medium text-slate-700">RUA 10, 123 - MUNDO NOVO</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CEP</label>
                          <p className="text-sm font-bold text-slate-900 font-mono">14001-000</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade</label>
                          <p className="text-sm font-bold text-slate-900 uppercase">PIRACICABA</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</label>
                          <p className="text-sm font-bold text-slate-900 uppercase">SP</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regiões</label>
                          <p className="text-sm font-bold text-blue-600 uppercase font-black">SPI</p>
                        </div>
                      </div>
                      <div className="space-y-1 pt-4 border-t border-slate-50">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={12}/> Segmento da Conta</label>
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-black rounded-lg uppercase border border-slate-200">
                          MONTADORA AUTOMOTIVO
                        </span>
                      </div>
                   </div>
                 </div>
               </div>
            </div>

            {/* Opportunities List Mini Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
               <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Oportunidades em Aberto</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-xs">
                   <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px] border-b">
                     <tr>
                       <th className="p-6">Fornecedor</th>
                       <th className="p-6">Valor</th>
                       <th className="p-6">Confiança</th>
                       <th className="p-6">Ação</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {companyData?.rows.map(r => (
                       <tr key={r.id} className="hover:bg-slate-50 transition-all">
                         <td className="p-6 font-bold text-slate-900">{r.SUPPLIER}</td>
                         <td className="p-6 font-mono font-bold text-slate-700">{r.AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                         <td className="p-6"><span className="px-2 py-0.5 bg-slate-900 text-white rounded-full text-[9px] font-black">{r.Confidence}%</span></td>
                         <td className="p-6">
                            <button onClick={() => onFilterByCompany(selectedCompany)} className="text-blue-600 hover:underline font-black uppercase text-[10px]">Ver Detalhes</button>
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
      {companyStats.map(([name, stats], i) => (
        <div key={i} onClick={() => setSelectedCompany(name)} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all cursor-pointer group flex flex-col justify-between h-72">
           <div>
              <div className="flex justify-between items-start mb-6">
                <div className="p-5 bg-slate-100 rounded-3xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><Building2 size={28}/></div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pipeline</p>
                    <p className="font-mono font-black text-slate-900 group-hover:text-blue-600 text-lg">R$ {(stats.total/1000).toFixed(0)}k</p>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate mb-1">{name}</h3>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{stats.count} Negócios Ativos</p>
           </div>
           
           <div className="pt-6 border-t flex justify-between items-center opacity-40 group-hover:opacity-100 transition-all">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Visualizar Perfil Completo</span>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-all">
                <ChevronLeft className="rotate-180 text-slate-400 group-hover:text-blue-600" size={16} />
              </div>
           </div>
        </div>
      ))}
      
      {companyStats.length === 0 && (
        <div className="col-span-full py-40 text-center space-y-4">
           <Building2 size={64} className="mx-auto text-slate-100" />
           <p className="text-slate-400 font-bold">Nenhuma empresa encontrada nos dados importados.</p>
        </div>
      )}
    </div>
  );
};

export default CompaniesTab;
