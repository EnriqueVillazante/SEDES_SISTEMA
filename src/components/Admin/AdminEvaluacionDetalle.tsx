import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, CheckCircle, AlertTriangle, ShieldAlert, FileText, LayoutList, Eye, X, Activity } from 'lucide-react';
import { toast } from 'sonner';
import GraficoResultados from './GraficoResultados';
import GraficoSeccion2 from './GraficoSeccion2';
import GraficoSeccion3 from './GraficoSeccion3';
import GraficoResultadosGlobal from './GraficoResultadosGlobal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminEvaluacionDetalle() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [ev, setEv] = useState<any>(null);
  const [showChart, setShowChart] = useState(false);
  const [showChart2, setShowChart2] = useState(false);
  const [chart3Subcomite, setChart3Subcomite] = useState<'residuos' | 'bioseguridad' | 'iaas' | 'cai' | null>(null);
  const [showChartGlobal, setShowChartGlobal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('evaluaciones')
          .select('*, usuarios(nombre_completo, email, celular, cargo, sector)')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setEv(data);
      } catch (error) {
        toast.error('Error al cargar los detalles de la evaluación');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
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
        const logoUrl = '/logo.png';
        const img = new Image();
        img.src = logoUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        doc.addImage(img, 'PNG', 15, 12, 35, 35);
      } catch (e) {
        console.warn("No se pudo cargar el logo para el PDF", e);
      }

      // Títulos
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 118, 110); // teal-700
      doc.text('EVALUACIÓN INSTITUCIONAL', 55, 25);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('SISTEMA DE VIGILANCIA EPIDEMIOLÓGICA - SEDES', 55, 33);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, 55, 41);

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
          ['Nombre Completo', ev.usuarios?.nombre_completo || '-'],
          ['Cargo', ev.usuarios?.cargo || '-'],
          ['Celular', ev.usuarios?.celular || '-'],
          ['Correo Electrónico', ev.usuarios?.email || '-'],
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
          ['Establecimiento de Salud', ev.establecimiento_salud || '-'],
          ['Red de Salud', ev.red_salud || '-'],
          ['Nivel de Atención', ev.nivel_atencion || '-'],
          ['Sector', ev.usuarios?.sector || '-'],
          ['Fecha de Evaluación', new Date(ev.fecha_evaluacion).toLocaleDateString('es-ES')],
          ['Puntaje Total Obtenido', `${ev.puntaje_total} de 92`],
          ['Calificación (Semáforo)', ev.nivel_semaforo],
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
        ev.seccion_1_respuestas[key].toString()
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
        ev.seccion_2_respuestas[key].toString()
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
            .map(key => [formatKeyName(key), ev.seccion_3_respuestas[key].toString()]);

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

      doc.save(`Evaluacion_Completa_${ev.establecimiento_salud.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF generado exitosamente', { id: 'pdf-toast' });
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el PDF', { id: 'pdf-toast' });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!ev) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Evaluación no encontrada</h2>
        <Link to="/admin" className="mt-4 px-4 py-2 bg-amber-500 text-slate-900 font-bold rounded-lg hover:bg-amber-600 transition-colors">Volver al Panel</Link>
      </div>
    );
  }

  const formatKeyName = (key: string) => {
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


  const getSemaforoIcon = (nivel: string) => {
    if (nivel === 'ÓPTIMO') return <CheckCircle className="h-6 w-6 text-emerald-400" />;
    if (nivel === 'REGULAR') return <AlertTriangle className="h-6 w-6 text-amber-400" />;
    return <ShieldAlert className="h-6 w-6 text-red-400" />;
  };

  const getSemaforoStyle = (nivel: string) => {
    if (nivel === 'ÓPTIMO') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    if (nivel === 'REGULAR') return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    return 'bg-red-500/10 border-red-500/30 text-red-400';
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-12 font-sans">
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/admin" className="flex items-center text-slate-400 hover:text-amber-500 transition-colors font-semibold text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Directorio
          </Link>
          <div className="flex items-center space-x-4">
            {ev.estado === 'FINALIZADO' && (
              <button 
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {isExporting ? (
                  <div className="h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Descargar PDF
              </button>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 text-sm font-bold">Estado:</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                ev.estado === 'FINALIZADO' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-slate-800 text-slate-300'
              }`}>
                {ev.estado}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Header Resumen */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <FileText className="w-48 h-48 text-white" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div>
              <p className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-2">Evaluación Institucional</p>
              <h1 className="text-3xl font-black text-white mb-2">{ev.establecimiento_salud}</h1>
              <div className="flex flex-wrap gap-2 text-slate-400 text-sm font-medium">
                <span>Red: {ev.red_salud || '-'}</span>
                <span className="hidden sm:inline">•</span>
                <span>Nivel: {ev.nivel_atencion || '-'}</span>
                <span className="hidden sm:inline">•</span>
                <span>Sector: {ev.usuarios?.sector || '-'}</span>
                <span className="hidden sm:inline">•</span>
                <span>Fecha: {new Date(ev.fecha_evaluacion).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
            
            {ev.estado === 'FINALIZADO' && (
              <div className="flex items-center space-x-6 bg-slate-900 p-5 rounded-2xl border border-slate-700">
                <div className="text-center relative">
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Puntaje</p>
                  <p className="text-3xl font-black text-white flex items-center justify-center">
                    {ev.puntaje_total}<span className="text-slate-500 text-lg">/92</span>
                  </p>
                </div>
                <div className="w-px h-12 bg-slate-700"></div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Resultado</p>
                  <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${getSemaforoStyle(ev.nivel_semaforo)}`}>
                    {getSemaforoIcon(ev.nivel_semaforo)}
                    <span className="font-bold tracking-wider">{ev.nivel_semaforo}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Gráfico (Telaraña) - Sección 1 */}
        {showChart && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-50 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 relative border border-slate-200">
              <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white">
                <h3 className="font-black text-slate-800 text-xl flex items-center">
                  <Activity className="w-6 h-6 mr-2 text-blue-500" />
                  Reporte Epidemiológico (Sección 1)
                </h3>
                <button 
                  onClick={() => setShowChart(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <GraficoResultados evaluacion={ev} />
              </div>
            </div>
          </div>
        )}

        {/* Modal de Gráfico (Telaraña) - Sección 2 */}
        {showChart2 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-50 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 relative border border-slate-200">
              <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white">
                <h3 className="font-black text-slate-800 text-xl flex items-center">
                  <Activity className="w-6 h-6 mr-2 text-emerald-500" />
                  Reporte Epidemiológico (Sección 2)
                </h3>
                <button 
                  onClick={() => setShowChart2(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <GraficoSeccion2 evaluacion={ev} />
              </div>
            </div>
          </div>
        )}

        {/* Modal de Gráfico (Telaraña) - Sección 3 */}
        {chart3Subcomite && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-50 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 relative border border-slate-200">
              <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white">
                <h3 className="font-black text-slate-800 text-xl flex items-center">
                  <Activity className="w-6 h-6 mr-2 text-indigo-500" />
                  Reporte Epidemiológico (Sección 3)
                </h3>
                <button 
                  onClick={() => setChart3Subcomite(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <GraficoSeccion3 evaluacion={ev} subcomite={chart3Subcomite} />
              </div>
            </div>
          </div>
        )}

        {/* Desglose de Secciones */}
        <div className="space-y-6">
          
          {/* SECCION 1 */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center">
                <LayoutList className="w-5 h-5 mr-3 text-teal-400" />
                I. Conformación del CVEH
              </h3>
              <div className="flex items-center space-x-3">
                <div className="px-3 py-1 bg-slate-900 rounded-lg border border-slate-700 text-teal-400 font-bold">
                  {ev.puntaje_sec_1} / 10 pts
                </div>
                <button 
                  onClick={() => setShowChart(true)}
                  className="flex items-center justify-center w-8 h-8 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg shadow-md transition-all hover:scale-105 group"
                  title="Ver Reporte Gráfico de esta sección"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid gap-3">
                {Object.keys(ev.seccion_1_respuestas || {}).map(key => (
                  <div key={key} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <span className="text-slate-300 font-medium">{formatKeyName(key)}</span>
                    <span className="font-bold text-amber-500 w-8 text-center">{ev.seccion_1_respuestas[key]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECCION 2 */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center">
                <LayoutList className="w-5 h-5 mr-3 text-teal-400" />
                II. Subcomités Operativos
              </h3>
              <div className="flex items-center space-x-3">
                <div className="px-3 py-1 bg-slate-900 rounded-lg border border-slate-700 text-teal-400 font-bold">
                  {ev.puntaje_sec_2} / 16 pts
                </div>
                <button 
                  onClick={() => setShowChart2(true)}
                  className="flex items-center justify-center w-8 h-8 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg shadow-md transition-all hover:scale-105 group"
                  title="Ver Reporte Gráfico de esta sección"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {['residuos', 'bioseguridad', 'iaas', 'cai'].map(sub => (
                  <div key={sub} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <h4 className="text-amber-500 font-bold mb-3 uppercase text-xs tracking-wider border-b border-slate-700 pb-2">{sub}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Conformado:</span>
                        <span className="text-white font-bold">{ev.seccion_2_respuestas?.[`${sub}_conformado`] || '0'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Sesiona:</span>
                        <span className="text-white font-bold">{ev.seccion_2_respuestas?.[`${sub}_sesiona`] || '0'}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-700/50">
                        <span className="text-slate-500 text-xs block mb-1">Liderazgo:</span>
                        <p className="text-slate-300 text-sm italic">{ev.seccion_2_respuestas?.[`${sub}_liderazgo`] || 'Sin especificar'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECCION 3 */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center">
                <LayoutList className="w-5 h-5 mr-3 text-teal-400" />
                III. Evaluación de Funciones
              </h3>
              <div className="px-3 py-1 bg-slate-900 rounded-lg border border-slate-700 text-teal-400 font-bold">
                {ev.puntaje_sec_3_residuos + ev.puntaje_sec_3_bioseguridad + ev.puntaje_sec_3_iaas + ev.puntaje_sec_3_cai} / 66 pts
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Residuos */}
              <div>
                <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
                  <h4 className="text-amber-500 font-bold text-sm uppercase tracking-wider">1. Residuos Hospitalarios</h4>
                  <div className="flex items-center space-x-3">
                    <span className="text-teal-400 font-bold text-sm">{ev.puntaje_sec_3_residuos} pts</span>
                    <button 
                      onClick={() => setChart3Subcomite('residuos')}
                      className="flex items-center justify-center w-7 h-7 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg shadow-md transition-all hover:scale-105 group"
                      title="Ver Reporte Gráfico"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  {[1,2,3,4,5,6,7].map(num => (
                    <div key={`sec3_res_${num}`} className="flex justify-between bg-slate-900/30 px-3 py-2 rounded-lg text-sm">
                      <span className="text-slate-300">{formatKeyName(`sec3_res_${num}`)}</span>
                      <span className="text-white font-bold">{ev.seccion_3_respuestas?.[`sec3_res_${num}`] || '0'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bioseguridad */}
              <div>
                <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
                  <h4 className="text-emerald-500 font-bold text-sm uppercase tracking-wider">2. Bioseguridad</h4>
                  <div className="flex items-center space-x-3">
                    <span className="text-teal-400 font-bold text-sm">{ev.puntaje_sec_3_bioseguridad} pts</span>
                    <button 
                      onClick={() => setChart3Subcomite('bioseguridad')}
                      className="flex items-center justify-center w-7 h-7 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg shadow-md transition-all hover:scale-105 group"
                      title="Ver Reporte Gráfico"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  {[1,2,3,4,5,6,7].map(num => (
                    <div key={`sec3_bio_${num}`} className="flex justify-between bg-slate-900/30 px-3 py-2 rounded-lg text-sm">
                      <span className="text-slate-300">{formatKeyName(`sec3_bio_${num}`)}</span>
                      <span className="text-white font-bold">{ev.seccion_3_respuestas?.[`sec3_bio_${num}`] || '0'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* IAAS */}
              <div>
                <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
                  <h4 className="text-red-500 font-bold text-sm uppercase tracking-wider">3. IAAS y RAM</h4>
                  <div className="flex items-center space-x-3">
                    <span className="text-teal-400 font-bold text-sm">{ev.puntaje_sec_3_iaas} pts</span>
                    <button 
                      onClick={() => setChart3Subcomite('iaas')}
                      className="flex items-center justify-center w-7 h-7 bg-red-500 hover:bg-red-400 text-slate-900 rounded-lg shadow-md transition-all hover:scale-105 group"
                      title="Ver Reporte Gráfico"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  {[1,2,3,4,5,6,7,8,9].map(num => (
                    <div key={`sec3_iaas_${num}`} className="flex justify-between bg-slate-900/30 px-3 py-2 rounded-lg text-sm">
                      <span className="text-slate-300">{formatKeyName(`sec3_iaas_${num}`)}</span>
                      <span className="text-white font-bold">{ev.seccion_3_respuestas?.[`sec3_iaas_${num}`] || '0'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CAI */}
              <div>
                <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
                  <h4 className="text-violet-500 font-bold text-sm uppercase tracking-wider">4. Análisis de Información (CAI)</h4>
                  <div className="flex items-center space-x-3">
                    <span className="text-teal-400 font-bold text-sm">{ev.puntaje_sec_3_cai} pts</span>
                    <button 
                      onClick={() => setChart3Subcomite('cai')}
                      className="flex items-center justify-center w-7 h-7 bg-violet-500 hover:bg-violet-400 text-white rounded-lg shadow-md transition-all hover:scale-105 group"
                      title="Ver Reporte Gráfico"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <div key={`sec3_cai_${num}`} className="flex justify-between bg-slate-900/30 px-3 py-2 rounded-lg text-sm">
                      <span className="text-slate-300">{formatKeyName(`sec3_cai_${num}`)}</span>
                      <span className="text-white font-bold">{ev.seccion_3_respuestas?.[`sec3_cai_${num}`] || '0'}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* TABLA DE RESUMEN GLOBAL */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg mt-8 mb-12">
            <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-3 text-blue-400" />
                Resumen Global de Calificación
              </h3>
              <button 
                onClick={() => setShowChartGlobal(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md transition-all hover:scale-105 group"
                title="Ver Reporte Gráfico Global"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm font-bold">Ver Gráfico</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <span className="text-slate-300 font-bold">I. Conformación del CVEH</span>
                  <span className="text-white font-black text-lg">{ev.puntaje_sec_1} / 10 pts</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <span className="text-slate-300 font-bold">II. Subcomités Operativos</span>
                  <span className="text-white font-black text-lg">{ev.puntaje_sec_2} / 16 pts</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <span className="text-slate-300 font-bold">III. Residuos Hospitalarios</span>
                  <span className="text-white font-black text-lg">{ev.puntaje_sec_3_residuos} / 14 pts</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <span className="text-slate-300 font-bold">III. Bioseguridad</span>
                  <span className="text-white font-black text-lg">{ev.puntaje_sec_3_bioseguridad} / 14 pts</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <span className="text-slate-300 font-bold">III. IAAS y RAM</span>
                  <span className="text-white font-black text-lg">{ev.puntaje_sec_3_iaas} / 18 pts</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <span className="text-slate-300 font-bold">III. Análisis (CAI)</span>
                  <span className="text-white font-black text-lg">{ev.puntaje_sec_3_cai} / 20 pts</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl">
                  <div>
                    <h4 className="text-blue-400 font-black text-xl uppercase tracking-wide">Puntaje Final</h4>
                    <p className="text-slate-400 text-sm">Suma total de puntos dividida entre 92 × 100</p>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <span className="block text-slate-500 text-xs font-bold uppercase mb-1">Total Puntos</span>
                      <span className="text-2xl font-black text-white">{ev.puntaje_total} / 92</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-blue-400 text-xs font-bold uppercase mb-1">Porcentaje</span>
                      <span className="text-4xl font-black text-blue-400">{ev.porcentaje}%</span>
                    </div>
                    <div className="hidden sm:block w-px h-12 bg-slate-700"></div>
                    <div className="text-center">
                      <span className="block text-slate-500 text-xs font-bold uppercase mb-1">Estado Final</span>
                      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${getSemaforoStyle(ev.nivel_semaforo)}`}>
                        {getSemaforoIcon(ev.nivel_semaforo)}
                        <span className="font-bold tracking-wider">{ev.nivel_semaforo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Modal de Gráfico (Telaraña) - GLOBAL */}
        {showChartGlobal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-50 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 relative border border-slate-200">
              <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white">
                <h3 className="font-black text-slate-800 text-xl flex items-center">
                  <Activity className="w-6 h-6 mr-2 text-blue-600" />
                  Reporte Epidemiológico Global
                </h3>
                <button 
                  onClick={() => setShowChartGlobal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <GraficoResultadosGlobal evaluacion={ev} />
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
