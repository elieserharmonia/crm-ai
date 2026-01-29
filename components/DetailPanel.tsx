
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
  UserPlus
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
  const [diaryLink, setDiaryLink] = useState('');
  const [saveStatus, setSaveStatus] = useState(false);

  useEffect(() => {
    if (row) {
      setDiaryLink(storageService.getDiaryLink(row.CUSTOMER));
    }
  }, [row]);

  // Filtra os contatos disponíveis para esta empresa específica
  const availableContacts = useMemo(() => {
    if (!row) return [];
    return contacts.filter(c => c.companyName.toLowerCase() === row.CUSTOMER.toLowerCase());
  }, [contacts, row]);

  if (!row) return null;

  const isManager = user.role === 'gestor';
  const rowResp = String(row['RESP.'] || '').toUpperCase().trim();
  const currentUserName = String(user.name || '').toUpperCase().trim();
  const canEdit = isManager || !row['RESP.'] || rowResp.includes(currentUserName) || currentUserName.includes(rowResp);

  const handleChange = (field: keyof ForecastRow, value: any) => {
    if (!canEdit) return;
    onUpdate({ ...row, [field]: value });
  };

  const handleSaveDiaryLink = () => {
    storageService.saveDiaryLink(row.CUSTOMER, diaryLink);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const toggleContactSelection = (contactName: string) => {
    if (!canEdit) return;
    
    const currentContacts = row.CONTATOS ? row.CONTATOS.split(',').map(c => c.trim()).filter(Boolean) : [];
    let updatedContacts: string[];

    if (currentContacts.includes(contactName)) {
      updatedContacts = currentContacts.filter(c => c !== contactName);
    } else {
      updatedContacts = [...currentContacts, contactName];
    }

    handleChange('CONTATOS', updatedContacts.join(', '));
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[650px] bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] z-[150] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-500 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase">OPPORTUNITY</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase truncate">{row.CUSTOMER}</h2>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm">
          <X size={24} />
        </button>
      </div>

      <div className="flex p-2 bg-slate-100/50 gap-2 mx-6 my-6 rounded-2xl border border-slate-200/50">
        <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase bg-white text-blue-600 shadow-xl">
          <FileText size={16}/> DETALHES DA OPORTUNIDADE
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 space-y-10 custom-scrollbar pb-32">
        <div className="space-y-10 animate-in fade-in duration-300">
          
          {/* Nova Seção: Seleção de Contatos Responsáveis (Baseado na imagem enviada) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14}/> Selecionar Contatos da Empresa
              </h3>
              <span className="text-[9px] font-bold text-blue-500 uppercase">Multi-Seleção Ativa</span>
            </div>

            {availableContacts.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {availableContacts.map(contact => {
                  const isSelected = row.CONTATOS?.includes(contact.name);
                  return (
                    <button
                      key={contact.id}
                      onClick={() => toggleContactSelection(contact.name)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                        isSelected 
                        ? 'bg-blue-600 border-blue-700 text-white shadow-lg' 
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500' : 'bg-white shadow-sm'}`}>
                          <UserIcon size={14} className={isSelected ? 'text-white' : 'text-slate-400'} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight leading-none">{contact.name}</p>
                          <p className={`text-[9px] mt-1 font-bold uppercase ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {contact.role}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check size={16} strokeWidth={4} />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center space-y-2">
                <UserPlus size={24} className="mx-auto text-slate-200" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Nenhum contato cadastrado para esta empresa.</p>
                <p className="text-[9px] text-slate-300">Vá na aba "Empresas" para adicionar decisores.</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Texto Final (Campo CONTATOS)</label>
              <input 
                type="text"
                disabled={!canEdit}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 text-xs"
                value={row.CONTATOS || ''}
                onChange={e => handleChange('CONTATOS', e.target.value)}
              />
            </div>
          </section>

          <section className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <LinkIcon size={14}/> Link do Diário OneDrive
              </h3>
              {saveStatus && <span className="text-[9px] font-bold text-green-600 uppercase animate-in fade-in">Link Atualizado!</span>}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                <input 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-blue-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-[10px] text-slate-600"
                  placeholder="URL de compartilhamento do OneDrive..."
                  value={diaryLink}
                  onChange={e => setDiaryLink(e.target.value)}
                />
              </div>
              <button 
                onClick={handleSaveDiaryLink}
                className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-md active:scale-95"
              >
                <Save size={18} />
              </button>
            </div>
            <p className="text-[9px] text-blue-400 font-bold uppercase tracking-tight italic pl-1">
              Dica: Use o link de compartilhamento com permissão de edição.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14}/> DESCRIÇÃO DO NEGÓCIO
            </h3>
            <textarea 
              disabled={!canEdit}
              className={`w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-32 outline-none font-bold text-sm leading-relaxed transition-all ${canEdit ? 'focus:bg-white focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`}
              value={row.DESCRIPTION}
              onChange={e => handleChange('DESCRIPTION', e.target.value)}
            />
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DADOS FINANCEIROS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">VALOR ESTIMADO</p>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">R$</span>
                  <input 
                    type="number"
                    disabled={!canEdit}
                    value={row.AMOUNT}
                    onChange={e => handleChange('AMOUNT', parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-black text-xl outline-none text-slate-900 font-mono"
                  />
                </div>
              </div>
              <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">CONFIANÇA %</p>
                <select 
                  disabled={!canEdit}
                  value={row.Confidence} 
                  onChange={e => handleChange('Confidence', Number(e.target.value))}
                  className="w-full bg-transparent font-black text-xl outline-none appearance-none cursor-pointer text-slate-900"
                >
                  {[0, 10, 30, 50, 80, 90, 100].map(v => <option key={v} value={v}>{v}%</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Clock size={14}/> FOLLOW-UP (HISTÓRICO)
             </h3>
             <textarea 
                disabled={!canEdit}
                className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] h-56 outline-none font-medium text-sm italic leading-relaxed"
                value={row['FOLLOW-UP']}
                onChange={e => handleChange('FOLLOW-UP', e.target.value)}
             />
          </section>
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;
