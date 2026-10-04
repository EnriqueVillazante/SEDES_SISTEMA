import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LogOut, Activity, ShieldAlert, CheckCircle, AlertTriangle, FileText, Search, Eye, LayoutDashboard, Bell, Send, Image as ImageIcon, MessageSquare, Calendar, ChevronDown, ChevronUp, Clock, Users, Paperclip, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Navigation State
  const [activeTab, setActiveTab] = useState<'evaluaciones' | 'notificaciones' | 'planes'>('evaluaciones');

  // States
  const [notifTitulo, setNotifTitulo] = useState('');
  const [notifMensaje, setNotifMensaje] = useState('');
  const [notifImagen, setNotifImagen] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [historialNotificaciones, setHistorialNotificaciones] = useState<any[]>([]);
  const [planesMejora, setPlanesMejora] = useState<any[]>([]);
  const [selectedPlanForView, setSelectedPlanForView] = useState<any>(null);
  const [expandedItem, setExpandedItem] = useState<any>(null);

  useEffect(() => {
    async function fetchAllData() {
      try {
        // Fetch Evaluaciones
        const { data: evals, error: evalsError } = await supabase
          .from('evaluaciones')
          .select('id, establecimiento_salud, red_salud, nivel_atencion, fecha_evaluacion, estado, puntaje_total, porcentaje, nivel_semaforo, usuario_id, usuarios(sector)')
          .order('fecha_evaluacion', { ascending: false });

        if (evalsError) throw evalsError;
        setEvaluaciones(evals || []);

        // Fetch Notificaciones
        const { data: notifs, error: notifsError } = await supabase
          .from('notificaciones')
          .select('*')
          .order('created_at', { ascending: false });

        if (!notifsError && notifs) {
          setHistorialNotificaciones(notifs);
        }

        // Fetch Planes de Mejora sin depender del foreign key
        const { data: planes, error: planesError } = await supabase
          .from('planes_mejora')
          .select('*')
          .order('id', { ascending: false }); // Usamos id en lugar de created_at por si no existe

        if (!planesError && planes && evals) {
          // Agrupar por evaluacion_id localmente para la vista
          const grouped = planes.reduce((acc: any, curr: any) => {
            const evId = curr.evaluacion_id;

            // Buscar la evaluación correspondiente en los evals ya descargados
            const evaluacionRelacionada = evals.find(e => e.id === evId);

            if (!acc[evId]) {
              acc[evId] = {
                evaluacion_id: evId,
                establecimiento: evaluacionRelacionada?.establecimiento_salud || 'Desconocido',
                red: evaluacionRelacionada?.red_salud || 'Desconocido',
                fecha_creacion: evaluacionRelacionada?.fecha_evaluacion || curr.created_at || new Date().toISOString(),
                items: []
              };
            }
            acc[evId].items.push(curr);
            return acc;
          }, {});

          setPlanesMejora(Object.values(grouped));
        }
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

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitulo.trim() || !notifMensaje.trim()) {
      toast.error('El título y mensaje son obligatorios');
      return;
    }

    setIsSendingNotif(true);
    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .insert([{
          titulo: notifTitulo.trim(),
          mensaje: notifMensaje.trim(),
          imagen_url: notifImagen.trim() || null
        }])
        .select();

      if (error) throw error;

      toast.success('Notificación enviada a todos los usuarios');
      setNotifTitulo('');
      setNotifMensaje('');
      setNotifImagen('');

      if (data && data.length > 0) {
        setHistorialNotificaciones([data[0], ...historialNotificaciones]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al enviar la notificación');
    } finally {
      setIsSendingNotif(false);
    }
  };

  // KPIs
  const finalizadas = evaluaciones.filter(e => e.estado === 'FINALIZADO');
  const optimos = finalizadas.filter(e => e.nivel_semaforo === 'ÓPTIMO').length;
  const regulares = finalizadas.filter(e => e.nivel_semaforo === 'REGULAR').length;
  const criticos = finalizadas.filter(e => e.nivel_semaforo === 'CRÍTICO').length;

  const filteredEvals = evaluaciones.filter(e =>
    e.establecimiento_salud?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.red_salud?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col md:flex-row overflow-hidden">

      {/* Mobile Header */}
      <header className="md:hidden bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center shrink-0 z-20 shadow-lg">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          <h1 className="text-lg font-black text-white tracking-tight">ADMIN</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('evaluaciones')}
            className={`p-2.5 rounded-xl transition-colors ${activeTab === 'evaluaciones' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <LayoutDashboard className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActiveTab('notificaciones')}
            className={`p-2.5 rounded-xl transition-colors ${activeTab === 'notificaciones' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActiveTab('planes')}
            className={`p-2.5 rounded-xl transition-colors ${activeTab === 'planes' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <ShieldAlert className="h-5 w-5" />
          </button>
          <button
            onClick={handleSignOut}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Sidebar Desktop */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 hidden md:flex flex-col shrink-0 z-20 relative shadow-2xl shadow-slate-900/50">
        <div className="p-8 border-b border-slate-800/50 relative overflow-hidden">
          {/* Efecto de fondo en el logo */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>

          <div className="flex flex-col items-center justify-center space-y-4 relative z-10">
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-inner">
              <img src="/logo.png" alt="Logo" className="h-14 w-auto object-contain drop-shadow-lg" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-black text-white tracking-tight">SEDES ADMIN</h1>
              <span className="text-[10px] text-amber-500 uppercase font-black tracking-widest px-2 py-0.5 bg-amber-500/10 rounded-full inline-block mt-1">Centro de Comando</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-5 space-y-3 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 pl-2">Menú Principal</p>

          <button
            onClick={() => setActiveTab('evaluaciones')}
            className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 font-bold text-sm group ${activeTab === 'evaluaciones'
                ? 'bg-amber-500 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-[1.02]'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent hover:border-slate-700/50'
              }`}
          >
            <LayoutDashboard className={`h-5 w-5 mr-3 transition-transform ${activeTab === 'evaluaciones' ? 'text-slate-900' : 'text-slate-500 group-hover:scale-110'}`} />
            Evaluaciones
          </button>

          <button
            onClick={() => setActiveTab('notificaciones')}
            className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 font-bold text-sm group ${activeTab === 'notificaciones'
                ? 'bg-amber-500 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-[1.02]'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent hover:border-slate-700/50'
              }`}
          >
            <Bell className={`h-5 w-5 mr-3 transition-transform ${activeTab === 'notificaciones' ? 'text-slate-900' : 'text-slate-500 group-hover:scale-110'}`} />
            Notificaciones
          </button>

          <button
            onClick={() => setActiveTab('planes')}
            className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 font-bold text-sm group ${activeTab === 'planes'
                ? 'bg-amber-500 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-[1.02]'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent hover:border-slate-700/50'
              }`}
          >
            <ShieldAlert className={`h-5 w-5 mr-3 transition-transform ${activeTab === 'planes' ? 'text-slate-900' : 'text-slate-500 group-hover:scale-110'}`} />
            Planes de Mejora
          </button>
        </nav>

        <div className="p-5 border-t border-slate-800/50">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center px-4 py-3 bg-slate-900/50 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-xl transition-all duration-300 font-bold text-sm group border border-slate-800 hover:border-red-500/30"
          >
            <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full md:h-screen overflow-hidden bg-slate-900 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 relative z-10 custom-scrollbar">

          {/* =========================================
              TAB: EVALUACIONES
          ============================================= */}
          {activeTab === 'evaluaciones' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">Panel de Evaluaciones</h2>
                  <p className="text-slate-400 mt-1 font-medium">Monitorea el cumplimiento epidemiológico de los establecimientos.</p>
                </div>
                <Link
                  to="/evaluacion/nueva"
                  className="inline-flex items-center px-5 py-2.5 bg-slate-800/80 backdrop-blur-sm hover:bg-amber-500 hover:text-slate-900 text-amber-500 rounded-xl transition-all duration-300 font-bold text-sm border border-amber-500/20 hover:border-transparent shadow-lg hover:shadow-amber-500/20 group"
                >
                  <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Ver Formulario Base
                </Link>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-700 shadow-xl relative overflow-hidden group hover:border-slate-500 transition-colors">
                  <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110">
                    <Activity className="h-32 w-32 text-white" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Total Registros</p>
                  <h3 className="text-4xl font-black text-white">{evaluaciones.length}</h3>
                  <p className="text-slate-500 text-xs mt-2 font-medium">Borradores y finalizadas</p>
                </div>

                <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-700 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
                  <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110">
                    <CheckCircle className="h-32 w-32 text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-1">Óptimos</p>
                  <h3 className="text-4xl font-black text-white">{optimos}</h3>
                  <p className="text-slate-500 text-xs mt-2 font-medium">&ge; 86% de cumplimiento</p>
                </div>

                <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-700 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-colors">
                  <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110">
                    <AlertTriangle className="h-32 w-32 text-amber-400" />
                  </div>
                  <p className="text-amber-400 font-bold uppercase tracking-wider text-xs mb-1">Regulares</p>
                  <h3 className="text-4xl font-black text-white">{regulares}</h3>
                  <p className="text-slate-500 text-xs mt-2 font-medium">60% - 85% de cumplimiento</p>
                </div>

                <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-700 shadow-xl relative overflow-hidden group hover:border-rose-500/40 transition-colors">
                  <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110">
                    <ShieldAlert className="h-32 w-32 text-rose-400" />
                  </div>
                  <p className="text-rose-400 font-bold uppercase tracking-wider text-xs mb-1">Críticos</p>
                  <h3 className="text-4xl font-black text-white">{criticos}</h3>
                  <p className="text-slate-500 text-xs mt-2 font-medium">0% - 59% de cumplimiento</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800/50">
                  <h2 className="text-lg font-bold text-white flex items-center">
                    <FileText className="h-5 w-5 mr-3 text-amber-500" />
                    Directorio de Evaluaciones
                  </h2>
                  <div className="relative w-full sm:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar establecimiento..."
                      className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder-slate-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/80 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-700">
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
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                            <p className="text-slate-500 mt-3 text-sm font-medium">Cargando registros...</p>
                          </td>
                        </tr>
                      ) : filteredEvals.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <div className="bg-slate-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Search className="h-8 w-8 text-slate-600" />
                            </div>
                            <p className="text-slate-400 font-medium">No se encontraron evaluaciones registradas.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredEvals.map((ev) => (
                          <tr key={ev.id} className="hover:bg-slate-700/30 transition-colors group">
                            <td className="px-6 py-4 font-bold text-white">{ev.establecimiento_salud}</td>
                            <td className="px-6 py-4 text-slate-400">{ev.red_salud || '-'}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-700 uppercase tracking-wider">
                                {ev.usuarios?.sector || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                              {formatDate(ev.fecha_evaluacion, { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest ${ev.estado === 'FINALIZADO' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}>
                                {ev.estado}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold">
                              {ev.estado === 'FINALIZADO' ? (
                                <span className="text-white">{ev.puntaje_total} <span className="text-slate-500 font-normal text-[10px]">/ 92</span></span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {ev.estado === 'FINALIZADO' ? (
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${ev.nivel_semaforo === 'ÓPTIMO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    ev.nivel_semaforo === 'REGULAR' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
                                className="inline-flex items-center justify-center p-2 bg-slate-900 hover:bg-amber-500 text-slate-400 hover:text-slate-900 rounded-lg transition-all border border-slate-700 hover:border-amber-400 shadow-sm hover:scale-110"
                                title="Ver Detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              TAB: NOTIFICACIONES
          ============================================= */}
          {activeTab === 'notificaciones' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-4">
                <h2 className="text-3xl font-black text-white tracking-tight">Centro de Comunicaciones</h2>
                <p className="text-slate-400 mt-1 font-medium">Envía avisos globales a todos los usuarios del sistema.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Panel de Formulario */}
                <div className="lg:col-span-5">
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 opacity-5">
                      <Bell className="w-48 h-48 text-white" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-6 flex items-center relative z-10">
                      <Send className="w-5 h-5 mr-3 text-amber-500" />
                      Redactar Nuevo Aviso
                    </h3>

                    <form onSubmit={handleSendNotification} className="space-y-5 relative z-10">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Título de la Notificación *</label>
                        <div className="relative">
                          <MessageSquare className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                          <input
                            type="text"
                            required
                            value={notifTitulo}
                            onChange={(e) => setNotifTitulo(e.target.value)}
                            placeholder="Ej. Recordatorio de Plazos"
                            className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mensaje *</label>
                        <textarea
                          required
                          rows={4}
                          value={notifMensaje}
                          onChange={(e) => setNotifMensaje(e.target.value)}
                          placeholder="Escribe el contenido detallado aquí..."
                          className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">URL de Imagen (Opcional)</label>
                        <div className="relative">
                          <ImageIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                          <input
                            type="url"
                            value={notifImagen}
                            onChange={(e) => setNotifImagen(e.target.value)}
                            placeholder="https://ejemplo.com/imagen.jpg"
                            className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                          />
                        </div>
                        {notifImagen && (
                          <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-700 h-32 w-full bg-slate-900/50">
                            <img
                              src={notifImagen}
                              alt="Vista previa"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none"></div>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingNotif}
                        className="w-full mt-4 flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-extrabold text-slate-900 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingNotif ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900 mr-2"></div>
                            Enviando...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Send className="w-5 h-5 mr-2" />
                            Emitir Notificación Global
                          </div>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Historial Panel */}
                <div className="lg:col-span-7">
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl h-full flex flex-col max-h-[800px]">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                      <LayoutDashboard className="w-5 h-5 mr-3 text-emerald-400" />
                      Historial de Notificaciones
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                      {historialNotificaciones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-900/30 rounded-2xl border border-slate-700/50 border-dashed">
                          <Bell className="w-10 h-10 text-slate-600 mb-3" />
                          <p className="text-slate-400 font-medium text-sm">Aún no has enviado ninguna notificación</p>
                        </div>
                      ) : (
                        historialNotificaciones.map((notif) => (
                          <div key={notif.id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700 hover:border-slate-600 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-white font-bold text-base pr-4 group-hover:text-amber-400 transition-colors">{notif.titulo}</h4>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-800 px-2.5 py-1 rounded-md shrink-0 flex items-center border border-slate-700">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(notif.created_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed mb-3 line-clamp-3">{notif.mensaje}</p>

                            {notif.imagen_url && (
                              <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-700 h-32 w-full max-w-sm group-hover:border-slate-600 transition-colors">
                                <img
                                  src={notif.imagen_url}
                                  alt="Adjunto"
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* =========================================
              TAB: PLANES DE MEJORA
          ============================================= */}
          {activeTab === 'planes' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">Planes de Mejora</h2>
                  <p className="text-slate-400 mt-1 font-medium">Revisa los planes de acción correctiva enviados por los establecimientos.</p>
                </div>
                <Link
                  to="/plan-mejora/nuevo?preview=true"
                  className="inline-flex items-center px-5 py-2.5 bg-slate-800/80 backdrop-blur-sm hover:bg-amber-500 hover:text-slate-900 text-amber-500 rounded-xl transition-all duration-300 font-bold text-sm border border-amber-500/20 hover:border-transparent shadow-lg hover:shadow-amber-500/20 group"
                >
                  <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Ver Formulario de Mejora (Solo Mirar)
                </Link>
              </div>

              {selectedPlanForView ? (
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700 overflow-hidden animate-in slide-in-from-right-4 duration-300">
                  <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/50">
                    <button
                      onClick={() => setSelectedPlanForView(null)}
                      className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm font-medium bg-slate-900/50 hover:bg-slate-900 px-4 py-2 rounded-xl border border-slate-700"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver a la tabla
                    </button>
                    <h2 className="text-lg font-bold text-white flex items-center">
                      <ShieldAlert className="h-5 w-5 mr-3 text-amber-500" />
                      {selectedPlanForView.establecimiento}
                    </h2>
                  </div>

                  <div className="p-6 sm:p-8 overflow-y-auto max-h-[700px] custom-scrollbar">
                    {(() => {
                      const firstItem = selectedPlanForView.items[0] || {};

                      return (
                        <div className="space-y-6 max-w-5xl mx-auto">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
                            <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              Resumen del Plan de Acción
                            </h4>
                            <Link
                              to={`/admin/evaluacion/${selectedPlanForView.evaluacion_id}`}
                              className="inline-flex items-center justify-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl transition-all font-bold text-xs shrink-0 shadow-lg shadow-amber-500/20"
                              title="Ver Evaluación Original"
                            >
                              Ir a Evaluación Original
                            </Link>
                          </div>

                          {/* Información General del Plan */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700 shadow-inner">
                              <div className="flex items-center space-x-2 mb-3 text-blue-400">
                                <Clock className="h-5 w-5" />
                                <h5 className="font-bold text-xs uppercase tracking-widest">Tiempo Estimado</h5>
                              </div>
                              <p className="text-white font-medium text-lg">{firstItem.plazo_dias ? `${firstItem.plazo_dias} Días` : 'No definido'}</p>
                            </div>

                            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700 shadow-inner">
                              <div className="flex items-center space-x-2 mb-3 text-emerald-400">
                                <Users className="h-5 w-5" />
                                <h5 className="font-bold text-xs uppercase tracking-widest">Responsables</h5>
                              </div>
                              <div className="space-y-3">
                                {firstItem.responsable_1_nombre && (
                                  <div>
                                    <p className="text-white font-medium text-sm">{firstItem.responsable_1_nombre}</p>
                                    <p className="text-[10px] text-slate-400">{firstItem.responsable_1_cargo || 'Director Técnico'}</p>
                                  </div>
                                )}
                                {firstItem.responsable_2_nombre && (
                                  <div>
                                    <p className="text-white font-medium text-sm">{firstItem.responsable_2_nombre}</p>
                                    <p className="text-[10px] text-slate-400">{firstItem.responsable_2_cargo || 'Vigilancia Epidemiológica'}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700 shadow-inner">
                              <div className="flex items-center space-x-2 mb-3 text-rose-400">
                                <Paperclip className="h-5 w-5" />
                                <h5 className="font-bold text-xs uppercase tracking-widest">Pruebas (Evidencias)</h5>
                              </div>
                              {firstItem.evidencia_archivo_ruta ? (
                                <div className="mt-2 flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                                  {(() => {
                                    try {
                                      const rutas = JSON.parse(firstItem.evidencia_archivo_ruta);
                                      if (Array.isArray(rutas)) {
                                        return rutas.map((ruta, i) => (
                                          <a key={i} href={ruta} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                                            <div className="h-20 w-20 rounded-xl bg-slate-800 border-2 border-slate-600 overflow-hidden hover:border-rose-400 transition-colors shadow-md">
                                              <img src={ruta} alt={`Evidencia ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; (e.target as HTMLImageElement).className = 'w-full h-full object-contain p-2 opacity-50'; }} />
                                            </div>
                                          </a>
                                        ));
                                      }
                                    } catch (e) { }
                                    return <p className="text-slate-400 text-xs">Sin evidencias válidas</p>;
                                  })()}
                                </div>
                              ) : (
                                <p className="text-slate-400 text-xs italic">No se adjuntaron evidencias para este plan.</p>
                              )}
                            </div>
                          </div>

                          {/* Lista de Hallazgos Interactivos */}
                          <div className="mt-8">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 pl-1 flex items-center">
                              <span className="bg-slate-700 text-white px-2 py-0.5 rounded-md mr-2">{selectedPlanForView.items.length}</span>
                              Listado de Hallazgos
                            </h5>
                            <div className="space-y-4">
                              {selectedPlanForView.items.map((item: any, idx: number) => {
                                const isExpanded = expandedItem === (item.id || idx);
                                return (
                                  <div key={item.id || idx} className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden transition-all duration-300 shadow-md">
                                    <button
                                      onClick={() => setExpandedItem(isExpanded ? null : (item.id || idx))}
                                      className="w-full text-left p-5 flex items-center justify-between hover:bg-slate-700 transition-colors"
                                    >
                                      <div className="flex-1 pr-4">
                                        <div className="flex items-start space-x-4">
                                          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-900 border border-slate-700 text-amber-500 text-sm font-bold shrink-0 shadow-inner mt-0.5">{idx + 1}</span>
                                          <p className="text-white font-medium text-base leading-snug pt-1">{item.item_reprobado}</p>
                                        </div>
                                      </div>
                                      <div className={`shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors ${isExpanded ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 text-slate-500 border border-slate-700'}`}>
                                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                      </div>
                                    </button>

                                    {/* Detalle del hallazgo al expandir */}
                                    {isExpanded && (
                                      <div className="p-6 bg-slate-900/80 border-t border-slate-700/50 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                        <div>
                                          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-2 flex items-center"><CheckCircle className="h-4 w-4 mr-2" /> Acción Correctiva Propuesta</p>
                                          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 border-l-4 border-l-emerald-500">
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{item.accion_correctiva}</p>
                                          </div>
                                        </div>

                                        {item.recursos_necesarios && (
                                          <div>
                                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-2 flex items-center"><Activity className="h-4 w-4 mr-2" /> Recursos Necesarios</p>
                                            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 border-l-4 border-l-amber-500">
                                              <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{item.recursos_necesarios}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (

                <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800/50">
                    <h2 className="text-lg font-bold text-white flex items-center">
                      <ShieldAlert className="h-5 w-5 mr-3 text-amber-500" />
                      Planes Registrados ({planesMejora.length})
                    </h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-900/80 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-700">
                        <tr>
                          <th className="px-6 py-4">Establecimiento / Red</th>
                          <th className="px-6 py-4">Fecha Emisión</th>
                          <th className="px-6 py-4 text-center">Nº Hallazgos</th>
                          <th className="px-6 py-4 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {loading ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center">
                              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                            </td>
                          </tr>
                        ) : planesMejora.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                              No hay planes de mejora registrados.
                            </td>
                          </tr>
                        ) : (
                          planesMejora.map((plan: any) => (
                            <tr key={plan.evaluacion_id} className="hover:bg-slate-700/30 transition-colors group">
                              <td className="px-6 py-4">
                                <p className="font-bold text-white">{plan.establecimiento}</p>
                                <p className="text-xs text-slate-400">{plan.red}</p>
                              </td>
                              <td className="px-6 py-4 text-slate-400">
                                {formatDate(plan.fecha_creacion, { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  {plan.items.length} HALLAZGOS
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => setSelectedPlanForView(plan)}
                                  className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-amber-500 rounded-xl border border-slate-700 group-hover:bg-amber-500 group-hover:text-slate-900 transition-all font-bold text-xs shadow-sm hover:scale-105"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Plan
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Estilos para el scroll personalizado de las tablas y paneles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 1); 
        }
      `}</style>
    </div>
  );
}
