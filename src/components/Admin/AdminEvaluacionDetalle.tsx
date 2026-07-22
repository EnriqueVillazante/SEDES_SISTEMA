import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, CheckCircle, AlertTriangle, ShieldAlert, FileText, LayoutList, Eye, X, Activity, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import GraficoResultados from './GraficoResultados';
import GraficoSeccion2 from './GraficoSeccion2';
import GraficoSeccion3 from './GraficoSeccion3';
import GraficoResultadosGlobal from './GraficoResultadosGlobal';
import { generatePDF, formatKeyName } from '../../utils/pdfGenerator';
import { formatDate } from '../../utils/dateUtils';


export default function AdminEvaluacionDetalle() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [ev, setEv] = useState<any>(null);
  const [showChart, setShowChart] = useState(false);
  const [showChart2, setShowChart2] = useState(false);
  const [chart3Subcomite, setChart3Subcomite] = useState<'residuos' | 'bioseguridad' | 'iaas' | 'cai' | null>(null);
  const [showChartGlobal, setShowChartGlobal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    await generatePDF(ev, setIsExporting);
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
                <span>Fecha: {formatDate(ev.fecha_evaluacion)}</span>
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

                      {/* Comprobantes Fotográficos */}
                      {ev.seccion_2_respuestas?.[`${sub}_comprobantes`] && ev.seccion_2_respuestas?.[`${sub}_comprobantes`].length > 0 && (
                        <div className="pt-3 mt-3 border-t border-slate-700/50">
                          <span className="text-slate-500 text-xs flex items-center mb-2">
                            <ImageIcon className="w-3 h-3 mr-1 text-teal-500" /> Comprobantes Adjuntos:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {ev.seccion_2_respuestas[`${sub}_comprobantes`].map((url: string, idx: number) => (
                              <button 
                                key={idx} 
                                onClick={() => setPreviewImage(url)}
                                className="block w-12 h-12 rounded-md overflow-hidden border border-slate-600 hover:border-teal-400 hover:scale-110 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                title="Ver comprobante en tamaño completo"
                              >
                                <img src={url} alt={`Comprobante ${idx + 1}`} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
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

      {/* Modal de Previsualización de Imagen */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[95vh] flex items-center justify-center">
            <button 
              onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
              className="absolute -top-12 right-0 sm:-right-12 p-3 bg-red-500/20 hover:bg-red-500 text-white rounded-full transition-all shadow-lg backdrop-blur-sm"
              title="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewImage} 
              alt="Previsualización de comprobante" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-slate-800"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      </main>
    </div>
  );
}
