import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface GraficoSeccion2Props {
  evaluacion: any;
}

export default function GraficoSeccion2({ evaluacion }: GraficoSeccion2Props) {

  const chartRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    try {
      setIsDownloading(true);
      const url = await toPng(chartRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      const filename = evaluacion.establecimiento_salud 
        ? evaluacion.establecimiento_salud.replace(/\s+/g, '_') 
        : 'Establecimiento';
      link.download = `Reporte_Sec2_${filename}.png`;
      link.href = url;
      link.click();
      toast.success('Gráfico descargado exitosamente');
    } catch (e) {
      toast.error('Error al descargar el gráfico');
    } finally {
      setIsDownloading(false);
    }
  };
  const respuestas = evaluacion.seccion_2_respuestas || {};
  
  const getPuntaje = (id: string) => {
    const val = parseInt(respuestas[id], 10);
    return isNaN(val) ? 0 : val;
  };

  const data = [
    { area: 'Residuos (Conf.)', puntaje: getPuntaje('residuos_conformado') },
    { area: 'Residuos (Ses.)', puntaje: getPuntaje('residuos_sesiona') },
    { area: 'Bioseguridad (Conf.)', puntaje: getPuntaje('bioseguridad_conformado') },
    { area: 'Bioseguridad (Ses.)', puntaje: getPuntaje('bioseguridad_sesiona') },
    { area: 'IAAS (Conf.)', puntaje: getPuntaje('iaas_conformado') },
    { area: 'IAAS (Ses.)', puntaje: getPuntaje('iaas_sesiona') },
    { area: 'CAI (Conf.)', puntaje: getPuntaje('cai_conformado') },
    { area: 'CAI (Ses.)', puntaje: getPuntaje('cai_sesiona') },
  ];

  return (
    <div ref={chartRef} className="w-full h-[500px] bg-white p-6 flex flex-col items-center rounded-xl shadow-sm border border-slate-200 relative">

      <button 
        onClick={handleDownload}
        disabled={isDownloading}
        className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-teal-50 text-slate-500 hover:text-teal-600 rounded-lg transition-colors border border-slate-200 flex items-center justify-center shadow-sm z-10"
        title="Descargar como imagen"
      >
        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </button>
      <div className="text-center mb-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Conformación y Regularidad de Subcomités
        </h2>
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mt-1">
          {evaluacion.establecimiento_salud || 'Establecimiento'}
        </h3>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          
          <PolarGrid gridType="circle" stroke="#e5e7eb" />
          
          <PolarAngleAxis 
            dataKey="area" 
            tick={{ fill: '#374151', fontSize: 11 }} 
          />
          
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 2]} 
            tickCount={3} 
            tick={{ fill: '#4b5563', fontSize: 10 }}
            axisLine={false} 
          />
          
          <Tooltip 
            formatter={(value) => [`${value} pts`, 'Puntaje']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          
          <Radar 
            name="Puntaje Obtenido" 
            dataKey="puntaje" 
            stroke="#10b981" // Emerald 500 para diferenciarlo de la Seccion 1
            strokeWidth={1.5}
            fill="transparent" 
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
