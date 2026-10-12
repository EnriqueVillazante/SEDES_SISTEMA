import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, ShieldAlert, LayoutList,
  ChevronDown, ChevronUp, Star, Activity, TrendingUp,
  Building2, MapPin, Eye, X, AlertCircle, XCircle,
  FileCheck2, User, Calendar, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import GraficoResultados from '../Admin/GraficoResultados';
import GraficoSeccion2 from '../Admin/GraficoSeccion2';
import GraficoSeccion3 from '../Admin/GraficoSeccion3';
import GraficoResultadosGlobal from '../Admin/GraficoResultadosGlobal';
import { formatDate } from '../../utils/dateUtils';

export default function EvaluacionDetalle() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [ev, setEv] = useState<any>(null);
  const [isSection3Open, setIsSection3Open] = useState(true);
  const [modalTelarana, setModalTelarana] = useState<{
    isOpen: boolean;
    tab: 'global' | 'sec1' | 'sec2' | 'residuos' | 'bioseguridad' | 'iaas' | 'cai';
  }>({
    isOpen: searchParams.get('tab') === 'radar' || searchParams.get('telarana') === 'true',
    tab: 'global'
  });

  useEffect(() => {
    if (searchParams.get('tab') === 'radar' || searchParams.get('telarana') === 'true') {
      setModalTelarana(prev => ({ ...prev, isOpen: true }));
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('evaluaciones')
          .select('*, usuarios(nombre_completo, email, celular, cargo, sector), planes_mejora(id)')
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

  // Cálculo de estadísticas de respuestas (calificaciones 2, 1 y 0)
  const stats = useMemo(() => {
    if (!ev) return { count2: 0, count1: 0, count0: 0, total: 0 };
    let c2 = 0, c1 = 0, c0 = 0, tot = 0;

    const countDict = (dict: Record<string, any> | undefined) => {
      if (!dict) return;
      Object.values(dict).forEach(val => {
        const num = Number(val);
        if (val !== null && val !== undefined && val !== '' && !isNaN(num)) {
          if (num === 2) c2++;
          else if (num === 1) c1++;
          else if (num === 0) c0++;
          tot++;
        }
      });
    };

    countDict(ev.seccion_1_respuestas);
    countDict(ev.seccion_2_respuestas);
    countDict(ev.seccion_3_respuestas);

    return { count2: c2, count1: c1, count0: c0, total: tot };
  }, [ev]);



  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-teal-200 border-t-teal-600 shadow-md"></div>
          <p className="text-slate-500 font-semibold text-sm animate-pulse">Cargando reporte de evaluación...</p>
        </div>
      </div>
    );
  }

  if (!ev) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 font-sans p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-5 border border-rose-100 shadow-xs">
          <ShieldAlert className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black tracking-tight mb-2 text-slate-900">Evaluación no encontrada</h2>
        <p className="text-slate-500 mb-6 max-w-md">El registro solicitado no existe, fue eliminado o no cuenta con los permisos para visualizarlo.</p>
        <Link to="/" className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-md">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const getSemaforoIcon = (nivel: string, sizeClass = "h-8 w-8") => {
    if (nivel === 'ÓPTIMO') return <CheckCircle2 className={`${sizeClass} text-emerald-600`} />;
    if (nivel === 'REGULAR') return <AlertTriangle className={`${sizeClass} text-amber-500`} />;
    return <ShieldAlert className={`${sizeClass} text-rose-600`} />;
  };

  const getSemaforoTheme = (nivel: string) => {
    if (nivel === 'ÓPTIMO') return {
      gradient: 'from-emerald-500 via-teal-500 to-teal-600',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      heroBorder: 'border-emerald-200',
      accentText: 'text-emerald-700',
      scoreText: 'text-emerald-600',
      ringColor: '#10b981',
      desc: 'Desempeño Excelente. El establecimiento cumple satisfactoriamente con los estándares normados.'
    };
    if (nivel === 'REGULAR') return {
      gradient: 'from-amber-400 via-amber-500 to-orange-500',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      heroBorder: 'border-amber-200',
      accentText: 'text-amber-700',
      scoreText: 'text-amber-600',
      ringColor: '#f59e0b',
      desc: 'Desempeño Aceptable con Observaciones. Requiere ejecutar acciones correctivas en puntos débiles.'
    };
    return {
      gradient: 'from-rose-500 via-rose-600 to-red-600',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      heroBorder: 'border-rose-200',
      accentText: 'text-rose-700',
      scoreText: 'text-rose-600',
      ringColor: '#f43f5e',
      desc: 'Nivel Crítico. Se identificaron no conformidades graves que demandan un Plan de Mejora inmediato.'
    };
  };

  const getScoreStatus = (current: number, max: number) => {
    const pct = Math.round((current / max) * 100);
    if (pct >= 80) return { label: 'Óptimo', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', barColor: 'bg-emerald-500' };
    if (pct >= 60) return { label: 'Regular', color: 'text-amber-800 bg-amber-50 border-amber-200', barColor: 'bg-amber-500' };
    return { label: 'Crítico', color: 'text-rose-700 bg-rose-50 border-rose-200', barColor: 'bg-rose-500' };
  };

  const theme = getSemaforoTheme(ev.nivel_semaforo);
  const isFinalizado = ev.estado === 'FINALIZADO';
  const percentage = ev.porcentaje || Math.round((ev.puntaje_total / 92) * 100);
  const sec3Total = (ev.puntaje_sec_3_residuos || 0) + (ev.puntaje_sec_3_bioseguridad || 0) + (ev.puntaje_sec_3_iaas || 0) + (ev.puntaje_sec_3_cai || 0);

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, percentage))) / 100;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800 antialiased">

      {/* HEADER NAVBAR SUPERIOR */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">

          <Link
            to="/"
            className="inline-flex items-center text-slate-700 hover:text-slate-900 transition-colors font-bold text-sm bg-slate-100 hover:bg-slate-200/80 px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Volver al Panel</span>
            <span className="sm:hidden">Volver</span>
          </Link>

          <div className="flex items-center space-x-3">
            <div className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center shadow-2xs ${isFinalizado
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
              {isFinalizado ? <CheckCircle2 className="h-4 w-4 mr-1.5 text-teal-600" /> : <Activity className="h-4 w-4 mr-1.5 text-amber-600 animate-pulse" />}
              {ev.estado}
            </div>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">

        {/* HERO CARD PRINCIPAL - DICTAMEN DE EVALUACIÓN */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">

          {/* Banda vibrante con gradiente según nivel semáforo */}
          <div className={`h-3 w-full bg-gradient-to-r ${theme.gradient}`}></div>

          <div className="p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">

            {/* Información Institucional */}
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                <Star className={`h-4 w-4 ${theme.accentText} fill-current`} />
                <span className="text-[11px] font-black uppercase tracking-wider">Reporte Oficial de Evaluación</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                {ev.establecimiento_salud}
              </h1>

              <p className="text-sm text-slate-600 max-w-2xl font-medium leading-relaxed">
                {theme.desc}
              </p>

              {/* Grid de Metadatos del Hospital */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Building2 className="h-4 w-4 text-teal-600 mr-2.5 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nivel</p>
                    <p className="text-xs font-extrabold text-slate-800 truncate">{ev.nivel_atencion || 'No especificado'}</p>
                  </div>
                </div>

                <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <MapPin className="h-4 w-4 text-teal-600 mr-2.5 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Red de Salud</p>
                    <p className="text-xs font-extrabold text-slate-800 truncate">{ev.red_salud || 'No especificado'}</p>
                  </div>
                </div>

                <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <LayoutList className="h-4 w-4 text-teal-600 mr-2.5 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sector</p>
                    <p className="text-xs font-extrabold text-slate-800 truncate">{ev.usuarios?.sector || 'Público'}</p>
                  </div>
                </div>

                <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <User className="h-4 w-4 text-teal-600 mr-2.5 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsable</p>
                    <p className="text-xs font-extrabold text-slate-800 truncate">{ev.usuarios?.nombre_completo || 'Evaluador'}</p>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-2 flex items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Calendar className="h-4 w-4 text-teal-600 mr-2.5 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha de Evaluación</p>
                    <p className="text-xs font-extrabold text-slate-800">
                      {ev.fecha_evaluacion ? formatDate(ev.fecha_evaluacion, { day: 'numeric', month: 'long', year: 'numeric' }) : 'No registrada'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* SECCIÓN DE CALIFICACIÓN DE ALTO IMPACTO (RESALTADA) */}
            {isFinalizado && (
              <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4">

                {/* 1. Tarjeta Circular Gauge del Puntaje */}
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-md flex items-center space-x-6 min-w-[240px]">
                  {/* Gauge SVG */}
                  <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        className="stroke-slate-100"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke={theme.ringColor}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-900 leading-none">{percentage}%</span>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">Global</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Puntaje Final</span>
                    <div className="flex items-baseline">
                      <span className={`text-4xl font-black tracking-tight ${theme.scoreText}`}>{ev.puntaje_total}</span>
                      <span className="text-slate-400 font-black text-sm ml-1">/ 92</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 mt-1 block">
                      Total Puntos Obtenidos
                    </span>
                  </div>
                </div>

                {/* 2. Tarjeta del Nivel Semáforo */}
                <div className={`p-6 rounded-2xl border-2 ${theme.heroBorder} ${theme.badgeBg} flex flex-col items-center justify-center text-center min-w-[200px] shadow-sm relative overflow-hidden`}>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Clasificación SEDES</span>
                  <div className="mb-2.5 p-2 bg-white rounded-2xl shadow-xs border border-slate-100">
                    {getSemaforoIcon(ev.nivel_semaforo, "w-10 h-10")}
                  </div>
                  <h3 className={`font-black text-2xl tracking-wider uppercase ${theme.accentText}`}>
                    {ev.nivel_semaforo}
                  </h3>
                  <span className="text-xs font-bold text-slate-600 mt-1">
                    {percentage >= 80 ? '80% - 100%' : percentage >= 60 ? '60% - 79%' : 'Menos de 60%'}
                  </span>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* CINTA DE MÉTRICAS RÁPIDAS (KPIs) */}
        {isFinalizado && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Cumple Pleno (2 pts)</p>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-2xl font-black text-emerald-700">{stats.count2}</span>
                  <span className="text-xs font-bold text-slate-400">criterios</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Cumple Parcial (1 pt)</p>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-2xl font-black text-amber-700">{stats.count1}</span>
                  <span className="text-xs font-bold text-slate-400">criterios</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">No Cumple (0 pts)</p>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-2xl font-black text-rose-700">{stats.count0}</span>
                  <span className="text-xs font-bold text-slate-400">criterios</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Plan de Mejora</p>
                <div className="mt-0.5">
                  <span className={`text-sm font-black uppercase px-2 py-0.5 rounded-md ${
                    Boolean(ev.planes_mejora && ev.planes_mejora.length > 0)
                      ? 'bg-emerald-100 text-emerald-800'
                      : stats.count0 + stats.count1 > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                    {Boolean(ev.planes_mejora && ev.planes_mejora.length > 0)
                      ? 'Completado'
                      : stats.count0 + stats.count1 > 0
                        ? `${stats.count0 + stats.count1} Ítems`
                        : 'No requerido'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* BANNER DE ACCIÓN: PLAN DE MEJORA DISPONIBLE (Solo si no ha sido completado) */}
        {isFinalizado && (stats.count0 + stats.count1 > 0) && (!ev.planes_mejora || ev.planes_mejora.length === 0) && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 p-6 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-amber-950">
                  Oportunidades de Mejora Detectadas ({stats.count0 + stats.count1} hallazgos)
                </h4>
                <p className="text-xs sm:text-sm text-amber-900/80 mt-1 max-w-2xl font-medium">
                  Se registraron {stats.count0} ítems sin cumplimiento (calificación 0) y {stats.count1} con cumplimiento parcial (calificación 1). Puede generar formalmente el Plan de Acción Correctiva para solventar estos hallazgos.
                </p>
              </div>
            </div>
            <Link
              to="/plan-mejora/nuevo"
              className="inline-flex items-center justify-center px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all shrink-0 hover:shadow"
            >
              <span>Redactar Plan de Mejora</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        )}

        {/* SECCIÓN DESGLOSE DETALLADO */}
        <div className="space-y-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
                <TrendingUp className="h-6 w-6 text-teal-600 mr-2.5" />
                Desglose Analítico por Secciones
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Puntajes obtenidos en cada una de las 3 áreas normativas de vigilancia hospitalaria
              </p>
            </div>

            {isFinalizado && (
              <button
                onClick={() => setModalTelarana({ isOpen: true, tab: 'global' })}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer hover:shadow"
                title="Abrir visor completo de reportes de telaraña"
              >
                <Activity className="w-4 h-4 mr-2" />
                Ver Gráficos Radar (Telaraña)
              </button>
            )}
          </div>

          <div className="grid gap-6">

            {/* SECCIÓN I: CONFORMACIÓN DEL CVEH */}
            {(() => {
              const secStatus = getScoreStatus(ev.puntaje_sec_1 || 0, 10);
              const secPct = Math.round(((ev.puntaje_sec_1 || 0) / 10) * 100);
              return (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs hover:shadow-sm transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 font-black text-xl shadow-2xs">
                        I
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                            Área Normativa I
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${secStatus.color}`}>
                            {secStatus.label} ({secPct}%)
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                          Conformación del Comité de Vigilancia Epidemiológica (CVEH)
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Resolución administrativa, liderazgo técnico, periodicidad de reuniones y plan operativo.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end space-x-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">

                      {/* Puntaje Destacado */}
                      <div className="bg-teal-50/80 border-2 border-teal-200 px-5 py-2.5 rounded-2xl text-center min-w-[120px]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-teal-700 block">Puntaje</span>
                        <div className="flex items-baseline justify-center">
                          <span className="text-3xl font-black text-teal-800">{ev.puntaje_sec_1 || 0}</span>
                          <span className="text-teal-600 font-bold text-xs ml-1">/ 10 pts</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setModalTelarana({ isOpen: true, tab: 'sec1' })}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Ver Gráfico Radar de Sección I"
                      >
                        <Eye className="w-4 h-4 text-teal-600" />
                        <span className="hidden sm:inline">Telaraña</span>
                      </button>

                    </div>

                  </div>

                  {/* Barra de Progreso Visual */}
                  <div className="mt-5 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${secStatus.barColor}`}
                      style={{ width: `${secPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })()}

            {/* SECCIÓN II: SUBCOMITÉS OPERATIVOS */}
            {(() => {
              const secStatus = getScoreStatus(ev.puntaje_sec_2 || 0, 16);
              const secPct = Math.round(((ev.puntaje_sec_2 || 0) / 16) * 100);
              return (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs hover:shadow-sm transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 font-black text-xl shadow-2xs">
                        II
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            Área Normativa II
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${secStatus.color}`}>
                            {secStatus.label} ({secPct}%)
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                          Conformación de los 4 Subcomités Operativos
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Constitución formal, designación de liderazgo y regularidad de sesiones en cada subcomité.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end space-x-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">

                      {/* Puntaje Destacado */}
                      <div className="bg-blue-50/80 border-2 border-blue-200 px-5 py-2.5 rounded-2xl text-center min-w-[120px]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 block">Puntaje</span>
                        <div className="flex items-baseline justify-center">
                          <span className="text-3xl font-black text-blue-800">{ev.puntaje_sec_2 || 0}</span>
                          <span className="text-blue-600 font-bold text-xs ml-1">/ 16 pts</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setModalTelarana({ isOpen: true, tab: 'sec2' })}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Ver Gráfico Radar de Sección II"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span className="hidden sm:inline">Telaraña</span>
                      </button>

                    </div>

                  </div>

                  {/* Barra de Progreso Visual */}
                  <div className="mt-5 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${secStatus.barColor}`}
                      style={{ width: `${secPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })()}

            {/* SECCIÓN III: EVALUACIÓN DE FUNCIONES Y ACTIVIDADES (CON SUBCOMITÉS) */}
            {(() => {
              const secStatus = getScoreStatus(sec3Total, 66);
              const secPct = Math.round((sec3Total / 66) * 100);
              return (
                <div className={`bg-white border rounded-2xl shadow-2xs transition-all overflow-hidden ${isSection3Open ? 'border-purple-300 ring-2 ring-purple-100/80' : 'border-slate-200/90'
                  }`}>

                  {/* Encabezado colapsable de la Sección III */}
                  <button
                    onClick={() => setIsSection3Open(!isSection3Open)}
                    className="w-full p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/70 transition-colors focus:outline-none text-left cursor-pointer"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0 font-black text-xl shadow-2xs">
                        III
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                            Área Normativa III
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${secStatus.color}`}>
                            {secStatus.label} ({secPct}%)
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                          Evaluación de Funciones y Actividades Operativas
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Desempeño técnico en terreno de los 4 subcomités (Haga clic para ver el desglose).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end space-x-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">

                      {/* Puntaje Destacado */}
                      <div className="bg-purple-50/80 border-2 border-purple-200 px-5 py-2.5 rounded-2xl text-center min-w-[120px]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 block">Puntaje</span>
                        <div className="flex items-baseline justify-center">
                          <span className="text-3xl font-black text-purple-800">{sec3Total}</span>
                          <span className="text-purple-600 font-bold text-xs ml-1">/ 66 pts</span>
                        </div>
                      </div>

                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isSection3Open ? 'bg-purple-100 border-purple-300 text-purple-800' : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}>
                        {isSection3Open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>

                    </div>
                  </button>

                  {/* Barra de Progreso Global Sección III */}
                  <div className="px-6 sm:px-7 pb-4">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${secStatus.barColor}`}
                        style={{ width: `${secPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* SUBCOMITÉS EN GRID MODERNO */}
                  {isSection3Open && (
                    <div className="p-6 sm:p-7 border-t border-slate-200 bg-slate-50/60 animate-in slide-in-from-top-3 duration-200">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                        Desempeño Individual por Subcomité Especializado
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* 1. Residuos */}
                        {(() => {
                          const pts = ev.puntaje_sec_3_residuos || 0;
                          const st = getScoreStatus(pts, 14);
                          const pct = Math.round((pts / 14) * 100);
                          return (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    Subcomité 1
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${st.color}`}>
                                    {pct}% de meta
                                  </span>
                                </div>
                                <h5 className="font-extrabold text-slate-900 text-base">Residuos Hospitalarios</h5>
                                <p className="text-xs text-slate-500 mt-0.5">Manejo, separación en origen y almacenamiento de residuos bioinfecciosos.</p>
                              </div>

                              <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-baseline">
                                    <span className="text-2xl font-black text-emerald-700">{pts}</span>
                                    <span className="text-slate-400 font-bold text-xs ml-1">/ 14 pts</span>
                                  </div>
                                  <button
                                    onClick={() => setModalTelarana({ isOpen: true, tab: 'residuos' })}
                                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Ver Radar</span>
                                  </button>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${st.barColor}`} style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 2. Bioseguridad */}
                        {(() => {
                          const pts = ev.puntaje_sec_3_bioseguridad || 0;
                          const st = getScoreStatus(pts, 14);
                          const pct = Math.round((pts / 14) * 100);
                          return (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition-all">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                    Subcomité 2
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${st.color}`}>
                                    {pct}% de meta
                                  </span>
                                </div>
                                <h5 className="font-extrabold text-slate-900 text-base">Bioseguridad</h5>
                                <p className="text-xs text-slate-500 mt-0.5">Equipos de protección personal, higiene de manos y protocolos hospitalarios.</p>
                              </div>

                              <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-baseline">
                                    <span className="text-2xl font-black text-amber-700">{pts}</span>
                                    <span className="text-slate-400 font-bold text-xs ml-1">/ 14 pts</span>
                                  </div>
                                  <button
                                    onClick={() => setModalTelarana({ isOpen: true, tab: 'bioseguridad' })}
                                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Ver Radar</span>
                                  </button>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${st.barColor}`} style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 3. IAAS y RAM */}
                        {(() => {
                          const pts = ev.puntaje_sec_3_iaas || 0;
                          const st = getScoreStatus(pts, 18);
                          const pct = Math.round((pts / 18) * 100);
                          return (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4 hover:border-rose-300 transition-all">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                    Subcomité 3
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${st.color}`}>
                                    {pct}% de meta
                                  </span>
                                </div>
                                <h5 className="font-extrabold text-slate-900 text-base">IAAS y Vigilancia de RAM</h5>
                                <p className="text-xs text-slate-500 mt-0.5">Control de infecciones intrahospitalarias y resistencia antimicrobiana.</p>
                              </div>

                              <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-baseline">
                                    <span className="text-2xl font-black text-rose-700">{pts}</span>
                                    <span className="text-slate-400 font-bold text-xs ml-1">/ 18 pts</span>
                                  </div>
                                  <button
                                    onClick={() => setModalTelarana({ isOpen: true, tab: 'iaas' })}
                                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-800 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Ver Radar</span>
                                  </button>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${st.barColor}`} style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 4. CAI */}
                        {(() => {
                          const pts = ev.puntaje_sec_3_cai || 0;
                          const st = getScoreStatus(pts, 20);
                          const pct = Math.round((pts / 20) * 100);
                          return (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                    Subcomité 4
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${st.color}`}>
                                    {pct}% de meta
                                  </span>
                                </div>
                                <h5 className="font-extrabold text-slate-900 text-base">Comité de Análisis de Información (CAI)</h5>
                                <p className="text-xs text-slate-500 mt-0.5">Sistemas de notificación obligatoria, sala situacional y reportes epidemiológicos.</p>
                              </div>

                              <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-baseline">
                                    <span className="text-2xl font-black text-indigo-700">{pts}</span>
                                    <span className="text-slate-400 font-bold text-xs ml-1">/ 20 pts</span>
                                  </div>
                                  <button
                                    onClick={() => setModalTelarana({ isOpen: true, tab: 'cai' })}
                                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Ver Radar</span>
                                  </button>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${st.barColor}`} style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

          </div>

        </div>

        {/* MODAL PARA GRÁFICOS RADAR (TELARAÑA) */}
        {modalTelarana.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">

              {/* Header del Modal */}
              <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-200 bg-slate-50/80">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 shadow-2xs">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
                      Visor Epidemiológico Radar (Telaraña)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Análisis visual de cobertura y rendimiento por componente
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalTelarana(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selector de Pestañas (Tabs) */}
              <div className="flex items-center gap-2 p-3 sm:px-6 border-b border-slate-200 bg-slate-100/70 overflow-x-auto scrollbar-thin">
                {[
                  { id: 'global', label: '🌐 Global General' },
                  { id: 'sec1', label: '📋 Sec. I: CVEH' },
                  { id: 'sec2', label: '🏢 Sec. II: Subcomités' },
                  { id: 'residuos', label: '☣️ III: Residuos' },
                  { id: 'bioseguridad', label: '🛡️ III: Bioseguridad' },
                  { id: 'iaas', label: '🦠 III: IAAS / RAM' },
                  { id: 'cai', label: '📈 III: Análisis (CAI)' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setModalTelarana(prev => ({ ...prev, tab: tab.id as any }))}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${modalTelarana.tab === tab.id
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/90 hover:bg-slate-50'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Contenedor del Gráfico */}
              <div className="p-4 sm:p-8 bg-white">
                <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-6 border border-slate-200 flex items-center justify-center min-h-[420px]">
                  {modalTelarana.tab === 'global' && <GraficoResultadosGlobal evaluacion={ev} />}
                  {modalTelarana.tab === 'sec1' && <GraficoResultados evaluacion={ev} />}
                  {modalTelarana.tab === 'sec2' && <GraficoSeccion2 evaluacion={ev} />}
                  {['residuos', 'bioseguridad', 'iaas', 'cai'].includes(modalTelarana.tab) && (
                    <GraficoSeccion3 evaluacion={ev} subcomite={modalTelarana.tab as any} />
                  )}
                </div>
              </div>

              {/* Footer del Modal */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setModalTelarana(prev => ({ ...prev, isOpen: false }))}
                  className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors"
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
