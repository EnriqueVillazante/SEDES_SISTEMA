import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface GraficoSeccion3Props {
  evaluacion: any;
  subcomite: 'residuos' | 'bioseguridad' | 'iaas' | 'cai';
}

export default function GraficoSeccion3({ evaluacion, subcomite }: GraficoSeccion3Props) {
  const respuestas = evaluacion.seccion_3_respuestas || {};
  
  const getPuntaje = (id: string) => {
    const val = parseInt(respuestas[id], 10);
    return isNaN(val) ? 0 : val;
  };

  const getSubcomiteConfig = () => {
    switch (subcomite) {
      case 'residuos':
        return {
          titulo: '1. Residuos Hospitalarios',
          color: '#f59e0b', // Amber 500
          data: [
            { area: 'Planificación', puntaje: getPuntaje('sec3_res_1') },
            { area: 'Clasificación', puntaje: getPuntaje('sec3_res_2') },
            { area: 'Ruta Int.', puntaje: getPuntaje('sec3_res_3') },
            { area: 'Almacenamiento', puntaje: getPuntaje('sec3_res_4') },
            { area: 'Registro', puntaje: getPuntaje('sec3_res_5') },
            { area: 'EPP', puntaje: getPuntaje('sec3_res_6') },
            { area: 'Disposición', puntaje: getPuntaje('sec3_res_7') },
          ]
        };
      case 'bioseguridad':
        return {
          titulo: '2. Bioseguridad',
          color: '#10b981', // Emerald 500
          data: [
            { area: 'Manual', puntaje: getPuntaje('sec3_bio_1') },
            { area: 'Insumos', puntaje: getPuntaje('sec3_bio_2') },
            { area: 'Agua', puntaje: getPuntaje('sec3_bio_3') },
            { area: 'Alimentos', puntaje: getPuntaje('sec3_bio_4') },
            { area: 'Superficies', puntaje: getPuntaje('sec3_bio_5') },
            { area: 'Inmunización', puntaje: getPuntaje('sec3_bio_6') },
            { area: 'Accidentes', puntaje: getPuntaje('sec3_bio_7') },
          ]
        };
      case 'iaas':
        return {
          titulo: '3. IAAS y RAM',
          color: '#ef4444', // Red 500
          data: [
            { area: 'Fichas', puntaje: getPuntaje('sec3_iaas_1') },
            { area: 'Monitoreo', puntaje: getPuntaje('sec3_iaas_2') },
            { area: 'Manos', puntaje: getPuntaje('sec3_iaas_3') },
            { area: 'Bundles', puntaje: getPuntaje('sec3_iaas_4') },
            { area: 'Notific. RAM', puntaje: getPuntaje('sec3_iaas_5') },
            { area: 'Flujo RAM', puntaje: getPuntaje('sec3_iaas_6') },
            { area: 'Polít. Antibio.', puntaje: getPuntaje('sec3_iaas_7') },
            { area: 'Monitoreo DDD', puntaje: getPuntaje('sec3_iaas_8') },
            { area: 'Perfil RAM', puntaje: getPuntaje('sec3_iaas_9') },
          ]
        };
      case 'cai':
        return {
          titulo: '4. Análisis (CAI)',
          color: '#8b5cf6', // Violet 500
          data: [
            { area: 'Regularidad', puntaje: getPuntaje('sec3_cai_1') },
            { area: 'Quórum', puntaje: getPuntaje('sec3_cai_2') },
            { area: 'Actas', puntaje: getPuntaje('sec3_cai_3') },
            { area: 'Calidad Dato', puntaje: getPuntaje('sec3_cai_4') },
            { area: 'Análisis Int.', puntaje: getPuntaje('sec3_cai_5') },
            { area: 'Alertas', puntaje: getPuntaje('sec3_cai_6') },
            { area: 'Boletín', puntaje: getPuntaje('sec3_cai_7') },
            { area: 'Decisiones', puntaje: getPuntaje('sec3_cai_8') },
            { area: 'Difusión', puntaje: getPuntaje('sec3_cai_9') },
            { area: 'Plazos', puntaje: getPuntaje('sec3_cai_10') },
          ]
        };
      default:
        return { titulo: '', color: '#000', data: [] };
    }
  };

  const config = getSubcomiteConfig();

  return (
    <div className="w-full h-[500px] bg-white p-6 flex flex-col items-center rounded-xl shadow-sm border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Evaluación de Funciones: {config.titulo}
        </h2>
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mt-1">
          {evaluacion.establecimiento_salud || 'Establecimiento'}
        </h3>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={config.data}>
          
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
            stroke={config.color}
            strokeWidth={1.5}
            fill="transparent" 
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
