import type { UseFormRegister, FieldErrors } from 'react-hook-form';

interface Seccion3Props {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export default function Seccion3({ register, errors }: Seccion3Props) {
  const parte1Residuos = [
    { id: 'sec3_res_1', text: '1.1. Planificación: Existe un Plan de Manejo de Residuos Hospitalarios institucional documentado, actualizado y en ejecución.' },
    { id: 'sec3_res_2', text: '1.2. Clasificación en Origen: Se evidencia la separación estricta de residuos en los tres colores normativos (Rojo: Bioinfecciosos, Azul: Especiales, Negro: Comunes).' },
    { id: 'sec3_res_3', text: '1.3. Ruta de Transporte Interno: Existen horarios fijos, rutas definidas de menor flujo de pacientes y carros de transporte exclusivos y señalizados.' },
    { id: 'sec3_res_4', text: '1.4. Almacenamiento Temporal y Final: El hospital cuenta con un centro de acopio final techado, limpio, seguro, cerrado bajo llave y con punto de agua para lavado.' },
    { id: 'sec3_res_5', text: '1.5. Registro de Generación: Se lleva un registro diario y por turnos del peso (en kg) de residuos bioinfecciosos generados por cada servicio.' },
    { id: 'sec3_res_6', text: '1.6. Elementos de Protección (EPP): El personal de limpieza y recolección utiliza el EPP completo y específico (guantes de nitrilo caña larga, botas, delantal grueso, barbijo).' },
    { id: 'sec3_res_7', text: '1.7. Disposición Final Externa: Se cuenta con contrato o convenio vigente con la empresa/entidad municipal de aseo para el recojo y tratamiento especializado.' },
  ];

  const parte2Bioseguridad = [
    { id: 'sec3_bio_1', text: '2.1. Manual de Bioseguridad: El establecimiento cuenta con un Manual de Bioseguridad adaptado a su nivel de complejidad y socializado formalmente.' },
    { id: 'sec3_bio_2', text: '2.2. Disponibilidad de Insumos: Se constata el abastecimiento continuo (cero desabastecimiento) de jabón líquido, alcohol en gel, toallas de papel y EPP en áreas críticas.' },
    { id: 'sec3_bio_3', text: '2.3. Calidad del Agua: Se cuenta con reportes de control de cloro residual del agua corriente y cultivos bacteriológicos periódicos de tanques de almacenamiento.' },
    { id: 'sec3_bio_4', text: '2.4. Higiene de Alimentos: Existe un cronograma ejecutado de control de plagas (desinsectación/desratización) y exámenes médicos regulares al personal de cocina.' },
    { id: 'sec3_bio_5', text: '2.5. Limpieza de Superficies: Se aplican protocolos validados de limpieza y desinfección ambiental diaria y terminal, supervisados por enfermería.' },
    { id: 'sec3_bio_6', text: '2.6. Salud e Inmunización del Personal: Se cuenta con un registro actualizado de la cobertura de vacunación activa del personal expuesto (Hepatitis B, Influenza, Tétanos).' },
    { id: 'sec3_bio_7', text: '2.7. Accidentes Laborales: Existe un protocolo activo y registro confidencial de notificación e intervención inmediata ante accidentes punzocortantes o fluidos.' },
  ];

  const parte3IAAS = [
    { id: 'sec3_iaas_1', text: '3.1. Fichas de Notificación: Se llenan adecuadamente y de forma exhaustiva las fichas epidemiológicas específicas ante la sospecha o confirmación de una IAAS.' },
    { id: 'sec3_iaas_2', text: '3.2. Monitoreo de Indicadores: El subcomité calcula mensualmente las tasas de densidad de incidencia de IAAS (NAV por días/ventilador, ITU por días/sonda, etc.).' },
    { id: 'sec3_iaas_3', text: '3.3. Higiene de Manos: Se realizan evaluaciones de adherencia a la técnica de los 5 momentos del lavado de manos en el personal médico y de enfermería.' },
    { id: 'sec3_iaas_4', text: '3.4. Prevención Proactiva (Bundles): Se supervisa y registra el cumplimiento de los paquetes de medidas preventivas para la inserción y mantenimiento de dispositivos invasivos.' },
    { id: 'sec3_iaas_5', text: '3.5. Notificación de RAM: Se cuenta con disponibilidad física o digital de formularios oficiales de notificación de Reacciones Adversas a Medicamentos (RAM).' },
    { id: 'sec3_iaas_6', text: '3.6. Flujo de Reporte RAM: Las sospechas de RAM severas o inesperadas se reportan al Responsable de Farmacovigilancia del hospital en los plazos normados.' },
    { id: 'sec3_iaas_7', text: '3.7. Política de Antimicrobianos: El hospital cuenta con una guía de uso racional de antibióticos y un sistema de restricción/justificación para antibióticos de reserva.' },
    { id: 'sec3_iaas_8', text: '3.8. Monitoreo de Consumo: Se realiza el seguimiento cuantitativo del consumo de antibióticos de alto impacto mediante la metodología de Dosis Diaria Definida (DDD).' },
    { id: 'sec3_iaas_9', text: '3.9. Perfil de Resistencia (Mapeo): El laboratorio de bacteriología emite, actualiza y socializa el mapa microbiológico hospitalario y su perfil de sensibilidad antimicrobiana al menos una vez al año (basado en mínimo 30 aislamientos por especie).' },
  ];

