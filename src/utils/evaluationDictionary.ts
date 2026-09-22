export interface EvaluationQuestion {
  id: string;
  sectionId: string;
  sectionTitle: string;
  subSectionId?: string;
  subSectionTitle?: string;
  title?: string;
  text: string;
}

export const EVALUATION_DICTIONARY: EvaluationQuestion[] = [
  // SECCIÓN 1
  {
    id: 'sec1_q1',
    sectionId: 'seccion_1_respuestas',
    sectionTitle: 'I. CONFORMACIÓN DEL COMITÉ DE VIGILANCIA EPIDEMIOLÓGICA HOSPITALARIA (CVEH)',
    title: '1.1. Constitución Formal',
    text: '¿Cuenta con una Resolución Administrativa Interna vigente de conformación del CVEH?',
  },
  {
    id: 'sec1_q2',
    sectionId: 'seccion_1_respuestas',
    sectionTitle: 'I. CONFORMACIÓN DEL COMITÉ DE VIGILANCIA EPIDEMIOLÓGICA HOSPITALARIA (CVEH)',
    title: '1.2. Liderazgo Técnico',
    text: '¿El Epidemiólogo del hospital (o Responsable de Vigilancia) coordina, dirige y firma formalmente las acciones del comité?',
  },
  {
    id: 'sec1_q3',
    sectionId: 'seccion_1_respuestas',
    sectionTitle: 'I. CONFORMACIÓN DEL COMITÉ DE VIGILANCIA EPIDEMIOLÓGICA HOSPITALARIA (CVEH)',
    title: '1.3. Periodicidad de Reuniones',
    text: '¿Existen actas firmadas que demuestren reuniones ordinarias mensuales y extraordinarias ante brotes o alertas?',
  },
  {
    id: 'sec1_q4',
    sectionId: 'seccion_1_respuestas',
    sectionTitle: 'I. CONFORMACIÓN DEL COMITÉ DE VIGILANCIA EPIDEMIOLÓGICA HOSPITALARIA (CVEH)',
    title: '1.4. Plan de Acción',
    text: '¿Existe un Plan Operativo Anual (POA) del CVEH debidamente aprobado por la Dirección Médica?',
  },
  {
    id: 'sec1_q5',
    sectionId: 'seccion_1_respuestas',
    sectionTitle: 'I. CONFORMACIÓN DEL COMITÉ DE VIGILANCIA EPIDEMIOLÓGICA HOSPITALARIA (CVEH)',
    title: '1.5. Difusión de Información',
    text: '¿El CVEH emite y difunde de forma regular boletines o reportes de la situación epidemiológica a las jefaturas?',
  },
  
  // SECCIÓN 2
  // Residuos
  {
    id: 'residuos_conformado',
    sectionId: 'seccion_2_respuestas',
    sectionTitle: 'II. CONFORMACIÓN DE LOS 4 SUBCOMITÉS OPERATIVOS',
    subSectionId: 'residuos',
    subSectionTitle: '1. Residuos Hospitalarios',
    title: 'Conformado Formalmente',
    text: '¿El subcomité de Residuos Hospitalarios está conformado formalmente?',
  },
  {
    id: 'residuos_sesiona',
    sectionId: 'seccion_2_respuestas',
    sectionTitle: 'II. CONFORMACIÓN DE LOS 4 SUBCOMITÉS OPERATIVOS',
    subSectionId: 'residuos',
    subSectionTitle: '1. Residuos Hospitalarios',
    title: 'Sesiona de forma Regular',
    text: '¿El subcomité de Residuos Hospitalarios sesiona de forma regular?',
  },
  // Bioseguridad
  {
    id: 'bioseguridad_conformado',
    sectionId: 'seccion_2_respuestas',
    sectionTitle: 'II. CONFORMACIÓN DE LOS 4 SUBCOMITÉS OPERATIVOS',
    subSectionId: 'bioseguridad',
    subSectionTitle: '2. Bioseguridad',
    title: 'Conformado Formalmente',
    text: '¿El subcomité de Bioseguridad está conformado formalmente?',
  },
  {
    id: 'bioseguridad_sesiona',
    sectionId: 'seccion_2_respuestas',
    sectionTitle: 'II. CONFORMACIÓN DE LOS 4 SUBCOMITÉS OPERATIVOS',
    subSectionId: 'bioseguridad',
    subSectionTitle: '2. Bioseguridad',
    title: 'Sesiona de forma Regular',
    text: '¿El subcomité de Bioseguridad sesiona de forma regular?',
  },
  // IAAS
  {
    id: 'iaas_conformado',
    sectionId: 'seccion_2_respuestas',
    sectionTitle: 'II. CONFORMACIÓN DE LOS 4 SUBCOMITÉS OPERATIVOS',
    subSectionId: 'iaas',
    subSectionTitle: '3. Infecciones Asociadas a la Atención en Salud (IAAS)',
    title: 'Conformado Formalmente',
    text: '¿El subcomité de IAAS está conformado formalmente?',
  },
  {
    id: 'iaas_sesiona',
    sectionId: 'seccion_2_respuestas',
    sectionTitle: 'II. CONFORMACIÓN DE LOS 4 SUBCOMITÉS OPERATIVOS',
    subSectionId: 'iaas',
    subSectionTitle: '3. Infecciones Asociadas a la Atención en Salud (IAAS)',
    title: 'Sesiona de forma Regular',
    text: '¿El subcomité de IAAS sesiona de forma regular?',
  },
  // CAI
  {
    id: 'cai_conformado',
    sectionId: 'seccion_2_respuestas',
    sectionTitle: 'II. CONFORMACIÓN DE LOS 4 SUBCOMITÉS OPERATIVOS',
    subSectionId: 'cai',
    subSectionTitle: '4. Análisis de la Información (CAI)',
    title: 'Conformado Formalmente',
    text: '¿El subcomité de CAI está conformado formalmente?',
  },
  {
    id: 'cai_sesiona',
    sectionId: 'seccion_2_respuestas',
    sectionTitle: 'II. CONFORMACIÓN DE LOS 4 SUBCOMITÉS OPERATIVOS',
    subSectionId: 'cai',
    subSectionTitle: '4. Análisis de la Información (CAI)',
    title: 'Sesiona de forma Regular',
    text: '¿El subcomité de CAI sesiona de forma regular?',
  },

  // SECCIÓN 3
  // Parte 1 Residuos
  {
    id: 'sec3_res_1',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'residuos',
    subSectionTitle: '1. Subcomité de Vigilancia del Manejo de Residuos Hospitalarios',
    text: '1.1. Planificación: Existe un Plan de Manejo de Residuos Hospitalarios institucional documentado, actualizado y en ejecución.'
  },
  {
    id: 'sec3_res_2',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'residuos',
    subSectionTitle: '1. Subcomité de Vigilancia del Manejo de Residuos Hospitalarios',
    text: '1.2. Clasificación en Origen: Se evidencia la separación estricta de residuos en los tres colores normativos (Rojo: Bioinfecciosos, Azul: Especiales, Negro: Comunes).'
  },
  {
    id: 'sec3_res_3',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'residuos',
    subSectionTitle: '1. Subcomité de Vigilancia del Manejo de Residuos Hospitalarios',
    text: '1.3. Ruta de Transporte Interno: Existen horarios fijos, rutas definidas de menor flujo de pacientes y carros de transporte exclusivos y señalizados.'
  },
  {
    id: 'sec3_res_4',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'residuos',
    subSectionTitle: '1. Subcomité de Vigilancia del Manejo de Residuos Hospitalarios',
    text: '1.4. Almacenamiento Temporal y Final: El hospital cuenta con un centro de acopio final techado, limpio, seguro, cerrado bajo llave y con punto de agua para lavado.'
  },
  {
    id: 'sec3_res_5',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'residuos',
    subSectionTitle: '1. Subcomité de Vigilancia del Manejo de Residuos Hospitalarios',
    text: '1.5. Registro de Generación: Se lleva un registro diario y por turnos del peso (en kg) de residuos bioinfecciosos generados por cada servicio.'
  },
  {
    id: 'sec3_res_6',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'residuos',
    subSectionTitle: '1. Subcomité de Vigilancia del Manejo de Residuos Hospitalarios',
    text: '1.6. Elementos de Protección (EPP): El personal de limpieza y recolección utiliza el EPP completo y específico (guantes de nitrilo caña larga, botas, delantal grueso, barbijo).'
  },
  {
    id: 'sec3_res_7',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'residuos',
    subSectionTitle: '1. Subcomité de Vigilancia del Manejo de Residuos Hospitalarios',
    text: '1.7. Disposición Final Externa: Se cuenta con contrato o convenio vigente con la empresa/entidad municipal de aseo para el recojo y tratamiento especializado.'
  },

  // Parte 2 Bioseguridad
  {
    id: 'sec3_bio_1',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'bioseguridad',
    subSectionTitle: '2. Subcomité de Bioseguridad',
    text: '2.1. Manual de Bioseguridad: El establecimiento cuenta con un Manual de Bioseguridad adaptado a su nivel de complejidad y socializado formalmente.'
  },
  {
    id: 'sec3_bio_2',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'bioseguridad',
    subSectionTitle: '2. Subcomité de Bioseguridad',
    text: '2.2. Disponibilidad de Insumos: Se constata el abastecimiento continuo (cero desabastecimiento) de jabón líquido, alcohol en gel, toallas de papel y EPP en áreas críticas.'
  },
  {
    id: 'sec3_bio_3',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'bioseguridad',
    subSectionTitle: '2. Subcomité de Bioseguridad',
    text: '2.3. Calidad del Agua: Se cuenta con reportes de control de cloro residual del agua corriente y cultivos bacteriológicos periódicos de tanques de almacenamiento.'
  },
  {
    id: 'sec3_bio_4',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'bioseguridad',
    subSectionTitle: '2. Subcomité de Bioseguridad',
    text: '2.4. Higiene de Alimentos: Existe un cronograma ejecutado de control de plagas (desinsectación/desratización) y exámenes médicos regulares al personal de cocina.'
  },
  {
    id: 'sec3_bio_5',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'bioseguridad',
    subSectionTitle: '2. Subcomité de Bioseguridad',
    text: '2.5. Limpieza de Superficies: Se aplican protocolos validados de limpieza y desinfección ambiental diaria y terminal, supervisados por enfermería.'
  },
  {
    id: 'sec3_bio_6',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'bioseguridad',
    subSectionTitle: '2. Subcomité de Bioseguridad',
    text: '2.6. Salud e Inmunización del Personal: Se cuenta con un registro actualizado de la cobertura de vacunación activa del personal expuesto (Hepatitis B, Influenza, Tétanos).'
  },
  {
    id: 'sec3_bio_7',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'bioseguridad',
    subSectionTitle: '2. Subcomité de Bioseguridad',
    text: '2.7. Accidentes Laborales: Existe un protocolo activo y registro confidencial de notificación e intervención inmediata ante accidentes punzocortantes o fluidos.'
  },

  // Parte 3 IAAS
  {
    id: 'sec3_iaas_1',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'iaas',
    subSectionTitle: '3. Subcomité de Prevención y Control de IAAS y Resistencia Antimicrobiana (RAM)',
    text: '3.1. Fichas de Notificación: Se llenan adecuadamente y de forma exhaustiva las fichas epidemiológicas específicas ante la sospecha o confirmación de una IAAS.'
  },
  {
    id: 'sec3_iaas_2',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'iaas',
    subSectionTitle: '3. Subcomité de Prevención y Control de IAAS y Resistencia Antimicrobiana (RAM)',
    text: '3.2. Monitoreo de Indicadores: El subcomité calcula mensualmente las tasas de densidad de incidencia de IAAS (NAV por días/ventilador, ITU por días/sonda, etc.).'
  },
  {
    id: 'sec3_iaas_3',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'iaas',
    subSectionTitle: '3. Subcomité de Prevención y Control de IAAS y Resistencia Antimicrobiana (RAM)',
    text: '3.3. Higiene de Manos: Se realizan evaluaciones de adherencia a la técnica de los 5 momentos del lavado de manos en el personal médico y de enfermería.'
  },
  {
    id: 'sec3_iaas_4',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'iaas',
    subSectionTitle: '3. Subcomité de Prevención y Control de IAAS y Resistencia Antimicrobiana (RAM)',
    text: '3.4. Prevención Proactiva (Bundles): Se supervisa y registra el cumplimiento de los paquetes de medidas preventivas para la inserción y mantenimiento de dispositivos invasivos.'
  },
  {
    id: 'sec3_iaas_5',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'iaas',
    subSectionTitle: '3. Subcomité de Prevención y Control de IAAS y Resistencia Antimicrobiana (RAM)',
    text: '3.5. Notificación de RAM: Se cuenta con disponibilidad física o digital de formularios oficiales de notificación de Reacciones Adversas a Medicamentos (RAM).'
  },
  {
    id: 'sec3_iaas_6',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'iaas',
    subSectionTitle: '3. Subcomité de Prevención y Control de IAAS y Resistencia Antimicrobiana (RAM)',
    text: '3.6. Flujo de Reporte RAM: Las sospechas de RAM severas o inesperadas se reportan al Responsable de Farmacovigilancia del hospital en los plazos normados.'
  },
  {
    id: 'sec3_iaas_7',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'iaas',
    subSectionTitle: '3. Subcomité de Prevención y Control de IAAS y Resistencia Antimicrobiana (RAM)',
    text: '3.7. Política de Antimicrobianos: El hospital cuenta con una guía de uso racional de antibióticos y un sistema de restricción/justificación para antibióticos de reserva.'
  },
  {
    id: 'sec3_iaas_8',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'iaas',
    subSectionTitle: '3. Subcomité de Prevención y Control de IAAS y Resistencia Antimicrobiana (RAM)',
    text: '3.8. Monitoreo de Consumo: Se realiza el seguimiento cuantitativo del consumo de antibióticos de alto impacto mediante la metodología de Dosis Diaria Definida (DDD).'
  },
  {
    id: 'sec3_iaas_9',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'iaas',
    subSectionTitle: '3. Subcomité de Prevención y Control de IAAS y Resistencia Antimicrobiana (RAM)',
    text: '3.9. Perfil de Resistencia (Mapeo): El laboratorio de bacteriología emite, actualiza y socializa el mapa microbiológico hospitalario y su perfil de sensibilidad antimicrobiana al menos una vez al año (basado en mínimo 30 aislamientos por especie).'
  },

  // Parte 4 CAI
  {
    id: 'sec3_cai_1',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'cai',
    subSectionTitle: '4. Subcomité de Análisis de Información (CAI)',
    text: '4.1. Regularidad: Se reúne de forma mensual ordinaria y de manera extraordinaria e inmediata ante la detección de brotes o alertas epidemiológicas.'
  },
  {
    id: 'sec3_cai_2',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'cai',
    subSectionTitle: '4. Subcomité de Análisis de Información (CAI)',
    text: '4.2. Quórum: Las reuniones oficiales cuentan con la asistencia y firma de más del 50% de sus miembros oficiales (Dirección, Epidemiología, Jefaturas Médicas y Enfermería).'
  },
  {
    id: 'sec3_cai_3',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'cai',
    subSectionTitle: '4. Subcomité de Análisis de Información (CAI)',
    text: '4.3. Control de Actas: Cada sesión genera un acta formal estructurada que detalla compromisos, tareas específicas y responsables con plazos fijos de entrega.'
  },
  {
    id: 'sec3_cai_4',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'cai',
    subSectionTitle: '4. Subcomité de Análisis de Información (CAI)',
    text: '4.4. Calidad del Dato: El subcomité audita y verifica activamente la consistencia, claridad y exhaustividad de las fichas epidemiológicas recibidas de los servicios.'
  },
  {
    id: 'sec3_cai_5',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'cai',
    subSectionTitle: '4. Subcomité de Análisis de Información (CAI)',
    text: '4.5. Análisis Clínico Integrado: Evalúa de forma cruzada las tasas de infecciones asociadas a la atención en salud (IAAS) junto con la mortalidad hospitalaria del periodo.'
  },
  {
    id: 'sec3_cai_6',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'cai',
    subSectionTitle: '4. Subcomité de Análisis de Información (CAI)',
    text: '4.6. Identificación de Alertas: Detecta oportunamente incrementos inusuales de casos (clústers) o canales endémicos elevados para enfermedades de notificación obligatoria.'
  },
  {
    id: 'sec3_cai_7',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'cai',
    subSectionTitle: '4. Subcomité de Análisis de Información (CAI)',
    text: '4.7. Boletín Epidemiológico: Emite de manera regular reportes resumidos o boletines informativos epidemiológicos con periodicidad mensual o trimestral.'
  },
  {
    id: 'sec3_cai_8',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'cai',
    subSectionTitle: '4. Subcomité de Análisis de Información (CAI)',
    text: '4.8. Toma de Decisiones: Las recomendaciones y conclusiones plasmadas en las actas se traducen en planes de mejora u órdenes de servicio ejecutadas en los pisos.'
  },
  {
    id: 'sec3_cai_9',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'cai',
    subSectionTitle: '4. Subcomité de Análisis de Información (CAI)',
    text: '4.9. Difusión Interna: Comparte de manera abierta y transparente los resultados de los análisis con todas las jefaturas médicas, de enfermería y áreas de apoyo.'
  },
  {
    id: 'sec3_cai_10',
    sectionId: 'seccion_3_respuestas',
    sectionTitle: 'III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES',
    subSectionId: 'cai',
    subSectionTitle: '4. Subcomité de Análisis de Información (CAI)',
    text: '4.10. Cumplimiento de Plazos: Envía las notificaciones de enfermedades obligatorias y consolidados mensuales a los niveles superiores (Sedes / Ministerio) en el tiempo normado.'
  }
];

export const getQuestionById = (id: string, sectionId?: string): EvaluationQuestion | undefined => {
  if (sectionId) {
    return EVALUATION_DICTIONARY.find(q => q.id === id && q.sectionId === sectionId);
  }
  return EVALUATION_DICTIONARY.find(q => q.id === id);
};
