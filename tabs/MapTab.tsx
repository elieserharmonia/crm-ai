
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, Sparkles, Map as MapIcon, ExternalLink, Compass } from 'lucide-react';
import { ForecastRow, SalesPersonProfile } from '../types';
import { geminiService } from '../services/geminiService';

interface MapTabProps {
  data: ForecastRow[];
}

const MapTab: React.FC<MapTabProps> = ({ data }) => {
  const [planning, setPlanning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Permissão de localização negada")
      );
    }
  }, []);

  const generateMapPlan = async () => {
    setIsLoading(true);
    try {
      const result = await geminiService.planVisitsWithMaps(data, userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : undefined);
      setPlanning(result);
    } catch (error) {
      alert("Erro ao planejar rota.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border-4 border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
            <Compass size={48} className="text-white" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <h2 className="text-3xl font-black tracking-tight">Logística e Visitas</h2>
            <p className="text-slate-400 max-w-lg leading-relaxed font-medium">
              A IA analisa a localização das sedes das montadoras (Caterpillar, John Deere, etc.) e sugere o melhor roteiro saindo de sua posição atual.
            </p>
            <button 
              onClick={generateMapPlan}
              disabled={isLoading || data.length === 0}
              className="mt-4 flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all disabled:opacity-50 shadow-xl"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <MapIcon size={20} />}
              PLANEJAR ROTEIRO DE VIAGEM
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      {!planning && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white p-8 rounded-3xl border border-slate-200 flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Navigation size={24}/></div>
              <div>
                <h4 className="font-bold text-slate-800">Geolocalização Inteligente</h4>
                <p className="text-sm text-slate-500 mt-1">Identificamos os clusters de clientes por UF para otimizar seus custos de deslocamento.</p>
              </div>
           </div>
           <div className="bg-white p-8 rounded-3xl border border-slate-200 flex items-start gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl"><MapPin size={24}/></div>
              <div>
                <h4 className="font-bold text-slate-800">Links Diretos</h4>
                <p className="text-sm text-slate-500 mt-1">Ao gerar o roteiro, você terá botões para abrir cada destino diretamente no seu GPS.</p>
              </div>
           </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-slate-500 font-bold animate-pulse">Calculando distâncias e localizando unidades fabris...</p>
        </div>
      )}

      {planning && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
            <Sparkles className="text-blue-600" />
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Roteiro Sugerido pela IA</h3>
          </div>
          <div className="p-10">
             <div className="prose prose-slate max-w-none text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
               {planning}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapTab;
