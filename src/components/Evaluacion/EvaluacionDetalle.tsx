import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, CheckCircle, AlertTriangle, ShieldAlert, LayoutList, ChevronDown, ChevronUp, Award, Star, Activity, TrendingUp, Building2, MapPin, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import GraficoResultados from '../Admin/GraficoResultados';
import GraficoSeccion2 from '../Admin/GraficoSeccion2';
import GraficoSeccion3 from '../Admin/GraficoSeccion3';
import GraficoResultadosGlobal from '../Admin/GraficoResultadosGlobal';

export default function EvaluacionDetalle() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [ev, setEv] = useState<any>(null);
  const [isSection3Open, setIsSection3Open] = useState(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans">
        <div className="relative">
          <div className="absolute inset-0 bg-teal-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-400 relative z-10"></div>
        </div>
      </div>
    );
  }

  if (!ev) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-200 font-sans">
        <ShieldAlert className="h-24 w-24 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse" />
        <h2 className="text-3xl font-black tracking-tight mb-2">Evaluación no encontrada</h2>
        <p className="text-slate-400 mb-8">El registro que buscas no existe o fue eliminado.</p>
        <Link to="/" className="px-8 py-3 bg-gradient-to-r from-teal-600 to-teal-400 text-white font-bold rounded-xl hover:from-teal-500 hover:to-teal-300 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] hover:-translate-y-1">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const getSemaforoIcon = (nivel: string, sizeClass = "h-8 w-8") => {
    if (nivel === 'ÓPTIMO') return <CheckCircle className={`${sizeClass} text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]`} />;
    if (nivel === 'REGULAR') return <AlertTriangle className={`${sizeClass} text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]`} />;
    return <ShieldAlert className={`${sizeClass} text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]`} />;
  };

  const getSemaforoTheme = (nivel: string) => {
    if (nivel === 'ÓPTIMO') return {
      bg: 'from-emerald-900/40 to-slate-900',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]'
    };
    if (nivel === 'REGULAR') return {
      bg: 'from-amber-900/40 to-slate-900',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]'
    };
    if (!nivel) return {
      bg: 'from-slate-800 to-slate-900',
      border: 'border-slate-700',
      text: 'text-slate-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      glow: 'shadow-2xl'
    };
    return {
      bg: 'from-rose-900/40 to-slate-900',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      glow: 'shadow-[0_0_30px_rgba(225,29,72,0.15)]'
    };
  };

  const theme = getSemaforoTheme(ev.nivel_semaforo);
  const isFinalizado = ev.estado === 'FINALIZADO';

  return (
    <div className="min-h-screen bg-slate-950 pb-16 font-sans text-slate-200 selection:bg-teal-500/30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      {/* HEADER NAVBAR */}
      <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center text-slate-400 hover:text-white transition-colors font-bold text-sm bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-xl border border-slate-700/50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Volver al Inicio</span>
            <span className="sm:hidden">Volver</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block mr-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estado del Reporte</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest flex items-center shadow-lg ${
              isFinalizado 
                ? 'bg-teal-500/10 text-teal-400 border-teal-500/30 shadow-teal-500/10' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/10'
            }`}>
              {isFinalizado ? <CheckCircle className="h-3 w-3 mr-2" /> : <Activity className="h-3 w-3 mr-2 animate-pulse" />}
              {ev.estado}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* HERO SECTION - DICTAMEN */}
        <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${theme.bg} border ${theme.border} ${theme.glow} mb-12 group transition-all duration-700`}>
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none transform group-hover:scale-110 transition-transform duration-1000">
            <Award className="w-64 h-64 md:w-96 md:h-96" />
          </div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 p-8 md:p-12 flex flex-col lg:flex-row justify-between gap-10">
            
            {/* Info Institucional */}
            <div className="flex-1">
              <div className="inline-flex items-center space-x-2 mb-4">
                <Star className={`h-5 w-5 ${theme.text}`} />
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${theme.text}`}>Resultados de Evaluación</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-6 uppercase leading-tight drop-shadow-md">
                {ev.establecimiento_salud}
              </h1>
              
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/50">
                  <Building2 className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-sm font-semibold text-slate-300">Nivel: {ev.nivel_atencion || '-'}</span>
                </div>
                <div className="flex items-center bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/50">
                  <MapPin className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-sm font-semibold text-slate-300">Red: {ev.red_salud || '-'}</span>
                </div>
                <div className="flex items-center bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/50">
                  <LayoutList className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-sm font-semibold text-slate-300">Sector: {ev.usuarios?.sector || '-'}</span>
                </div>
              </div>
            </div>
            
            {/* SCORE CARD */}
            {isFinalizado && (
              <div className="lg:w-[400px] shrink-0 flex flex-col sm:flex-row bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl relative">
                {/* Glow behind score */}
                <div className={`absolute inset-0 opacity-20 blur-2xl ${theme.badge.split(' ')[0]}`}></div>
                
                <div className="relative p-6 sm:p-8 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-700/50 flex-1">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Puntaje Final</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl sm:text-6xl font-black text-white drop-shadow-lg tracking-tighter">{ev.puntaje_total}</span>
                    <span className="text-slate-500 text-xl font-bold ml-1">/92</span>
                  </div>
                  
                  {/* Progress bar visual */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${theme.bg.split(' ')[0].replace('from-', 'bg-')} transition-all duration-1000 ease-out`}
                      style={{ width: `${(ev.puntaje_total / 92) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="relative p-6 sm:p-8 flex flex-col items-center justify-center flex-1 bg-white/5">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Clasificación</p>
                  <div className="mb-3 animate-bounce">
                    {getSemaforoIcon(ev.nivel_semaforo, "w-10 h-10")}
                  </div>
                  <span className={`font-black text-xl tracking-wider uppercase ${theme.text} drop-shadow-md`}>
                    {ev.nivel_semaforo}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DETALLES DE SECCIONES */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-teal-500 mr-3" />
            <h2 className="text-2xl font-black text-white tracking-tight">Desglose de Calificación</h2>
          </div>
          {isFinalizado && (
            <button
              onClick={() => setModalTelarana({ isOpen: true, tab: 'global' })}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_30px_rgba(20,184,166,0.45)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
              title="Abrir visor completo de reportes de telaraña"
            >
              <Activity className="w-4 h-4 mr-2 text-slate-950" />
              Ver Reportes de Telaraña
            </button>
          )}
        </div>

        <div className="grid gap-6 relative">
          
          {/* SECCION 1 */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-slate-900/50 group">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform">
                  <LayoutList className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-teal-500 text-[10px] font-black uppercase tracking-widest mb-1">Sección I</p>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-200 tracking-tight">Conformación del CVEH</h3>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-slate-950 px-6 py-3 rounded-xl border border-slate-800 shadow-inner">
                  <span className="text-3xl font-black text-white mr-2">{ev.puntaje_sec_1}</span>
                  <span className="text-slate-500 font-bold">/ 10</span>
                </div>
                <button
                  onClick={() => setModalTelarana({ isOpen: true, tab: 'sec1' })}
                  className="flex items-center space-x-1.5 px-4 py-3 bg-teal-500/10 hover:bg-teal-500 text-teal-300 hover:text-slate-950 border border-teal-500/30 rounded-xl font-bold text-xs transition-all shadow-sm group hover:scale-105 cursor-pointer"
                  title="Ver Reporte Gráfico de Telaraña de Sección 1"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Telaraña</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECCION 2 */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-slate-900/50 group">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform">
                  <LayoutList className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-1">Sección II</p>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-200 tracking-tight">Subcomités Operativos</h3>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-slate-950 px-6 py-3 rounded-xl border border-slate-800 shadow-inner">
                  <span className="text-3xl font-black text-white mr-2">{ev.puntaje_sec_2}</span>
                  <span className="text-slate-500 font-bold">/ 16</span>
                </div>
                <button
                  onClick={() => setModalTelarana({ isOpen: true, tab: 'sec2' })}
                  className="flex items-center space-x-1.5 px-4 py-3 bg-blue-500/10 hover:bg-blue-500 text-blue-300 hover:text-slate-950 border border-blue-500/30 rounded-xl font-bold text-xs transition-all shadow-sm group hover:scale-105 cursor-pointer"
                  title="Ver Reporte Gráfico de Telaraña de Sección 2"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Telaraña</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECCION 3 - EXPANDIBLE */}
          <div className={`bg-slate-900/50 backdrop-blur-sm border rounded-2xl overflow-hidden transition-all group ${isSection3Open ? 'border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/50'}`}>
            <button 
              onClick={() => setIsSection3Open(!isSection3Open)}
              className="w-full p-6 sm:p-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 hover:bg-white/5 transition-colors focus:outline-none text-left"
            >
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-5 transition-transform ${isSection3Open ? 'bg-purple-500/20 border-purple-500/40 scale-110' : 'bg-purple-500/10 border-purple-500/20 group-hover:scale-110'}`}>
                  <Activity className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-purple-500 text-[10px] font-black uppercase tracking-widest mb-1">Sección III</p>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-200 tracking-tight">Evaluación de Funciones</h3>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center bg-slate-950 px-6 py-3 rounded-xl border border-slate-800 shadow-inner">
                  <span className="text-3xl font-black text-white mr-2">{ev.puntaje_sec_3_residuos + ev.puntaje_sec_3_bioseguridad + ev.puntaje_sec_3_iaas + ev.puntaje_sec_3_cai}</span>
                  <span className="text-slate-500 font-bold">/ 66</span>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${isSection3Open ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {isSection3Open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </button>
            
            {isSection3Open && (
              <div className="p-6 sm:p-8 grid gap-4 animate-in slide-in-from-top-4 duration-300 border-t border-slate-800 bg-slate-950/50">
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-colors group/item">
                  <div className="flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-xs mr-4">1</span>
                    <span className="text-slate-300 font-bold tracking-wide">Residuos Hospitalarios</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center font-black bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-lg">
                      <span className="text-emerald-400 text-lg mr-1">{ev.puntaje_sec_3_residuos}</span>
                      <span className="text-emerald-400/50 text-xs">/ 14</span>
                    </div>
                    <button
                      onClick={() => setModalTelarana({ isOpen: true, tab: 'residuos' })}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all hover:scale-105 cursor-pointer"
                      title="Ver Telaraña de Residuos Hospitalarios"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Telaraña</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800 hover:border-amber-500/30 transition-colors group/item">
                  <div className="flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-xs mr-4">2</span>
                    <span className="text-slate-300 font-bold tracking-wide">Bioseguridad</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center font-black bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-lg">
                      <span className="text-amber-400 text-lg mr-1">{ev.puntaje_sec_3_bioseguridad}</span>
                      <span className="text-amber-400/50 text-xs">/ 14</span>
                    </div>
                    <button
                      onClick={() => setModalTelarana({ isOpen: true, tab: 'bioseguridad' })}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 rounded-lg text-xs font-bold transition-all hover:scale-105 cursor-pointer"
                      title="Ver Telaraña de Bioseguridad"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Telaraña</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800 hover:border-rose-500/30 transition-colors group/item">
                  <div className="flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-black text-xs mr-4">3</span>
                    <span className="text-slate-300 font-bold tracking-wide">IAAS y RAM</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center font-black bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-lg">
                      <span className="text-rose-400 text-lg mr-1">{ev.puntaje_sec_3_iaas}</span>
                      <span className="text-rose-400/50 text-xs">/ 18</span>
                    </div>
                    <button
                      onClick={() => setModalTelarana({ isOpen: true, tab: 'iaas' })}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-slate-950 border border-rose-500/30 rounded-lg text-xs font-bold transition-all hover:scale-105 cursor-pointer"
                      title="Ver Telaraña de IAAS y RAM"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Telaraña</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-colors group/item">
                  <div className="flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-xs mr-4">4</span>
                    <span className="text-slate-300 font-bold tracking-wide">Análisis de Información (CAI)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center font-black bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-lg">
                      <span className="text-indigo-400 text-lg mr-1">{ev.puntaje_sec_3_cai}</span>
                      <span className="text-indigo-400/50 text-xs">/ 20</span>
                    </div>
                    <button
                      onClick={() => setModalTelarana({ isOpen: true, tab: 'cai' })}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-300 hover:text-slate-950 border border-indigo-500/30 rounded-lg text-xs font-bold transition-all hover:scale-105 cursor-pointer"
                      title="Ver Telaraña de Análisis de Información (CAI)"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Telaraña</span>
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
          
        </div>

        {/* MODAL DE REPORTES DE TELARAÑA (RADAR) */}
        {modalTelarana.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
            <div className="bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
              
              {/* Header del Modal */}
              <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-950/80">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg tracking-tight">
                      Reporte de Telaraña (Gráfico Radar)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Visualización epidemiológica de desempeño por sección y áreas
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalTelarana(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selector de Pestañas (Tabs) */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-900/90 overflow-x-auto scrollbar-thin">
                {[
                  { id: 'global', label: '🌐 Global' },
                  { id: 'sec1', label: '📋 Sec. I: CVEH' },
                  { id: 'sec2', label: '🏢 Sec. II: Subcomités' },
                  { id: 'residuos', label: '☣️ III: Residuos' },
                  { id: 'bioseguridad', label: '🛡️ III: Bioseguridad' },
                  { id: 'iaas', label: '🦠 III: IAAS y RAM' },
                  { id: 'cai', label: '📈 III: Análisis (CAI)' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setModalTelarana(prev => ({ ...prev, tab: tab.id as any }))}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      modalTelarana.tab === tab.id
                        ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Contenedor del Gráfico */}
              <div className="p-4 sm:p-6 bg-slate-950/40">
                <div className="bg-white rounded-2xl p-2 sm:p-4 shadow-inner">
                  {modalTelarana.tab === 'global' && <GraficoResultadosGlobal evaluacion={ev} />}
                  {modalTelarana.tab === 'sec1' && <GraficoResultados evaluacion={ev} />}
                  {modalTelarana.tab === 'sec2' && <GraficoSeccion2 evaluacion={ev} />}
                  {['residuos', 'bioseguridad', 'iaas', 'cai'].includes(modalTelarana.tab) && (
                    <GraficoSeccion3 evaluacion={ev} subcomite={modalTelarana.tab as any} />
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
