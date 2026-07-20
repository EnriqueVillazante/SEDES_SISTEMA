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
