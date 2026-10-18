export const formatDate = (dateString: string | null | undefined, options?: Intl.DateTimeFormatOptions) => {
  if (!dateString) return '-';

  try {
    // Si la fecha de Supabase es "2026-07-20" o "2026-07-20T00:00:00+00:00"
    // Al hacer new Date() en Bolivia (UTC-4), las 00:00 UTC se convierten en 20:00 del DÍA ANTERIOR.
    // Para evitar que el día se recorra hacia atrás, extraemos exactamente el YYYY-MM-DD original:

    const isoDatePart = dateString.split('T')[0]; // Toma "2026-07-20"
    const [year, month, day] = isoDatePart.split('-');

    // Creamos la fecha localmente fijando las 12:00 del mediodía para evitar cualquier salto de día
    const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);

    return date.toLocaleDateString('es-ES', options);
  } catch (error) {
    // Fallback seguro en caso de formato inesperado
    return new Date(dateString).toLocaleDateString('es-ES', options);
  }
};

/**
 * Suma días laborales (lunes a viernes, omitiendo fines de semana) a una fecha dada.
 */
export const addBusinessDays = (baseDate: Date | string, days: number): Date => {
  let date: Date;
  if (typeof baseDate === 'string') {
    const isoDatePart = baseDate.split('T')[0];
    const parts = isoDatePart.split('-');
    if (parts.length === 3) {
      date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    } else {
      date = new Date(baseDate);
    }
  } else {
    date = new Date(baseDate);
  }

  let count = 0;
  while (count < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    // 0 es Domingo, 6 es Sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  return date;
};

/**
 * Calcula la diferencia en días laborales entre dos fechas.
 * Si targetDate es posterior a fromDate, devuelve positivo; si ya pasó, devuelve negativo.
 */
export const getBusinessDaysDiff = (fromDate: Date | string, targetDate: Date | string): number => {
  const start = typeof fromDate === 'string' ? new Date(fromDate) : new Date(fromDate);
  start.setHours(0, 0, 0, 0);
  const end = typeof targetDate === 'string' ? new Date(targetDate) : new Date(targetDate);
  end.setHours(0, 0, 0, 0);

  if (start.getTime() === end.getTime()) return 0;

  const isPositive = end.getTime() > start.getTime();
  let current = new Date(isPositive ? start : end);
  const finish = new Date(isPositive ? end : start);
  let businessDays = 0;

  while (current < finish) {
    current.setDate(current.getDate() + 1);
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
  }

  return isPositive ? businessDays : -businessDays;
};
