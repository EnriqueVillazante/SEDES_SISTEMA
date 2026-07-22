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

interface GraficoResultadosProps {
  evaluacion: any;
}

export default function GraficoResultados({ evaluacion }: GraficoResultadosProps) {

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
      link.download = `Reporte_Sec1_${filename}.png`;
      link.href = url;
      link.click();
      toast.success('Gráfico descargado exitosamente');
    } catch (e) {
      toast.error('Error al descargar el gráfico');
    } finally {
      setIsDownloading(false);
    }
  };
  // Obtenemos los puntajes de la Sección 1 (max 2 por cada una)
  const respuestas = evaluacion.seccion_1_respuestas || {};
  
  const getPuntaje = (id: string) => {
    const val = parseInt(respuestas[id], 10);
    return isNaN(val) ? 0 : val;
  };

  const data = [
    { area: '1.1 Constitución', puntaje: getPuntaje('sec1_q1') },
    { area: '1.2 Liderazgo', puntaje: getPuntaje('sec1_q2') },
    { area: '1.3 Reuniones', puntaje: getPuntaje('sec1_q3') },
    { area: '1.4 Plan de Acción', puntaje: getPuntaje('sec1_q4') },
    { area: '1.5 Difusión', puntaje: getPuntaje('sec1_q5') },
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
          Maduración Gerencial del Sub Sistema de Vigilancia Epidemiológica
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
            stroke="#4682B4" 
            strokeWidth={1.5}
            fill="transparent" 
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
