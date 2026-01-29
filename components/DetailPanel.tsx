
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
  Save, 
  Users, 
  Briefcase, 
  MapPin, 
  CheckSquare,
  TrendingUp,
  CheckCircle2,
  Building,
  FileCheck,
  Plus,
  Palette
} from 'lucide-react';
import { ForecastRow, SalesPersonProfile, User, Contact, PurchaseOrder, CONFIDENCE_MAPPING } from '../types';
import { storageService } from '../services/storageService';

interface DetailPanelProps {
  row: ForecastRow | null;
  onClose: () => void;
  profile: SalesPersonProfile;
  onUpdate: (updatedRow: ForecastRow) => void;
  user: User;
  contacts: Contact[];
}

const COLORS_PALETTE = [
  { name: 'Nenhuma', class: '', ring: 'ring-slate-200', bg: 'bg-white' },
  { name: 'Info', class: 'bg-blue-200', ring: 'ring-blue-500', bg: 'bg-blue-400' },
  { name: 'Sucesso', class: 'bg-green-200', ring: 'ring-green-500', bg: 'bg-green-400' },
  { name: 'Alerta', class: 'bg-yellow-200', ring: 'ring-yellow-500', bg: 'bg-yellow-400' },
  { name: 'Urgente', class: 'bg-red-200', ring: 'ring-red-500', bg: 'bg-red-400' },
  { name: 'Estratégico', class: 'bg-purple-200', ring: 'ring-purple-500', bg: 'bg-purple-400' },
  { name: 'Cinza', class: 'bg-[#D9D9D9]', ring: 'ring-slate-400', bg: 'bg-[#D9D9D9]' },
];

