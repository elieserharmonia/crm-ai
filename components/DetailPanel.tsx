import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  FileText, 
  Clock, 
  Calendar, 
  Check, 
  User as UserIcon, 
  DollarSign, 
  AlertTriangle, 
  Link as LinkIcon, 
  Globe, 
  Save, 
  Users, 
  UserPlus, 
  Briefcase, 
  MapPin, 
  CheckSquare,
  TrendingUp,
  CheckCircle2,
  Building
} from 'lucide-react';
import { ForecastRow, SalesPersonProfile, User, Contact } from '../types';
import { storageService } from '../services/storageService';

interface DetailPanelProps {
  row: ForecastRow | null;
  onClose: () => void;
  profile: SalesPersonProfile;
  onUpdate: (updatedRow: ForecastRow) => void;
  user: User;
  contacts: Contact[];
}

const DetailPanel: React.FC<DetailPanelProps> = ({ row, onClose, profile, onUpdate, user, contacts }) => {
  const [localRow, setLocalRow] = useState<ForecastRow | null>(null);
  const [diaryLink, setDiaryLink] = useState('');
  const [saveStatus, setSaveStatus] = useState(false);

  useEffect(() => {
    if (row) {
      setLocalRow(row);
      setDiaryLink(storageService.getDiaryLink(row.CUSTOMER));
    }
  }, [row]);

  const availableContacts = useMemo(() => {
    if (!localRow) return [];
    return contacts.filter(c => c.companyName.toLowerCase() === localRow.CUSTOMER.toLowerCase());
  }, [contacts, localRow]);

  if (!localRow) return null;

  const isManager = user.role === 'gestor';
  const canEdit = isManager || true; 

  const handleChange = (field: keyof ForecastRow, value: any) => {
    setLocalRow({ ...localRow, [field]: value });
  };

  const handleSave = () => {
    onUpdate(localRow);
    storageService.saveDiaryLink(localRow.CUSTOMER, diaryLink);
    setSaveStatus(true);
    setTimeout(() => {
      setSaveStatus(false);
      onClose();
    }, 1500);
  };

  const toggleMonth = (m: 'JAN' | 'FEV' | 'MAR' | '2026') => {
    handleChange(m, localRow[m] === 'x' ? '' : 'x');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[650px] bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] z-[150] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-500 overflow-hidden">
      {/* Header Fixo */}
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase">DETALHES DA OPORTUNIDADE</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase truncate">{localRow.CUSTOMER}</h2>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-all">
          <X size={24} />
        </button>
      </div>

      {/* Área de Scroll - Conteúdo seguindo ordem exata do Forecast */}
      <div className="flex-1 overflow-auto p-8 space-y-10 custom-scrollbar pb-32">
        <div className="space-y-10">
          
          {/* 1. RESPONSÁVEL (RESP.) */}
          <section className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <UserIcon size={12}/> Responsável (RESP.)
            </label>
            <input 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
              value={localRow['RESP.']}
              onChange={e => handleChange('RESP.', e.target.value)}
            />
          </section>

          {/* 2. CLIENTE (CUSTOMER) */}
          <section className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              {/* Fix: Added Building icon import in lucide-react */}
              <Building size={12}/> Cliente (CUSTOMER)
            </label>
            <input 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
              value={localRow.CUSTOMER}
              onChange={e => handleChange('CUSTOMER', e.target.value)}
            />
          </section>

          {/* 3. FORNECEDOR (SUPPLIER) */}
          <section className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Briefcase size={12}/> Fornecedor (SUPPLIER)
            </label>
            <input 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
              value={localRow.SUPPLIER}
              onChange={e => handleChange('SUPPLIER', e.target.value)}
            />
          </section>

          {/* 4. DESCRIÇÃO (DESCRIPTION) */}
          <section className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <FileText size={12}/> Descrição do Negócio (DESCRIPTION)
            </label>
            <textarea 
              className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-32 outline-none font-bold text-sm leading-relaxed focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
              value={localRow.DESCRIPTION}
              onChange={e => handleChange('DESCRIPTION', e.target.value)}
            />
          </section>

          {/* 5. FINANCEIRO E UF */}
          <div className="grid grid-cols-2 gap-6">
            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <DollarSign size={12}/> Valor (AMOUNT)
              </label>
              <input 
                type="number"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-slate-900"
                value={localRow.AMOUNT}
                onChange={e => handleChange('AMOUNT', parseFloat(e.target.value) || 0)}
              />
            </section>
            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <MapPin size={12}/> Estado (UF)
              </label>
              <input 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-center"
                value={localRow.UF}
                onChange={e => handleChange('UF', e.target.value.toUpperCase())}
              />
            </section>
          </div>

          {/* 6. CONFIANÇA */}
          <section className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <TrendingUp size={12}/> Confiança (Confidence)
            </label>
            <div className="flex bg-slate-50 p-2 rounded-[1.5rem] border border-slate-200 gap-1 overflow-x-auto custom-scrollbar">
              {[0, 10, 30, 50, 80, 90, 100].map(v => (
                <button
                  key={v}
                  onClick={() => handleChange('Confidence', v)}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${localRow.Confidence === v ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200'}`}
                >
                  {v}%
                </button>
              ))}
            </div>
          </section>

          {/* 7. CRONOGRAMA */}
          <section className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Calendar size={12}/> Planejamento (JAN - 2026)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['JAN', 'FEV', 'MAR', '2026'].map(m => (
                <button
                  key={m}
                  onClick={() => toggleMonth(m as any)}
                  className={`py-4 rounded-2xl border font-black text-[10px] transition-all flex flex-col items-center gap-1 ${localRow[m as keyof ForecastRow] === 'x' ? 'bg-blue-600 border-blue-700 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                >
                  <span>{m}</span>
                  {localRow[m as keyof ForecastRow] === 'x' ? <CheckSquare size={12}/> : <div className="w-3 h-3 border-2 border-slate-200 rounded"/>}
                </button>
              ))}
            </div>
          </section>

          {/* 8. FOLLOW-UP */}
          <section className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
               <Clock size={12}/> Follow-Up (Histórico)
             </label>
             <textarea 
                className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] h-56 outline-none font-medium text-sm italic leading-relaxed focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                value={localRow['FOLLOW-UP']}
                onChange={e => handleChange('FOLLOW-UP', e.target.value)}
             />
          </section>

          {/* 9. CONTATOS */}
          <section className="space-y-4 pt-4 border-t border-slate-100 pb-10">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14}/> Seleção de Contatos
              </h3>
              <span className="text-[9px] font-bold text-blue-500 uppercase">Vinculado a {localRow.CUSTOMER}</span>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
              {availableContacts.map(contact => {
                const isSelected = localRow.CONTATOS?.includes(contact.name);
                return (
                  <button
                    key={contact.id}
                    onClick={() => {
                      const current = localRow.CONTATOS ? localRow.CONTATOS.split(', ').filter(Boolean) : [];
                      const next = isSelected ? current.filter(c => c !== contact.name) : [...current, contact.name];
                      handleChange('CONTATOS', next.join(', '));
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-transparent text-slate-500'}`}
                  >
                    <span className="text-[10px] font-black uppercase">{contact.name}</span>
                    {isSelected && <Check size={12} strokeWidth={4} />}
                  </button>
                );
              })}
              {availableContacts.length === 0 && (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-[10px] font-bold text-slate-400 uppercase">Nenhum contato cadastrado para este cliente.</div>
              )}
            </div>
            <input 
                type="text"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 text-xs"
                placeholder="Nomes dos contatos..."
                value={localRow.CONTATOS || ''}
                onChange={e => handleChange('CONTATOS', e.target.value)}
              />
          </section>
        </div>
      </div>

      {/* Footer com Botão de Salvar (Obrigatório) */}
      <div className="p-8 border-t bg-slate-50/90 backdrop-blur-md flex items-center justify-between shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={onClose}
          className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
        >
          Descartar
        </button>
        <button 
          onClick={handleSave}
          className={`flex items-center gap-3 px-14 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${saveStatus ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
        >
          {saveStatus ? <CheckCircle2 size={18}/> : <Save size={18}/>}
          {saveStatus ? 'Alterações Salvas' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
};

export default DetailPanel;