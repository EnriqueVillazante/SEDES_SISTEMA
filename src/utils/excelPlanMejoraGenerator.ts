// Utilidad para exportar Planes de Mejora a Excel (.xlsx) y CSV sin dependencias externas
import { formatDate } from './dateUtils';

export interface PlanMejoraExcelItem {
  id?: string;
  evaluacion_id?: string;
  item_reprobado: string;
  accion_correctiva: string;
  recursos_necesarios?: string;
  responsable_1_nombre?: string;
  responsable_1_cargo?: string;
  responsable_2_nombre?: string;
  responsable_2_cargo?: string;
  plazo_dias?: number;
  estado?: string;
  created_at?: string;
}

export interface PlanMejoraGrouped {
  evaluacion_id: string;
  establecimiento: string;
  red: string;
  fecha_creacion: string;
  items: PlanMejoraExcelItem[];
}

export interface EvaluacionMeta {
  id: string;
  establecimiento_salud?: string;
  red_salud?: string;
  nivel_atencion?: string;
  fecha_evaluacion?: string;
  nivel_semaforo?: string;
  usuarios?: { sector?: string };
}

// Estructura aplanada para cada fila del reporte Excel
export interface FlatPlanRow {
  correlativo: number;
  establecimiento: string;
  red: string;
  nivel_atencion: string;
  sector: string;
  fecha_evaluacion: string;
  nivel_semaforo: string;
  plazo_dias: number;
  fecha_limite: string;
  responsable_1: string;
  responsable_2: string;
  hallazgo: string;
  accion_correctiva: string;
  recursos_necesarios: string;
  estado: string;
}

/**
 * Transforma los planes agrupados y evaluaciones en una lista de filas detalladas
 */
