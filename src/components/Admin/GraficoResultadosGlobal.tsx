import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface GraficoResultadosGlobalProps {
  evaluacion: any;
}

export default function GraficoResultadosGlobal({ evaluacion }: GraficoResultadosGlobalProps) {
  const calcPorcentaje = (obtenido: number, maximo: number) => {
    if (!obtenido) return 0;
    return Math.round((obtenido / maximo) * 100);
  };

  const data = [
    { area: 'I. Comité (CVEH)', porcentaje: calcPorcentaje(evaluacion.puntaje_sec_1, 10) },
    { area: 'II. Subcomités', porcentaje: calcPorcentaje(evaluacion.puntaje_sec_2, 16) },
    { area: 'III. Residuos', porcentaje: calcPorcentaje(evaluacion.puntaje_sec_3_residuos, 14) },
    { area: 'III. Bioseguridad', porcentaje: calcPorcentaje(evaluacion.puntaje_sec_3_bioseguridad, 14) },
    { area: 'III. IAAS y RAM', porcentaje: calcPorcentaje(evaluacion.puntaje_sec_3_iaas, 18) },
    { area: 'III. Análisis (CAI)', porcentaje: calcPorcentaje(evaluacion.puntaje_sec_3_cai, 20) },
  ];

  return (
    <div className="w-full h-[500px] bg-white p-6 flex flex-col items-center rounded-xl shadow-sm border border-slate-200">
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
            domain={[0, 100]} 
            tickCount={6} 
            tick={{ fill: '#4b5563', fontSize: 10 }}
            axisLine={false} 
          />
          
          <Tooltip 
            formatter={(value) => [`${value}% de cumplimiento`, 'Desempeño']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          
          <Radar 
            name="Desempeño Global" 
            dataKey="porcentaje" 
            stroke="#2563eb" 
            strokeWidth={1.5}
            fill="#3b82f6" 
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
