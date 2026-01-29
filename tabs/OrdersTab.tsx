
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  FileCheck, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  Building, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { PurchaseOrder } from '../types';
import { storageService } from '../services/storageService';

interface OrdersTabProps {
  pos: PurchaseOrder[];
  setPos: (pos: PurchaseOrder[]) => void;
}

const OrdersTab: React.FC<OrdersTabProps> = ({ pos, setPos }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPos = useMemo(() => {
    return pos.filter(p => 
      [p.customer, p.supplier, p.poNumber, p.budgetCode]
        .some(val => val.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [pos, searchTerm]);

  const totalClosed = useMemo(() => {
    return pos.reduce((acc, p) => acc + p.amount, 0);
  }, [pos]);

  const removePO = (id: string) => {
    if (confirm("Deseja realmente excluir este registro de pedido? Isso afetará a realização da meta.")) {
      const updated = pos.filter(p => p.id !== id);
      setPos(updated);
      storageService.savePOs(updated);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestão de Pedidos (POs)</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Controle de faturamento e fechamentos reais</p>
        </div>
        
        <div className="flex bg-slate-900 text-white px-8 py-4 rounded-[1.8rem] shadow-2xl items-center gap-6">
           <div className="text-right">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Faturado 2026</p>
              <p className="text-xl font-mono font-black">R$ {totalClosed.toLocaleString('pt-BR')}</p>
           </div>
           <div className="p-3 bg-blue-600 rounded-xl"><FileCheck size={24}/></div>
        </div>
      </div>

      <div className="flex items-center gap-4 max-w-xl">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por Cliente, PO ou Orçamento..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none shadow-sm focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-xs uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredPos.map(order => (
          <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 hover:border-blue-500 transition-all shadow-sm group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <FileText size={24} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Pedido: {order.poNumber}</p>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{order.customer}</h3>
                 </div>
              </div>
              <button 
                onClick={() => removePO(order.id)}
                className="p-3 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 rounded-xl"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Fornecedor</p>
                  <p className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-2">
                    <Briefcase size={12}/> {order.supplier}
                  </p>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Orçamento Ref.</p>
                  <p className="text-[11px] font-black text-slate-700 uppercase">{order.budgetCode}</p>
               </div>
            </div>

            <div className="flex justify-between items-end pt-6 border-t border-slate-100">
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Data do Fechamento</p>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Calendar size={14} className="text-blue-600"/> {new Date(order.date).toLocaleDateString()}
                  </p>
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-black text-green-600 uppercase mb-1">Valor do Pedido</p>
                  <p className="text-2xl font-mono font-black text-slate-900">
                    R$ {order.amount.toLocaleString('pt-BR')}
                  </p>
               </div>
            </div>
            
            {order.description && (
              <div className="mt-6 p-4 bg-blue-50/30 rounded-2xl border border-blue-50 text-[10px] font-medium italic text-slate-500 leading-relaxed">
                "{order.description}"
              </div>
            )}
          </div>
        ))}

        {filteredPos.length === 0 && (
          <div className="col-span-full py-32 bg-white border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 gap-6">
            <FileCheck size={64} className="opacity-10" />
            <div className="text-center space-y-2">
              <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">Nenhum Pedido Registrado</p>
              <p className="text-sm max-w-[300px] mx-auto text-slate-400 font-medium">Os pedidos aparecerão aqui assim que você realizar o fechamento no Forecast.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTab;
