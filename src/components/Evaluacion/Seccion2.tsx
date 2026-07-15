import type { UseFormRegister, FieldErrors } from 'react-hook-form';

interface Seccion2Props {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export default function Seccion2({ register, errors }: Seccion2Props) {
  const subcomites = [
    { id: 'residuos', title: '1. Residuos Hospitalarios' },
    { id: 'bioseguridad', title: '2. Bioseguridad' },
    { id: 'iaas', title: '3. Infecciones Asociadas a la Atención en Salud (IAAS)' },
    { id: 'cai', title: '4. Análisis de la Información (CAI)' }
  ];

  return (
    <div className="space-y-10">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-800">
          II. CONFORMACIÓN DE LOS 4 SUBCOMITÉS OPERATIVOS
        </h2>
        <p className="text-slate-500 mt-2">
          Califique la conformación y regularidad de sesiones para cada subcomité. El puntaje máximo de esta sección es de 16 puntos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {subcomites.map((sub) => (
          <div key={sub.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-teal-300 transition-colors shadow-sm">
            <h3 className="font-extrabold text-teal-800 text-xl mb-6 pb-2 border-b border-teal-100">{sub.title}</h3>
            
            {/* Pregunta 1: Conformación */}
            <div className="mb-6">
              <p className="text-slate-700 font-bold mb-3">Conformado Formalmente:</p>
              <div className="flex flex-wrap gap-2 sm:gap-6">
                {[2, 1, 0].map((val) => (
                  <label key={`conf-${sub.id}-${val}`} className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start space-x-3 cursor-pointer group bg-white px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm transition-all">
                    <input 
                      type="radio" 
                      value={val}
                      className={`w-5 h-5 border-slate-300 cursor-pointer ${
                        val === 2 ? 'text-teal-600 focus:ring-teal-500' :
                        val === 1 ? 'text-amber-500 focus:ring-amber-500' :
                        'text-red-500 focus:ring-red-500'
                      }`}
                      {...register(`seccion_2_respuestas.${sub.id}_conformado`, { required: 'Seleccione un valor' })}
                    />
                    <span className={`text-lg font-black transition-colors ${
                      val === 2 ? 'text-teal-600 group-hover:text-teal-500' :
                      val === 1 ? 'text-amber-500 group-hover:text-amber-400' :
                      'text-red-500 group-hover:text-red-400'
                    }`}>
                      {val}
                    </span>
                  </label>
                ))}
              </div>
              {errors?.seccion_2_respuestas && (errors.seccion_2_respuestas as any)[`${sub.id}_conformado`] && (
                <p className="mt-2 text-sm font-bold text-red-500">
                  ⚠️ {(errors.seccion_2_respuestas as any)[`${sub.id}_conformado`]?.message}
                </p>
              )}
            </div>

            {/* Pregunta 2: Sesiones */}
            <div className="mb-6">
              <p className="text-slate-700 font-bold mb-3">Sesiona de forma Regular:</p>
              <div className="flex flex-wrap gap-2 sm:gap-6">
                {[2, 1, 0].map((val) => (
                  <label key={`ses-${sub.id}-${val}`} className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start space-x-3 cursor-pointer group bg-white px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm transition-all">
                    <input 
                      type="radio" 
                      value={val}
                      className={`w-5 h-5 border-slate-300 cursor-pointer ${
                        val === 2 ? 'text-teal-600 focus:ring-teal-500' :
                        val === 1 ? 'text-amber-500 focus:ring-amber-500' :
                        'text-red-500 focus:ring-red-500'
                      }`}
                      {...register(`seccion_2_respuestas.${sub.id}_sesiona`, { required: 'Seleccione un valor' })}
                    />
                    <span className={`text-lg font-black transition-colors ${
                      val === 2 ? 'text-teal-600 group-hover:text-teal-500' :
                      val === 1 ? 'text-amber-500 group-hover:text-amber-400' :
                      'text-red-500 group-hover:text-red-400'
                    }`}>
                      {val}
                    </span>
                  </label>
                ))}
              </div>
              {errors?.seccion_2_respuestas && (errors.seccion_2_respuestas as any)[`${sub.id}_sesiona`] && (
                <p className="mt-2 text-sm font-bold text-red-500">
                  ⚠️ {(errors.seccion_2_respuestas as any)[`${sub.id}_sesiona`]?.message}
                </p>
              )}
            </div>

            {/* Pregunta 3: Liderazgo (Texto) */}
            <div>
              <label className="block text-slate-700 font-bold mb-2">
                ¿Quién lidera el subcomité? (Cargo de integrantes y Actas):
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 bg-white p-3 text-slate-700 outline-none transition-all"
                placeholder="Escriba los detalles aquí..."
                {...register(`seccion_2_respuestas.${sub.id}_liderazgo`, { required: 'Este campo es obligatorio' })}
              />
              {errors?.seccion_2_respuestas && (errors.seccion_2_respuestas as any)[`${sub.id}_liderazgo`] && (
                <p className="mt-1 text-sm font-bold text-red-500">
                  ⚠️ {(errors.seccion_2_respuestas as any)[`${sub.id}_liderazgo`]?.message}
                </p>
              )}
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
