export const calculateScores = (data: any) => {
  // Función auxiliar para sumar valores numéricos de un objeto (solo strings '0','1','2')
  const sumValues = (obj: any = {}): number => {
    return Object.values(obj).reduce((sum: number, val: any) => {
      const num = parseInt(val, 10);
      return sum + (isNaN(num) ? 0 : num);
    }, 0) as number;
  };

  // Calcular Sección 1
  const puntaje_sec_1 = sumValues(data.seccion_1_respuestas);

  // Calcular Sección 2 (4 preguntas de conformación y 4 de sesiona)
  // Nota: Los campos de texto de liderazgo no suman puntos.
  const sec2Responses = { ...data.seccion_2_respuestas };
  // Eliminamos los campos de texto para que no interfieran si alguien escribe un número
  delete sec2Responses.residuos_liderazgo;
  delete sec2Responses.bioseguridad_liderazgo;
  delete sec2Responses.iaas_liderazgo;
  delete sec2Responses.cai_liderazgo;
  
  const puntaje_sec_2 = sumValues(sec2Responses);

  // Calcular Sección 3 (Dividida por subcomités)
  let puntaje_sec_3_residuos = 0;
  let puntaje_sec_3_bioseguridad = 0;
  let puntaje_sec_3_iaas = 0;
  let puntaje_sec_3_cai = 0;

  if (data.seccion_3_respuestas) {
    Object.keys(data.seccion_3_respuestas).forEach(key => {
      const val = parseInt(data.seccion_3_respuestas[key], 10) || 0;
      if (key.includes('sec3_res_')) puntaje_sec_3_residuos += val;
      if (key.includes('sec3_bio_')) puntaje_sec_3_bioseguridad += val;
      if (key.includes('sec3_iaas_')) puntaje_sec_3_iaas += val;
      if (key.includes('sec3_cai_')) puntaje_sec_3_cai += val;
    });
  }

  // Suma total
  const puntaje_total = puntaje_sec_1 + puntaje_sec_2 + puntaje_sec_3_residuos + puntaje_sec_3_bioseguridad + puntaje_sec_3_iaas + puntaje_sec_3_cai;
  const puntaje_maximo = 92;
  const porcentajeDecimal = (puntaje_total / puntaje_maximo) * 100;
  const porcentajeRedondeado = Math.round(porcentajeDecimal);

  // Semáforo lógico básico
  let nivel_semaforo = 'CRÍTICO';
  if (porcentajeRedondeado >= 86) nivel_semaforo = 'ÓPTIMO';
  else if (porcentajeRedondeado >= 60) nivel_semaforo = 'REGULAR';

  return {
    puntaje_sec_1,
    puntaje_sec_2,
    puntaje_sec_3_residuos,
    puntaje_sec_3_bioseguridad,
    puntaje_sec_3_iaas,
    puntaje_sec_3_cai,
    puntaje_total,
    porcentaje: porcentajeRedondeado,
    nivel_semaforo
  };
};