export function flattenPlanesData(
  planesMejora: PlanMejoraGrouped[],
  evaluaciones: EvaluacionMeta[] = []
): FlatPlanRow[] {
  const rows: FlatPlanRow[] = [];
  let count = 1;

  planesMejora.forEach(planGroup => {
    const ev = evaluaciones.find(e => e.id === planGroup.evaluacion_id);
    const establecimiento = planGroup.establecimiento || ev?.establecimiento_salud || 'No especificado';
    const red = planGroup.red || ev?.red_salud || 'No especificado';
    const nivelAtencion = ev?.nivel_atencion || 'No especificado';
    const sector = ev?.usuarios?.sector || 'No especificado';
    const fechaEvalStr = ev?.fecha_evaluacion || planGroup.fecha_creacion;
    const nivelSemaforo = ev?.nivel_semaforo || 'REGULAR';

    let fechaFormateada = 'No registrada';
    if (fechaEvalStr) {
      try {
        fechaFormateada = formatDate(fechaEvalStr, { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch {
        fechaFormateada = fechaEvalStr.substring(0, 10);
      }
    }

    planGroup.items.forEach(item => {
      const dias = item.plazo_dias ? Number(item.plazo_dias) : 0;

      let fechaLimite = 'No calculada';
      if (fechaEvalStr && dias > 0) {
        try {
          const f = new Date(fechaEvalStr);
          f.setDate(f.getDate() + dias);
          fechaLimite = formatDate(f.toISOString(), { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
          fechaLimite = `${dias} días laborales`;
        }
      }

      rows.push({
        correlativo: count++,
        establecimiento,
        red,
        nivel_atencion: nivelAtencion,
        sector,
        fecha_evaluacion: fechaFormateada,
        nivel_semaforo: nivelSemaforo,
        plazo_dias: dias,
        fecha_limite: fechaLimite,
        responsable_1: item.responsable_1_nombre ? `${item.responsable_1_nombre} (${item.responsable_1_cargo || 'Dir. Técnico'})` : 'No asignado',
        responsable_2: item.responsable_2_nombre ? `${item.responsable_2_nombre} (${item.responsable_2_cargo || 'Vig. Epidem.'})` : 'No asignado',
        hallazgo: item.item_reprobado || 'Sin descripción',
        accion_correctiva: item.accion_correctiva || 'Sin acción correctiva',
        recursos_necesarios: item.recursos_necesarios || 'No especificado',
        estado: item.estado || 'PENDIENTE'
      });
    });
  });

  return rows;
}

// -------------------------------------------------------------------------
// Generador OpenXML (.xlsx) sin librerías externas
// -------------------------------------------------------------------------

function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getColumnLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// Algoritmo CRC-32 para empaquetado ZIP
function makeCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = makeCrc32Table();

function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0 ^ (-1);
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

interface ZipEntry {
  path: string;
  data: Uint8Array;
}

function createZipArchive(files: ZipEntry[]): Uint8Array {
  const textEncoder = new TextEncoder();
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let currentOffset = 0;

  for (const file of files) {
    const filenameBytes = textEncoder.encode(file.path);
    const dataBytes = file.data;
    const crc = calculateCrc32(dataBytes);
    const size = dataBytes.length;

    // Local Header (30 bytes + filename + data)
    const localHeader = new Uint8Array(30 + filenameBytes.length + size);
    const lhView = new DataView(localHeader.buffer);

    lhView.setUint32(0, 0x04034b50, true); // Local file header signature
    lhView.setUint16(4, 20, true);         // Version needed: 2.0
    lhView.setUint16(6, 0x0800, true);     // General flag (UTF-8)
    lhView.setUint16(8, 0, true);          // Compression: Store (0)
    lhView.setUint16(10, 0x5421, true);    // DOS time
    lhView.setUint16(12, 0x5421, true);    // DOS date
    lhView.setUint32(14, crc, true);       // CRC-32
    lhView.setUint32(18, size, true);      // Compressed size
    lhView.setUint32(22, size, true);      // Uncompressed size
    lhView.setUint16(26, filenameBytes.length, true); // Filename length
    lhView.setUint16(28, 0, true);         // Extra field length

    localHeader.set(filenameBytes, 30);
    localHeader.set(dataBytes, 30 + filenameBytes.length);
    localHeaders.push(localHeader);

    // Central Directory Header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + filenameBytes.length);
    const chView = new DataView(centralHeader.buffer);

    chView.setUint32(0, 0x02014b50, true); // Central directory header signature
    chView.setUint16(4, 20, true);         // Version made by: 2.0
    chView.setUint16(6, 20, true);         // Version needed: 2.0
    chView.setUint16(8, 0x0800, true);     // General flag (UTF-8)
    chView.setUint16(10, 0, true);         // Compression: 0
    chView.setUint16(12, 0x5421, true);    // DOS time
    chView.setUint16(14, 0x5421, true);    // DOS date
    chView.setUint32(16, crc, true);       // CRC-32
    chView.setUint32(20, size, true);      // Compressed size
    chView.setUint32(24, size, true);      // Uncompressed size
    chView.setUint16(28, filenameBytes.length, true); // Filename length
    chView.setUint16(30, 0, true);         // Extra field length
    chView.setUint16(32, 0, true);         // File comment length
    chView.setUint16(34, 0, true);         // Disk number start
    chView.setUint16(36, 0, true);         // Internal attributes
    chView.setUint32(38, 0, true);         // External attributes
    chView.setUint32(42, currentOffset, true); // Relative offset of local header

    centralHeader.set(filenameBytes, 46);
    centralHeaders.push(centralHeader);

    currentOffset += localHeader.length;
  }

  const centralDirOffset = currentOffset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) centralDirSize += ch.length;

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // End of central directory signature
  eocdView.setUint16(4, 0, true);          // Disk number
  eocdView.setUint16(6, 0, true);          // Central dir start disk
  eocdView.setUint16(8, files.length, true);  // Entries on this disk
  eocdView.setUint16(10, files.length, true); // Total entries
  eocdView.setUint32(12, centralDirSize, true); // Central dir size
  eocdView.setUint32(16, centralDirOffset, true); // Central dir offset
  eocdView.setUint16(20, 0, true);         // Comment length

  // Unir todas las partes en un único Uint8Array
  const totalLength = centralDirOffset + centralDirSize + eocd.length;
  const result = new Uint8Array(totalLength);
  let pos = 0;

  for (const lh of localHeaders) {
    result.set(lh, pos);
    pos += lh.length;
  }
  for (const ch of centralHeaders) {
    result.set(ch, pos);
    pos += ch.length;
  }
  result.set(eocd, pos);

  return result;
}

/**
 * Genera y descarga el archivo Excel (.xlsx) con los planes de mejora
 */
export function exportPlanesMejoraToExcel(
  planesMejora: PlanMejoraGrouped[],
  evaluaciones: EvaluacionMeta[] = []
): boolean {
  try {
    const rows = flattenPlanesData(planesMejora, evaluaciones);
    const encoder = new TextEncoder();

    const headers = [
      'N°',
      'Establecimiento de Salud',
      'Red de Salud',
      'Nivel de Atención',
      'Sector',
      'Fecha Evaluación',
      'Semáforo',
      'Plazo (Días)',
      'Fecha Límite Estimada',
      'Director Técnico (Resp. 1)',
      'Vigilancia Epidemiológica (Resp. 2)',
      'Ítem / Hallazgo Observado (0 o 1)',
      'Acción Correctiva Propuesta',
      'Recursos Necesarios',
      'Estado'
    ];

    // Anchos de columna preconfigurados
    const colWidths = [6, 32, 18, 16, 14, 16, 14, 14, 18, 28, 28, 42, 45, 32, 14];
    let colsXml = '<cols>';
    colWidths.forEach((w, idx) => {
      colsXml += `<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`;
    });
    colsXml += '</cols>';

    const now = new Date();
    const fechaEmision = formatDate(now.toISOString(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const totalEstablecimientos = planesMejora.length;
    const totalHallazgos = rows.length;

    // Construcción de filas XML para Sheet1 con encabezado institucional
    let sheetDataXml = '<sheetData>';

    // Fila 1: Título Institucional Principal (fuente 15pt bold verde azulado)
    sheetDataXml += '<row r="1" ht="28" customHeight="1">';
    sheetDataXml += `<c r="A1" s="3" t="inlineStr"><is><t>SERVICIO DEPARTAMENTAL DE SALUD (SEDES)</t></is></c>`;
    sheetDataXml += '</row>';

    // Fila 2: Subtítulo Oficial
    sheetDataXml += '<row r="2" ht="22" customHeight="1">';
    sheetDataXml += `<c r="A2" s="4" t="inlineStr"><is><t>MATRIZ OFICIAL CONSOLIDADA DE PLANES DE MEJORA Y ACCIONES CORRECTIVAS</t></is></c>`;
    sheetDataXml += '</row>';

    // Fila 3: Metadatos de Emisión y Totales
    sheetDataXml += '<row r="3" ht="20" customHeight="1">';
    sheetDataXml += `<c r="A3" s="5" t="inlineStr"><is><t>Fecha de Emisión: ${fechaEmision} | Establecimientos Evaluados: ${totalEstablecimientos} | Total de Acciones de Mejora: ${totalHallazgos}</t></is></c>`;
    sheetDataXml += '</row>';

    // Fila 4: Espacio separador
    sheetDataXml += '<row r="4" ht="10" customHeight="1"></row>';

    // Fila 5: Cabecera de Columnas con estilo s="1" (fondo verde azulado oscuro, texto blanco y negrita)
    sheetDataXml += '<row r="5" ht="30" customHeight="1">';
    headers.forEach((h, colIdx) => {
      const cellRef = `${getColumnLetter(colIdx)}5`;
      sheetDataXml += `<c r="${cellRef}" s="1" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`;
    });
    sheetDataXml += '</row>';

    // Filas de datos (a partir de la fila 6)
    rows.forEach((row, rowIdx) => {
      const rNum = rowIdx + 6;
      const rowValues = [
        row.correlativo,
        row.establecimiento,
        row.red,
        row.nivel_atencion,
        row.sector,
        row.fecha_evaluacion,
        row.nivel_semaforo,
        row.plazo_dias,
        row.fecha_limite,
        row.responsable_1,
        row.responsable_2,
        row.hallazgo,
        row.accion_correctiva,
        row.recursos_necesarios,
        row.estado
      ];

      sheetDataXml += `<row r="${rNum}" ht="22" customHeight="1">`;
      rowValues.forEach((val, colIdx) => {
        const cellRef = `${getColumnLetter(colIdx)}${rNum}`;
        const isNum = typeof val === 'number';
        if (isNum) {
          sheetDataXml += `<c r="${cellRef}" s="2"><v>${val}</v></c>`;
        } else {
          sheetDataXml += `<c r="${cellRef}" s="0" t="inlineStr"><is><t>${escapeXml(String(val))}</t></is></c>`;
        }
      });
      sheetDataXml += '</row>';
    });

    sheetDataXml += '</sheetData>';

    // XML Components
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

    const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Planes de Mejora" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

    const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="6">
    <font><sz val="10"/><name val="Segoe UI"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/></font>
    <font><sz val="10"/><name val="Segoe UI"/></font>
    <font><b/><sz val="15"/><color rgb="FF0F766E"/><name val="Segoe UI"/></font>
    <font><b/><sz val="11"/><color rgb="FF1E293B"/><name val="Segoe UI"/></font>
    <font><i/><sz val="9"/><color rgb="FF475569"/><name val="Segoe UI"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFE2E8F0"/></left>
      <right style="thin"><color rgb="FFE2E8F0"/></right>
      <top style="thin"><color rgb="FFE2E8F0"/></top>
      <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="5" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`;

    const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  ${colsXml}
  ${sheetDataXml}
</worksheet>`;

    const files: ZipEntry[] = [
      { path: '[Content_Types].xml', data: encoder.encode(contentTypesXml) },
      { path: '_rels/.rels', data: encoder.encode(rootRelsXml) },
      { path: 'xl/workbook.xml', data: encoder.encode(workbookXml) },
      { path: 'xl/_rels/workbook.xml.rels', data: encoder.encode(workbookRelsXml) },
      { path: 'xl/styles.xml', data: encoder.encode(stylesXml) },
      { path: 'xl/worksheets/sheet1.xml', data: encoder.encode(sheet1Xml) }
    ];

    const zipBytes = createZipArchive(files);
    const blob = new Blob([zipBytes.buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `Planes_de_Mejora_SEDES_${dateStr}.xlsx`;

    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (error) {
    console.error('Error generando archivo Excel:', error);
    return false;
  }
}

/**
 * Genera y descarga el archivo CSV con delimitador punto y coma y BOM UTF-8 (compatible directo con Excel en español)
 */
export function exportPlanesMejoraToCSV(
  planesMejora: PlanMejoraGrouped[],
  evaluaciones: EvaluacionMeta[] = []
): boolean {
  try {
    const rows = flattenPlanesData(planesMejora, evaluaciones);

    const headers = [
      'N°',
      'Establecimiento de Salud',
      'Red de Salud',
      'Nivel de Atención',
      'Sector',
      'Fecha Evaluación',
      'Semáforo',
      'Plazo (Días)',
      'Fecha Límite Estimada',
      'Director Técnico (Resp. 1)',
      'Vigilancia Epidemiológica (Resp. 2)',
      'Ítem / Hallazgo Observado (0 o 1)',
      'Acción Correctiva Propuesta',
      'Recursos Necesarios',
      'Estado'
    ];

    const escapeCsv = (str: any) => {
      const val = str === null || str === undefined ? '' : String(str);
      return `"${val.replace(/"/g, '""')}"`;
    };

    const now = new Date();
    const fechaEmision = formatDate(now.toISOString(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let csvContent = '\uFEFF'; // BOM para que Excel detecte UTF-8 automáticamente
    csvContent += `"SERVICIO DEPARTAMENTAL DE SALUD (SEDES)"\r\n`;
    csvContent += `"MATRIZ OFICIAL CONSOLIDADA DE PLANES DE MEJORA Y ACCIONES CORRECTIVAS"\r\n`;
    csvContent += `"Fecha de Emisión: ${fechaEmision} | Establecimientos Evaluados: ${planesMejora.length} | Total Acciones de Mejora: ${rows.length}"\r\n`;
    csvContent += `\r\n`;
    csvContent += headers.map(escapeCsv).join(';') + '\r\n';

    rows.forEach(r => {
      const line = [
        r.correlativo,
        r.establecimiento,
        r.red,
        r.nivel_atencion,
        r.sector,
        r.fecha_evaluacion,
        r.nivel_semaforo,
        r.plazo_dias,
        r.fecha_limite,
        r.responsable_1,
        r.responsable_2,
        r.hallazgo,
        r.accion_correctiva,
        r.recursos_necesarios,
        r.estado
      ].map(escapeCsv).join(';');
      csvContent += line + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `Planes_de_Mejora_SEDES_${dateStr}.csv`;

    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (error) {
    console.error('Error generando archivo CSV:', error);
    return false;
  }
}
