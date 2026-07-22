import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { formatDate } from './dateUtils';

export const formatKeyName = (key: string) => {
  const dictionary: Record<string, string> = {
    'sec1_q1': '1.1. Constitución Formal: ¿Cuenta con una Resolución Administrativa Interna vigente de conformación del CVEH?',
    'sec1_q2': '1.2. Liderazgo Técnico: ¿El Epidemiólogo del hospital (o Responsable de Vigilancia) coordina, dirige y firma formalmente las acciones del comité?',
    'sec1_q3': '1.3. Periodicidad de Reuniones: ¿Existen actas firmadas que demuestren reuniones ordinarias mensuales y extraordinarias ante brotes o alertas?',
    'sec1_q4': '1.4. Plan de Acción: ¿Existe un Plan Operativo Anual (POA) del CVEH debidamente aprobado por la Dirección Médica?',
    'sec1_q5': '1.5. Difusión de Información: ¿El CVEH emite y difunde de forma regular boletines o reportes de la situación epidemiológica a las jefaturas?',

    'residuos_conformado': '1. Residuos Hospitalarios - Conformado Formalmente',
    'residuos_sesiona': '1. Residuos Hospitalarios - Sesiona Regularmente',
    'residuos_liderazgo': '1. Residuos Hospitalarios - Liderazgo',
    'bioseguridad_conformado': '2. Bioseguridad - Conformado Formalmente',
    'bioseguridad_sesiona': '2. Bioseguridad - Sesiona Regularmente',
    'bioseguridad_liderazgo': '2. Bioseguridad - Liderazgo',
    'iaas_conformado': '3. Infecciones Asociadas a la Atención en Salud (IAAS) - Conformado',
    'iaas_sesiona': '3. Infecciones Asociadas a la Atención en Salud (IAAS) - Sesiona',
    'iaas_liderazgo': '3. Infecciones Asociadas a la Atención en Salud (IAAS) - Liderazgo',
    'cai_conformado': '4. Análisis de la Información (CAI) - Conformado',
    'cai_sesiona': '4. Análisis de la Información (CAI) - Sesiona',
    'cai_liderazgo': '4. Análisis de la Información (CAI) - Liderazgo',

    'sec3_res_1': '1.1. Planificación: Existe un Plan de Manejo de Residuos Hospitalarios institucional documentado, actualizado y en ejecución.',
    'sec3_res_2': '1.2. Clasificación en Origen: Se evidencia la separación estricta de residuos en los tres colores normativos (Rojo: Bioinfecciosos, Azul: Especiales, Negro: Comunes).',
    'sec3_res_3': '1.3. Ruta de Transporte Interno: Existen horarios fijos, rutas definidas de menor flujo de pacientes y carros de transporte exclusivos y señalizados.',
    'sec3_res_4': '1.4. Almacenamiento Temporal y Final: El hospital cuenta con un centro de acopio final techado, limpio, seguro, cerrado bajo llave y con punto de agua para lavado.',
    'sec3_res_5': '1.5. Registro de Generación: Se lleva un registro diario y por turnos del peso (en kg) de residuos bioinfecciosos generados por cada servicio.',
    'sec3_res_6': '1.6. Elementos de Protección (EPP): El personal de limpieza y recolección utiliza el EPP completo y específico (guantes de nitrilo caña larga, botas, delantal grueso, barbijo).',
    'sec3_res_7': '1.7. Disposición Final Externa: Se cuenta con contrato o convenio vigente con la empresa/entidad municipal de aseo para el recojo y tratamiento especializado.',

    'sec3_bio_1': '2.1. Manual de Bioseguridad: El establecimiento cuenta con un Manual de Bioseguridad adaptado a su nivel de complejidad y socializado formalmente.',
    'sec3_bio_2': '2.2. Disponibilidad de Insumos: Se constata el abastecimiento continuo (cero desabastecimiento) de jabón líquido, alcohol en gel, toallas de papel y EPP en áreas críticas.',
    'sec3_bio_3': '2.3. Calidad del Agua: Se cuenta con reportes de control de cloro residual del agua corriente y cultivos bacteriológicos periódicos de tanques de almacenamiento.',
    'sec3_bio_4': '2.4. Higiene de Alimentos: Existe un cronograma ejecutado de control de plagas (desinsectación/desratización) y exámenes médicos regulares al personal de cocina.',
    'sec3_bio_5': '2.5. Limpieza de Superficies: Se aplican protocolos validados de limpieza y desinfección ambiental diaria y terminal, supervisados por enfermería.',
    'sec3_bio_6': '2.6. Salud e Inmunización del Personal: Se cuenta con un registro actualizado de la cobertura de vacunación activa del personal expuesto (Hepatitis B, Influenza, Tétanos).',
    'sec3_bio_7': '2.7. Accidentes Laborales: Existe un protocolo activo y registro confidencial de notificación e intervención inmediata ante accidentes punzocortantes o fluidos.',

    'sec3_iaas_1': '3.1. Fichas de Notificación: Se llenan adecuadamente y de forma exhaustiva las fichas epidemiológicas específicas ante la sospecha o confirmación de una IAAS.',
    'sec3_iaas_2': '3.2. Monitoreo de Indicadores: El subcomité calcula mensualmente las tasas de densidad de incidencia de IAAS (NAV por días/ventilador, ITU por días/sonda, etc.).',
    'sec3_iaas_3': '3.3. Higiene de Manos: Se realizan evaluaciones de adherencia a la técnica de los 5 momentos del lavado de manos en el personal médico y de enfermería.',
    'sec3_iaas_4': '3.4. Prevención Proactiva (Bundles): Se supervisa y registra el cumplimiento de los paquetes de medidas preventivas para la inserción y mantenimiento de dispositivos invasivos.',
    'sec3_iaas_5': '3.5. Notificación de RAM: Se cuenta con disponibilidad física o digital de formularios oficiales de notificación de Reacciones Adversas a Medicamentos (RAM).',
    'sec3_iaas_6': '3.6. Flujo de Reporte RAM: Las sospechas de RAM severas o inesperadas se reportan al Responsable de Farmacovigilancia del hospital en los plazos normados.',
    'sec3_iaas_7': '3.7. Política de Antimicrobianos: El hospital cuenta con una guía de uso racional de antibióticos y un sistema de restricción/justificación para antibióticos de reserva.',
    'sec3_iaas_8': '3.8. Monitoreo de Consumo: Se realiza el seguimiento cuantitativo del consumo de antibióticos de alto impacto mediante la metodología de Dosis Diaria Definida (DDD).',
    'sec3_iaas_9': '3.9. Perfil de Resistencia (Mapeo): El laboratorio de bacteriología emite, actualiza y socializa el mapa microbiológico hospitalario y su perfil de sensibilidad antimicrobiana al menos una vez al año.',

    'sec3_cai_1': '4.1. Regularidad: Se reúne de forma mensual ordinaria y de manera extraordinaria e inmediata ante la detección de brotes o alertas epidemiológicas.',
    'sec3_cai_2': '4.2. Quórum: Las reuniones oficiales cuentan con la asistencia y firma de más del 50% de sus miembros oficiales (Dirección, Epidemiología, Jefaturas Médicas y Enfermería).',
    'sec3_cai_3': '4.3. Control de Actas: Cada sesión genera un acta formal estructurada que detalla compromisos, tareas específicas y responsables con plazos fijos de entrega.',
    'sec3_cai_4': '4.4. Calidad del Dato: El subcomité audita y verifica activamente la consistencia, claridad y exhaustividad de las fichas epidemiológicas recibidas de los servicios.',
    'sec3_cai_5': '4.5. Análisis Clínico Integrado: Evalúa de forma cruzada las tasas de infecciones asociadas a la atención en salud (IAAS) junto con la mortalidad hospitalaria del periodo.',
    'sec3_cai_6': '4.6. Identificación de Alertas: Detecta oportunamente incrementos inusuales de casos (clústers) o canales endémicos elevados para enfermedades de notificación obligatoria.',
    'sec3_cai_7': '4.7. Boletín Epidemiológico: Emite de manera regular reportes resumidos o boletines informativos epidemiológicos con periodicidad mensual o trimestral.',
    'sec3_cai_8': '4.8. Toma de Decisiones: Las recomendaciones y conclusiones plasmadas en las actas se traducen en planes de mejora u órdenes de servicio ejecutadas en los pisos.',
    'sec3_cai_9': '4.9. Difusión Interna: Comparte de manera abierta y transparente los resultados de los análisis con todas las jefaturas médicas, de enfermería y áreas de apoyo.',
    'sec3_cai_10': '4.10. Cumplimiento de Plazos: Envía las notificaciones de enfermedades obligatorias y consolidados mensuales a los niveles superiores (Sedes / Ministerio) en el tiempo normado.'
  };
  return dictionary[key] || key;
};

