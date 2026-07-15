import type { UseFormRegister, FieldErrors } from 'react-hook-form';

interface Seccion1Props {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export default function Seccion1({ register, errors }: Seccion1Props) {
  const preguntas = [
    {
      id: 'sec1_q1',
      title: '1.1. Constitución Formal',
      text: '¿Cuenta con una Resolución Administrativa Interna vigente de conformación del CVEH?',
    },
    {
      id: 'sec1_q2',
      title: '1.2. Liderazgo Técnico',
      text: '¿El Epidemiólogo del hospital (o Responsable de Vigilancia) coordina, dirige y firma formalmente las acciones del comité?',
    },
    {
      id: 'sec1_q3',
      title: '1.3. Periodicidad de Reuniones',
      text: '¿Existen actas firmadas que demuestren reuniones ordinarias mensuales y extraordinarias ante brotes o alertas?',
    },
    {
      id: 'sec1_q4',
      title: '1.4. Plan de Acción',
      text: '¿Existe un Plan Operativo Anual (POA) del CVEH debidamente aprobado por la Dirección Médica?',
    },
    {
      id: 'sec1_q5',
      title: '1.5. Difusión de Información',
      text: '¿El CVEH emite y difunde de forma regular boletines o reportes de la situación epidemiológica a las jefaturas?',
    }
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-800">
          I. CONFORMACIÓN DEL COMITÉ DE VIGILANCIA EPIDEMIOLÓGICA HOSPITALARIA (CVEH)
        </h2>
        <p className="text-slate-500 mt-2">
          Responda a cada uno de los criterios. El puntaje máximo de esta sección es de 10 puntos.
        </p>
      </div>

      <div className="space-y-6">
        {preguntas.map((q) => (
          <div key={q.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-teal-300 transition-colors">
            <h3 className="font-bold text-teal-800 text-lg mb-1">{q.title}</h3>
            <p className="text-slate-700 font-medium mb-4">{q.text}</p>
            
            <div className="flex space-x-8">
              {[2, 1, 0].map((val) => (
                <label key={val} className="flex items-center space-x-3 cursor-pointer group bg-white px-5 py-3 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm transition-all">
                  <input 
                    type="radio" 
                    value={val}
                    className={`w-5 h-5 border-slate-300 cursor-pointer ${
                      val === 2 ? 'text-teal-600 focus:ring-teal-500' :
                      val === 1 ? 'text-amber-500 focus:ring-amber-500' :
                      'text-red-500 focus:ring-red-500'
                    }`}
                    {...register(`seccion_1_respuestas.${q.id}`, { required: 'Seleccione un valor' })}
                  />
                  <span className={`text-xl font-black transition-colors ${
                    val === 2 ? 'text-teal-600 group-hover:text-teal-500' :
                    val === 1 ? 'text-amber-500 group-hover:text-amber-400' :
                    'text-red-500 group-hover:text-red-400'
                  }`}>
                    {val}
                  </span>
                </label>
              ))}
            </div>
            
            {/* Si hay error de validación */}
            {errors?.seccion_1_respuestas && (errors.seccion_1_respuestas as any)[q.id] && (
              <p className="mt-2 text-sm font-bold text-red-500">
                ⚠️ {(errors.seccion_1_respuestas as any)[q.id]?.message}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