  const parte4CAI = [
    { id: 'sec3_cai_1', text: '4.1. Regularidad: Se reúne de forma mensual ordinaria y de manera extraordinaria e inmediata ante la detección de brotes o alertas epidemiológicas.' },
    { id: 'sec3_cai_2', text: '4.2. Quórum: Las reuniones oficiales cuentan con la asistencia y firma de más del 50% de sus miembros oficiales (Dirección, Epidemiología, Jefaturas Médicas y Enfermería).' },
    { id: 'sec3_cai_3', text: '4.3. Control de Actas: Cada sesión genera un acta formal estructurada que detalla compromisos, tareas específicas y responsables con plazos fijos de entrega.' },
    { id: 'sec3_cai_4', text: '4.4. Calidad del Dato: El subcomité audita y verifica activamente la consistencia, claridad y exhaustividad de las fichas epidemiológicas recibidas de los servicios.' },
    { id: 'sec3_cai_5', text: '4.5. Análisis Clínico Integrado: Evalúa de forma cruzada las tasas de infecciones asociadas a la atención en salud (IAAS) junto con la mortalidad hospitalaria del periodo.' },
    { id: 'sec3_cai_6', text: '4.6. Identificación de Alertas: Detecta oportunamente incrementos inusuales de casos (clústers) o canales endémicos elevados para enfermedades de notificación obligatoria.' },
    { id: 'sec3_cai_7', text: '4.7. Boletín Epidemiológico: Emite de manera regular reportes resumidos o boletines informativos epidemiológicos con periodicidad mensual o trimestral.' },
    { id: 'sec3_cai_8', text: '4.8. Toma de Decisiones: Las recomendaciones y conclusiones plasmadas en las actas se traducen en planes de mejora u órdenes de servicio ejecutadas en los pisos.' },
    { id: 'sec3_cai_9', text: '4.9. Difusión Interna: Comparte de manera abierta y transparente los resultados de los análisis con todas las jefaturas médicas, de enfermería y áreas de apoyo.' },
    { id: 'sec3_cai_10', text: '4.10. Cumplimiento de Plazos: Envía las notificaciones de enfermedades obligatorias y consolidados mensuales a los niveles superiores (Sedes / Ministerio) en el tiempo normado.' },
  ];

  const renderRadios = (id: string, groupKey: string = 'seccion_3_respuestas') => (
    <div className="flex space-x-8 mt-4">
      {[2, 1, 0].map((val) => (
        <label key={`${id}-${val}`} className="flex items-center space-x-3 cursor-pointer group bg-white px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm transition-all">
          <input 
            type="radio" 
            value={val}
            className={`w-5 h-5 border-slate-300 cursor-pointer ${
              val === 2 ? 'text-teal-600 focus:ring-teal-500' :
              val === 1 ? 'text-amber-500 focus:ring-amber-500' :
              'text-red-500 focus:ring-red-500'
            }`}
            {...register(`${groupKey}.${id}`, { required: 'Seleccione un valor' })}
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
  );

  return (
    <div className="space-y-10">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-800">
          III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES
        </h2>
        <p className="text-slate-500 mt-2">
          Esta sección evalúa el trabajo operativo en terreno de cada uno de los 4 subcomités.
        </p>
      </div>

      {/* Parte 1: Residuos */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h3 className="text-xl font-bold text-teal-800">
            1. Subcomité de Vigilancia del Manejo de Residuos Hospitalarios
          </h3>
        </div>
        
        <div className="space-y-6">
          {parte1Residuos.map((q) => (
            <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-slate-700 font-medium">{q.text}</p>
              {renderRadios(q.id)}
              {errors?.seccion_3_respuestas && (errors.seccion_3_respuestas as any)[q.id] && (
                <p className="mt-2 text-sm font-bold text-red-500">
                  ⚠️ {(errors.seccion_3_respuestas as any)[q.id]?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Parte 2: Bioseguridad */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm mt-8">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h3 className="text-xl font-bold text-teal-800">
            2. Subcomité de Bioseguridad
          </h3>
        </div>
        
        <div className="space-y-6">
          {parte2Bioseguridad.map((q) => (
            <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-slate-700 font-medium">{q.text}</p>
              {renderRadios(q.id)}
              {errors?.seccion_3_respuestas && (errors.seccion_3_respuestas as any)[q.id] && (
                <p className="mt-2 text-sm font-bold text-red-500">
                  ⚠️ {(errors.seccion_3_respuestas as any)[q.id]?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Parte 3: IAAS */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm mt-8">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h3 className="text-xl font-bold text-teal-800">
            3. Subcomité de Prevención y Control de IAAS y Resistencia Antimicrobiana (RAM)
          </h3>
        </div>
        
        <div className="space-y-6">
          {parte3IAAS.map((q) => (
            <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-slate-700 font-medium">{q.text}</p>
              {renderRadios(q.id)}
              {errors?.seccion_3_respuestas && (errors.seccion_3_respuestas as any)[q.id] && (
                <p className="mt-2 text-sm font-bold text-red-500">
                  ⚠️ {(errors.seccion_3_respuestas as any)[q.id]?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Parte 4: CAI */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm mt-8">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h3 className="text-xl font-bold text-teal-800">
            4. Subcomité de Análisis de Información (CAI)
          </h3>
        </div>
        
        <div className="space-y-6">
          {parte4CAI.map((q) => (
            <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-slate-700 font-medium">{q.text}</p>
              {renderRadios(q.id)}
              {errors?.seccion_3_respuestas && (errors.seccion_3_respuestas as any)[q.id] && (
                <p className="mt-2 text-sm font-bold text-red-500">
                  ⚠️ {(errors.seccion_3_respuestas as any)[q.id]?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
