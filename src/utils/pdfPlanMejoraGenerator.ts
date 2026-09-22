import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { formatDate } from './dateUtils';
export interface MappedPlanItem {
  hallazgo_str: string;
  accion_correctiva: string;
  recursos_necesarios: string;
}

export const generatePlanMejoraPDF = async (
  evalMetaData: {
    establecimiento_salud: string;
    fecha_evaluacion: string;
    nivel_semaforo: string;
  },
  items: MappedPlanItem[],
  globalResp1: string,
  globalResp2: string,
  globalPlazo: number
) => {
  try {
    toast.loading('Generando Plan de Mejora en PDF...', { id: 'pdf-plan-toast' });

    const doc = new jsPDF({
      orientation: 'landscape', // Landscape is better for tables with many columns
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // 1. Logo
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

    // 2. Encabezado e Información General
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110); // teal-700
    doc.text('PLAN DE MEJORA', 70, 20);
    doc.text('EPIDEMIOLÓGICA HOSPITALARIA', 70, 30);
    doc.text('SISTEMA DE VIGILANCIA EPIDEMIOLÓGICA - SEDES', 70, 40);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Fecha de Emisión: ${formatDate(new Date().toISOString())}`, 70, 47);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('I. Formato de Plan de Mejora Continua', 15, 56);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const introText = 'Este formato se llena inmediatamente después de aplicar la lista de verificación, registrando únicamente los ítems que obtuvieron un puntaje de cero (0).';
    const splitIntro = doc.splitTextToSize(introText, pageWidth - 30);
    doc.text(splitIntro, 15, 62);

    y = 74; // Espacio después de la introducción

    // Metadata
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900

    doc.setFont('helvetica', 'bold');
    doc.text('Establecimiento de Salud: ', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(evalMetaData.establecimiento_salud || '________________________________________', 70, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de Evaluación: ', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(evalMetaData.fecha_evaluacion ? formatDate(evalMetaData.fecha_evaluacion) : '//202__', 70, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Nivel de Calificación Obtenido: ', 15, y);
    doc.setFont('helvetica', 'normal');

    let nivelText = evalMetaData.nivel_semaforo || '________________';
    if (nivelText === 'Óptimo') nivelText = '🟢 Óptimo';
    if (nivelText === 'Regular') nivelText = '🟡 Regular';
    if (nivelText === 'Crítico') nivelText = '🔴 Crítico';
    doc.text(nivelText, 75, y);
    y += 12;

    // 3. Tabla Principal
    const getDeadlineDate = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return formatDate(d.toISOString());
    };

    const deadlineStr = getDeadlineDate(globalPlazo);

    let responsableStr = `Dir. Tec.: ${globalResp1}`;
    if (globalResp2) {
      responsableStr += `\nVigilancia: ${globalResp2}`;
    }

    const tableBody = items.map((item, index) => {
      return [
        (index + 1).toString(),
        item.hallazgo_str,
        item.accion_correctiva || '',
        responsableStr,
        deadlineStr,
        item.recursos_necesarios || '',
        'Archivos Digitales Adjuntos'
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Nº', 'Ítem Reprobado (Hallazgo / No Conformidad)', 'Acción Correctiva Propuesta (¿Qué se va a hacer?)', 'Responsable de la Ejecución (Nombre y Cargo)', 'Fecha Límite de Entrega', 'Recursos Necesarios (Material / Presupuesto)', 'Evidencia de Cumplimiento (¿Cómo se demuestra?)']],
      body: tableBody,
      headStyles: {
        fillColor: [15, 118, 110], // teal-700
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 55 },
        3: { cellWidth: 40 },
        4: { cellWidth: 30, halign: 'center' },
        5: { cellWidth: 45 },
        6: { cellWidth: 40, halign: 'center' }
      },
      theme: 'grid',
      margin: { left: 15, right: 15 }
    });

    // 4. Firmas
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY || y;

    let tituloFirmasY = finalY + 20;
    let firmasY = tituloFirmasY + 45; // 45mm de espacio extra para que puedan firmar grande

    // Si no hay espacio para las firmas, saltar de página
    if (firmasY > doc.internal.pageSize.getHeight() - 25) {
      doc.addPage();
      tituloFirmasY = 20;
      firmasY = tituloFirmasY + 45;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('II. Firmas de Compromiso Institucional', 15, tituloFirmasY);

    doc.setFontSize(10);
    // Firma Elaborado por
    doc.setFont('helvetica', 'normal');
    doc.text('Elaborado por:', 40, firmasY - 30);
    doc.setLineWidth(0.5);
    doc.line(20, firmasY, 90, firmasY);

    if (globalResp2) {
      doc.setFont('helvetica', 'bold');
      doc.text(globalResp2.toUpperCase(), 55, firmasY + 5, { align: 'center' });
    }
    doc.setFont('helvetica', 'normal');
    doc.text('Responsable de Vigilancia Epidemiológica', 55, firmasY + 10, { align: 'center' });

    // Firma Aprobado por
    doc.setFont('helvetica', 'bold');
    doc.text('Aprobado por:', 200, firmasY - 30);
    doc.line(180, firmasY, 250, firmasY);
    doc.setFont('helvetica', 'normal');

    if (globalResp1) {
      doc.setFont('helvetica', 'bold');
      doc.text(globalResp1.toUpperCase(), 215, firmasY + 5, { align: 'center' });
    }
    doc.setFont('helvetica', 'normal');
    doc.text('Director Técnico del Establecimiento', 215, firmasY + 10, { align: 'center' });

    // Guardar
    doc.save(`Plan_Mejora_${evalMetaData.establecimiento_salud.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    toast.success('PDF generado exitosamente', { id: 'pdf-plan-toast' });
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error('Error al generar el PDF', { id: 'pdf-plan-toast' });
  }
};
