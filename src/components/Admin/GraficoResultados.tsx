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
