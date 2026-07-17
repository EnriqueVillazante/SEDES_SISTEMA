import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LogOut, Activity, ShieldAlert, CheckCircle, AlertTriangle, FileText, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchAllData() {
      try {
        const { data: evals, error } = await supabase
          .from('evaluaciones')
          .select('id, establecimiento_salud, red_salud, nivel_atencion, fecha_evaluacion, estado, puntaje_total, porcentaje, nivel_semaforo, usuario_id, usuarios(sector)')
          .order('fecha_evaluacion', { ascending: false });

        if (error) throw error;
        setEvaluaciones(evals || []);
      } catch (err: any) {
        toast.error('Error al cargar datos administrativos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllData();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error al cerrar sesión');
    } else {
      toast.success('Sesión cerrada correctamente');
    }
  };

  const finalizadas = evaluaciones.filter(e => e.estado === 'FINALIZADO');
  const optimos = finalizadas.filter(e => e.nivel_semaforo === 'ÓPTIMO').length;
  const regulares = finalizadas.filter(e => e.nivel_semaforo === 'REGULAR').length;
  const criticos = finalizadas.filter(e => e.nivel_semaforo === 'CRÍTICO').length;

  const filteredEvals = evaluaciones.filter(e => 
    e.establecimiento_salud?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.red_salud?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 font-sans relative overflow-hidden">
      {/* Admin Navbar */}
      <header className="bg-slate-950 shadow-xl border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[5rem] py-3 flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="Logo SEDES" 
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-md"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-none">SEDES ADMIN</h1>
              <p className="text-[10px] sm:text-xs text-amber-500 uppercase font-bold tracking-widest mt-1">Panel de Control General</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end">
            <Link
              to="/evaluacion/nueva"
              className="group flex flex-1 sm:flex-none justify-center items-center px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-900 rounded-xl transition-all duration-300 border border-amber-500/20 hover:border-amber-500 shadow-sm"
              title="Ver estructura del formulario"
            >
              <FileText className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ver Formulario</span>
              <span className="sm:hidden ml-1">Formulario</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="group flex flex-1 sm:flex-none justify-center items-center px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-800 hover:bg-red-500/90 rounded-xl transition-all duration-300 border border-slate-700 hover:border-red-500 shadow-sm"
            >
              <LogOut className="h-4 w-4 sm:mr-2 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <span className="sm:hidden ml-1">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 z-10 relative">
        
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group hover:border-slate-600 transition-colors">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="h-32 w-32 text-white" />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Total Evaluaciones</p>
            <h3 className="text-4xl font-black text-white">{evaluaciones.length}</h3>
            <p className="text-slate-500 text-sm mt-2 font-medium">Borradores y finalizadas</p>
          </div>

          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle className="h-32 w-32 text-emerald-500" />
            </div>
            <p className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-1">Óptimos</p>
            <h3 className="text-4xl font-black text-white">{optimos}</h3>
            <p className="text-slate-500 text-sm mt-2 font-medium">&ge; 86% de cumplimiento</p>
          </div>

          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-colors">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertTriangle className="h-32 w-32 text-amber-500" />
            </div>
            <p className="text-amber-400 font-bold uppercase tracking-wider text-xs mb-1">Regulares</p>
            <h3 className="text-4xl font-black text-white">{regulares}</h3>
            <p className="text-slate-500 text-sm mt-2 font-medium">60% - 85% de cumplimiento</p>
          </div>

          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group hover:border-red-500/30 transition-colors">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldAlert className="h-32 w-32 text-red-500" />
            </div>
            <p className="text-red-400 font-bold uppercase tracking-wider text-xs mb-1">Críticos</p>
            <h3 className="text-4xl font-black text-white">{criticos}</h3>
            <p className="text-slate-500 text-sm mt-2 font-medium">0% - 59% de cumplimiento</p>
          </div>
        </div>

        {/* Criterios de Evaluación (Leyenda) */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl mb-10">
          <h2 className="text-lg font-bold text-white flex items-center mb-4">
            <FileText className="h-5 w-5 mr-2 text-blue-400" />
            Criterios de Calificación Epidemiológica
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Crítico */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                <h4 className="font-black text-red-400 tracking-wide">NIVEL CRÍTICO</h4>
                <span className="text-xs font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">0% - 59%</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-slate-200">Alto riesgo epidemiológico hospitalario.</strong> Requiere intervención inmediata, reestructuración del comité por la Dirección General y auditoría externa.
              </p>
            </div>
            
            {/* Regular */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h4 className="font-black text-amber-400 tracking-wide">NIVEL REGULAR</h4>
                <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">60% - 85%</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-slate-200">(En Proceso)</strong> El sistema es operativo, pero presenta brechas importantes en el cumplimiento normativo o carencia de evidencias físicas indispensables. Requiere un plan de acción correctivo a mediano plazo.
              </p>
            </div>

            {/* Óptimo */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <h4 className="font-black text-emerald-400 tracking-wide">NIVEL ÓPTIMO</h4>
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">86% - 100%</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Subsistema consolidado, seguro y con fuerte respaldo documental. Cumple con los estándares nacionales de vigilancia epidemiológica.
              </p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <FileText className="h-6 w-6 mr-3 text-amber-500" />
              Directorio de Evaluaciones
            </h2>
            <div className="relative w-full sm:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Buscar por establecimiento o red..."
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4">Establecimiento</th>
                  <th className="px-6 py-4">Red de Salud</th>
                  <th className="px-6 py-4">Sector</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Puntaje</th>
                  <th className="px-6 py-4 text-center">Semáforo</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                    </td>
                  </tr>
                ) : filteredEvals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                      No se encontraron evaluaciones registradas.
                    </td>
                  </tr>
                ) : (
                  filteredEvals.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-750 transition-colors group">
                      <td className="px-6 py-4 font-bold text-white">{ev.establecimiento_salud}</td>
                      <td className="px-6 py-4">{ev.red_salud || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                          {ev.usuarios?.sector || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(ev.fecha_evaluacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          ev.estado === 'FINALIZADO' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-slate-700 text-slate-300 border border-slate-600'
                        }`}>
                          {ev.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        {ev.estado === 'FINALIZADO' ? (
                          <span className="text-white">{ev.puntaje_total} <span className="text-slate-500 font-normal text-xs">/ 92</span></span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {ev.estado === 'FINALIZADO' ? (
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            ev.nivel_semaforo === 'ÓPTIMO' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            ev.nivel_semaforo === 'REGULAR' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {ev.nivel_semaforo}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link 
                          to={`/admin/evaluacion/${ev.id}`}
                          className="inline-flex items-center justify-center p-2 bg-slate-800 hover:bg-amber-500 text-slate-400 hover:text-slate-900 rounded-lg transition-colors border border-slate-700 hover:border-amber-400"
                          title="Ver Detalles"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