const DetailPanel: React.FC<DetailPanelProps> = ({ row, onClose, profile, onUpdate, user, contacts }) => {
  const [localRow, setLocalRow] = useState<ForecastRow | null>(null);
  const [saveStatus, setSaveStatus] = useState(false);
  const [isGeneratingPO, setIsGeneratingPO] = useState(false);

  // Form de PO
  const [poForm, setPoForm] = useState({
    poNumber: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    if (row) {
      setLocalRow(row);
      setPoForm({
        ...poForm,
        amount: row.AMOUNT,
        description: row.DESCRIPTION
      });
    }
  }, [row]);

  const availableContacts = useMemo(() => {
    if (!localRow) return [];
    return contacts.filter(c => c.companyName.toLowerCase() === localRow.CUSTOMER.toLowerCase());
  }, [contacts, localRow]);

  if (!localRow) return null;

  const handleChange = (field: keyof ForecastRow, value: any) => {
    setLocalRow({ ...localRow, [field]: value });
  };

  const handleSave = () => {
    onUpdate(localRow);
    setSaveStatus(true);
    setTimeout(() => {
      setSaveStatus(false);
      onClose();
    }, 1500);
  };

  const handleGeneratePO = () => {
    if (!poForm.poNumber || poForm.amount <= 0) {
      alert("Preencha o número do pedido e um valor válido.");
      return;
    }

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      forecastId: localRow.id,
      customer: localRow.CUSTOMER,
      supplier: localRow.SUPPLIER,
      budgetCode: localRow.budgetCode || 'N/A',
      poNumber: poForm.poNumber,
      amount: poForm.amount,
      date: poForm.date,
      description: poForm.description
    };

    const currentPOs = storageService.getPOs();
    storageService.savePOs([...currentPOs, newPO]);

    // Atualiza o Forecast se for fechamento total
    if (poForm.amount >= localRow.AMOUNT) {
      const updatedRow = { ...localRow, Confidence: 100 };
      onUpdate(updatedRow);
    } else {
      // Fechamento parcial: subtrai valor e mantém aberto?
      const updatedRow = { ...localRow, AMOUNT: localRow.AMOUNT - poForm.amount };
      onUpdate(updatedRow);
    }

    alert("Pedido registrado com sucesso! O valor foi somado à realização da meta.");
    setIsGeneratingPO(false);
    onClose();
  };

  const toggleMonth = (m: 'JAN' | 'FEV' | 'MAR' | '2026') => {
    handleChange(m, localRow[m] === 'x' ? '' : 'x');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[650px] bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] z-[150] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-500 overflow-hidden">
      
      {/* Header */}
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase">Forecast Detalhado</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase truncate">{localRow.CUSTOMER}</h2>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-all">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8 space-y-10 custom-scrollbar pb-32">
        
        {/* Seletor de Cor (Pintar Linha) */}
        <div className="p-6 bg-slate-100 border border-slate-200 rounded-[2.5rem] space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Palette size={16} className="text-slate-900" />
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Pintar Oportunidade (Destaque Visual)</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {COLORS_PALETTE.map((c) => (
              <button
                key={c.name}
                onClick={() => handleChange('color', c.class)}
                className={`w-12 h-12 rounded-full ${c.bg} border-2 border-white shadow-md transition-all relative ${
                  localRow.color === c.class ? `ring-4 ${c.ring} scale-110` : 'hover:scale-110 opacity-80 hover:opacity-100'
                }`}
                title={c.name}
              >
                {localRow.color === c.class && (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-900">
                    <Check size={20} strokeWidth={4} className={c.class.includes('bg-slate') || c.class === '' ? 'text-slate-900' : 'text-slate-800'} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Botão Principal de Conversão para Pedido */}
        {!isGeneratingPO ? (
          <button 
            onClick={() => setIsGeneratingPO(true)}
            className="w-full flex items-center justify-center gap-3 py-6 bg-green-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-green-100 hover:bg-slate-900 transition-all active:scale-95"
          >
            <FileCheck size={20} /> Gerar Pedido (PO) / Fechar Venda
          </button>
        ) : (
          <div className="bg-green-50 p-8 rounded-[2.5rem] border-2 border-green-200 space-y-6 animate-in zoom-in-95">
             <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-green-800 uppercase tracking-widest flex items-center gap-2">
                  <Plus size={16}/> Registro de Pedido
                </h3>
                <button onClick={() => setIsGeneratingPO(false)} className="text-green-600 hover:text-green-800 font-bold text-[10px] uppercase">Cancelar</button>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-green-700 uppercase px-1">Número do Pedido (PO)</label>
                   <input 
                    className="w-full p-3 bg-white border border-green-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-xs"
                    placeholder="PO-2026-XXXX"
                    value={poForm.poNumber}
                    onChange={e => setPoForm({...poForm, poNumber: e.target.value})}
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-green-700 uppercase px-1">Valor do Pedido (R$)</label>
                   <input 
                    type="number"
                    className="w-full p-3 bg-white border border-green-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-black text-xs"
                    value={poForm.amount}
                    onChange={e => setPoForm({...poForm, amount: parseFloat(e.target.value) || 0})}
                   />
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-[9px] font-black text-green-700 uppercase px-1">Data do Pedido</label>
                <input 
                  type="date"
                  className="w-full p-3 bg-white border border-green-200 rounded-xl outline-none font-bold text-xs"
                  value={poForm.date}
                  onChange={e => setPoForm({...poForm, date: e.target.value})}
                />
             </div>

             <button 
              onClick={handleGeneratePO}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-green-700 transition-all"
             >
               Confirmar e Faturar Meta
             </button>
             <p className="text-[9px] text-green-600 text-center font-bold italic">O valor será vinculado ao Orçamento: {localRow.budgetCode || 'Não definido'}</p>
          </div>
        )}

        <div className="space-y-10">
          
          <div className="grid grid-cols-2 gap-6">
            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <UserIcon size={12}/> Responsável
              </label>
              <input 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                value={localRow['RESP.']}
                onChange={e => handleChange('RESP.', e.target.value)}
              />
            </section>
            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <FileText size={12}/> Orçamento Ref.
              </label>
              <input 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-blue-600"
                placeholder="Nº Orçamento"
                value={localRow.budgetCode || ''}
                onChange={e => handleChange('budgetCode', e.target.value.toUpperCase())}
              />
            </section>
          </div>

          <section className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Building size={12}/> Cliente (CUSTOMER)
            </label>
            <input 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800"
              value={localRow.CUSTOMER}
              onChange={e => handleChange('CUSTOMER', e.target.value)}
            />
          </section>

          <section className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Briefcase size={12}/> Fornecedor (SUPPLIER)
            </label>
            <input 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800"
              value={localRow.SUPPLIER}
              onChange={e => handleChange('SUPPLIER', e.target.value)}
            />
          </section>

          <div className="grid grid-cols-2 gap-6">
            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <DollarSign size={12}/> Valor em Aberto
              </label>
              <input 
                type="number"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900"
                value={localRow.AMOUNT}
                onChange={e => handleChange('AMOUNT', parseFloat(e.target.value) || 0)}
              />
            </section>
            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <TrendingUp size={12}/> Confiança
              </label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase appearance-none"
                value={localRow.Confidence}
                onChange={e => handleChange('Confidence', parseInt(e.target.value))}
              >
                {[0, 10, 30, 50, 80, 90, 100].map(v => (
                  <option key={v} value={v}>
                    {v}% - {CONFIDENCE_MAPPING[v as keyof typeof CONFIDENCE_MAPPING]}
                  </option>
                ))}
              </select>
            </section>
          </div>

          <section className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Calendar size={12}/> Cronograma
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

          <section className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
               <Clock size={12}/> Follow-Up
             </label>
             <textarea 
                className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] h-40 outline-none font-medium text-sm italic focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                value={localRow['FOLLOW-UP']}
                onChange={e => handleChange('FOLLOW-UP', e.target.value)}
             />
          </section>
        </div>
      </div>

      <div className="p-8 border-t bg-slate-50/90 backdrop-blur-md flex items-center justify-between shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button onClick={onClose} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Descartar</button>
        <button 
          onClick={handleSave}
          className={`flex items-center gap-3 px-14 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${saveStatus ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
        >
          {saveStatus ? <CheckCircle2 size={18}/> : <Save size={18}/>}
          {saveStatus ? 'Atualizado' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
};

export default DetailPanel;