export const generatePDF = async (ev: any, setIsExporting?: (val: boolean) => void) => {
  try {
    if (setIsExporting) setIsExporting(true);
    toast.loading('Generando PDF completo e institucional...', { id: 'pdf-toast' });

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // 1. Cargar Logo y Cabecera Institucional
    try {
      const logoUrl = window.location.origin + '/logo.png';
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = logoUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      doc.addImage(img, 'PNG', 15, 12, 48, 32);
    } catch (e) {
      console.warn("No se pudo cargar el logo para el PDF", e);
    }

    // Títulos
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110); // teal-700
    doc.text('EVALUACIÓN DE VIGILANCIA', 68, 22);
    doc.text('EPIDEMIOLÓGICA HOSPITALARIA', 68, 30);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('SISTEMA DE VIGILANCIA EPIDEMIOLÓGICA - SEDES', 68, 38);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, 68, 44);

    y = 55;

    // Línea divisoria
    doc.setDrawColor(15, 118, 110);
    doc.setLineWidth(1);
    doc.line(15, y, pageWidth - 15, y);
    y += 8;

    // Estilos globales
    const globalTableStyles = {
      theme: 'grid' as const,
      headStyles: { fillColor: [15, 118, 110] as [number, number, number], textColor: 255, fontStyle: 'bold' as const, fontSize: 10 },
      bodyStyles: { fontSize: 10, textColor: [51, 65, 85] as [number, number, number] },
      alternateRowStyles: { fillColor: [240, 253, 250] as [number, number, number] },
      styles: { overflow: 'linebreak' as const, cellPadding: 3, lineColor: [204, 251, 241] as [number, number, number], lineWidth: 0.1 },
      margin: { left: 15, right: 15 }
    };

    // 2. Datos del Usuario
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('DATOS DEL EVALUADOR', 15, y);
    y += 4;

    autoTable(doc, {
      ...globalTableStyles,
      startY: y,
      head: [['Campo', 'Dato Registrado']],
      body: [
        ['Nombre Completo', ev.usuarios?.nombre_completo?.toUpperCase() || '-'],
        ['Cargo', ev.usuarios?.cargo?.toUpperCase() || '-'],
        ['Celular', ev.usuarios?.celular?.toUpperCase() || '-'],
        ['Correo Electrónico', ev.usuarios?.email?.toUpperCase() || '-'],
      ],
      columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { cellWidth: 110 } }
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 12;

    // 3. Datos del Establecimiento
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('DATOS DEL ESTABLECIMIENTO DE SALUD', 15, y);
    y += 4;

    autoTable(doc, {
      ...globalTableStyles,
      startY: y,
      head: [['Campo', 'Dato Registrado']],
      body: [
        ['Establecimiento de Salud', ev.establecimiento_salud?.toUpperCase() || '-'],
        ['Red de Salud', ev.red_salud?.toUpperCase() || '-'],
        ['Nivel de Atención', ev.nivel_atencion?.toUpperCase() || '-'],
        ['Sector', ev.usuarios?.sector?.toUpperCase() || '-'],
        ['Fecha de Evaluación', formatDate(ev.fecha_evaluacion || new Date().toISOString()).toUpperCase()],
      ],
      columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { cellWidth: 110 } }
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 15;

    const questionTableStyles = {
      ...globalTableStyles,
      headStyles: { fillColor: [51, 65, 85] as [number, number, number], textColor: 255, fontStyle: 'bold' as const, fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
      styles: { ...globalTableStyles.styles, lineColor: [226, 232, 240] as [number, number, number] },
      columnStyles: { 0: { cellWidth: 150 }, 1: { cellWidth: 30, halign: 'center' as const, fontStyle: 'bold' as const } },
    };

    // 4. Sección 1
    const sec1Data = ev.seccion_1_respuestas ? Object.keys(ev.seccion_1_respuestas).map(key => [
      formatKeyName(key),
      ev.seccion_1_respuestas[key]?.toString() || '-'
    ]) : [];

    if (sec1Data.length > 0) {
      // @ts-ignore
      if (y + 30 > doc.internal.pageSize.getHeight()) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 118, 110);
      doc.text('I. CONFORMACIÓN DEL COMITÉ DE VIGILANCIA EPIDEMIOLÓGICA (CVEH)', 15, y);
      y += 4;
      autoTable(doc, {
        ...questionTableStyles,
        startY: y,
        head: [['Criterio Evaluado', 'Puntaje']],
        body: sec1Data,
      });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 15;
    }

    // 5. Sección 2
    const sec2Data = ev.seccion_2_respuestas ? Object.keys(ev.seccion_2_respuestas).map(key => [
      formatKeyName(key),
      ev.seccion_2_respuestas[key]?.toString() || '-'
    ]) : [];

    if (sec2Data.length > 0) {
      // @ts-ignore
      if (y + 30 > doc.internal.pageSize.getHeight()) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 118, 110);
      doc.text('II. CONFORMACIÓN DE LOS 4 SUBCOMITÉS OPERATIVOS', 15, y);
      y += 4;
      autoTable(doc, {
        ...questionTableStyles,
        startY: y,
        head: [['Criterio Evaluado', 'Puntaje']],
        body: sec2Data,
      });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 15;
    }

    // 6. Sección 3
    if (ev.seccion_3_respuestas && Object.keys(ev.seccion_3_respuestas).length > 0) {
      // @ts-ignore
      if (y + 30 > doc.internal.pageSize.getHeight()) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 118, 110);
      doc.text('III. EVALUACIÓN DEL CUMPLIMIENTO DE FUNCIONES Y ACTIVIDADES', 15, y);
      y += 8;

      const subcomites = [
        { keyPrefix: 'sec3_res_', title: '1. Subcomité de Vigilancia del Manejo de Residuos Hospitalarios' },
        { keyPrefix: 'sec3_bio_', title: '2. Subcomité de Bioseguridad' },
        { keyPrefix: 'sec3_iaas_', title: '3. Subcomité de Prevención y Control de IAAS y Resistencia Antimicrobiana (RAM)' },
        { keyPrefix: 'sec3_cai_', title: '4. Subcomité de Análisis de Información (CAI)' }
      ];

      subcomites.forEach((sub) => {
        const tableData = Object.keys(ev.seccion_3_respuestas)
          .filter(key => key.startsWith(sub.keyPrefix))
          .map(key => [formatKeyName(key), ev.seccion_3_respuestas[key]?.toString() || '-']);

        if (tableData.length > 0) {
          // @ts-ignore
          if (y + 20 > doc.internal.pageSize.getHeight()) { doc.addPage(); y = 20; }
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(sub.title, 15, y);
          y += 4;
          autoTable(doc, {
            ...questionTableStyles,
            startY: y,
            head: [['Criterio Evaluado', 'Puntaje']],
            body: tableData,
          });
          // @ts-ignore
          y = doc.lastAutoTable.finalY + 12;
        }
      });
    }

    // 7. Firma
    if (y + 45 > doc.internal.pageSize.getHeight()) { doc.addPage(); y = 20; }
    y += 35; // Espacio para la firma

    doc.setDrawColor(15, 23, 42); // slate-900
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 35, y, pageWidth / 2 + 35, y); // Línea de firma

    y += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const signatureName = ev.usuarios?.nombre_completo || 'Firma del Evaluador';
    doc.text(signatureName, pageWidth / 2, y, { align: 'center' });

    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    // Si la BD tiene carnet lo usamos, si no espacio en blanco
    const signatureEstablecimiento = ev.establecimiento_salud ? `Establecimiento: ${ev.establecimiento_salud.toUpperCase()}` : 'Establecimiento: _______________';
    doc.text(signatureEstablecimiento, pageWidth / 2, y, { align: 'center' });

    y += 5;
    const signatureCelular = ev.usuarios?.celular ? `Celular: ${ev.usuarios.celular}` : 'Celular: _______________';
    doc.text(signatureCelular, pageWidth / 2, y, { align: 'center' });

    // Paginación
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(15, 282, pageWidth - 15, 282);

      doc.text(`Sistema de Vigilancia Epidemiológica - Página ${i} de ${pageCount}`, pageWidth / 2, 287, { align: 'center' });
    }

    doc.save(`Evaluacion_Completa_${(ev.establecimiento_salud || 'Hospital').replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF generado exitosamente', { id: 'pdf-toast' });
  } catch (error) {
    console.error(error);
    toast.error('Error al generar el PDF', { id: 'pdf-toast' });
  } finally {
    if (setIsExporting) setIsExporting(false);
  }
};
