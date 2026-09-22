import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LogOut, Activity, Building, ShieldCheck, Briefcase, MapPin, Phone, Mail, Calendar, Clock, Landmark, Download, FilePlus, Bell, X } from 'lucide-react';
import { generatePDF } from '../../utils/pdfGenerator';
import { generatePlanMejoraPDF } from '../../utils/pdfPlanMejoraGenerator';
import { toast } from 'sonner';
import { formatDate } from '../../utils/dateUtils';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingPlanId, setDownloadingPlanId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);


  const handleDownloadPDF = async (evalId: string) => {
    try {
      setDownloadingId(evalId);
      const { data, error } = await supabase
        .from('evaluaciones')
        .select('*, usuarios(*)')
        .eq('id', evalId)
        .single();

      if (error) throw error;
      if (data) {
        await generatePDF(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al descargar el PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadPlanPDF = async (ev: any) => {
    try {
      setDownloadingPlanId(ev.id);

      const { data: planesData, error } = await supabase
        .from('planes_mejora')
        .select('*')
        .eq('evaluacion_id', ev.id);

      if (error) throw error;

      if (planesData && planesData.length > 0) {
        const evalMetaData = {
          establecimiento_salud: profile?.establecimiento_salud || '',
          fecha_evaluacion: ev.fecha_evaluacion,
          nivel_semaforo: ev.nivel_semaforo
        };

        const mappedItems = planesData.map(row => ({
          hallazgo_str: row.item_reprobado,
          accion_correctiva: row.accion_correctiva || '',
          recursos_necesarios: row.recursos_necesarios || ''
        }));

        await generatePlanMejoraPDF(
          evalMetaData,
          mappedItems,
          planesData[0].responsable_1_nombre || '',
          planesData[0].responsable_2_nombre || '',
          planesData[0].plazo_dias || 0
        );
      } else {
        toast.error('No se encontró el plan de mejora');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al descargar el PDF del plan');
    } finally {
      setDownloadingPlanId(null);
    }
  };

  useEffect(() => {
    // Establecer fecha actual formateada
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('es-ES', dateOptions));

    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);

        // Fetch user evaluations with plan mejora relation
        const { data: userEvals, error: evalsError } = await supabase
          .from('evaluaciones')
          .select('id, fecha_evaluacion, estado, puntaje_total, porcentaje, nivel_semaforo, planes_mejora(id, plazo_dias)')
          .eq('usuario_id', user.id)
          .order('fecha_evaluacion', { ascending: false });

        if (evalsError) {
          console.error("Error fetching evaluations:", evalsError);
        } else if (userEvals) {
          setEvaluaciones(userEvals);
          
          // Alerta de 3 días para presentar pruebas del plan de mejora
          const now = Date.now();
          const LAST_ALERT_KEY = 'last_deadline_alert_time';
          const lastAlertStr = localStorage.getItem(LAST_ALERT_KEY);
          const lastAlertTime = lastAlertStr ? parseInt(lastAlertStr, 10) : 0;
          const TWELVE_HOURS = 12 * 60 * 60 * 1000;

          if (now - lastAlertTime > TWELVE_HOURS) {
            let triggeredAlert = false;
            
            userEvals.forEach((ev: any) => {
              if (ev.estado === 'FINALIZADO' && ev.planes_mejora && ev.planes_mejora.length > 0) {
                const plan = ev.planes_mejora[0];
                const start = new Date(ev.fecha_evaluacion);
                start.setHours(0,0,0,0);
                const target = new Date(start.getTime() + plan.plazo_dias * 24 * 60 * 60 * 1000);
                
                const currentDate = new Date();
                currentDate.setHours(0,0,0,0);
                
                const diffTime = target.getTime() - currentDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Notificar si quedan 3 días o menos, o si ya se pasó del plazo
                if (diffDays <= 3) {
                  let msg = '';
                  let isUrgent = false;
                  
                  if (diffDays > 0) {
                    msg = `⚠️ Atención: Quedan ${diffDays} días para presentar las pruebas de cumplimiento del Plan de Mejora (${new Date(ev.fecha_evaluacion).toLocaleDateString('es-ES')}).`;
                  } else if (diffDays === 0) {
                    msg = `🚨 ¡URGENTE! HOY es el último día para presentar las pruebas de cumplimiento de su Plan de Mejora.`;
                    isUrgent = true;
                  } else {
                    msg = `❌ Su plazo para presentar las pruebas del Plan de Mejora está vencido hace ${Math.abs(diffDays)} días. Póngase en contacto con el administrador inmediatamente.`;
                    isUrgent = true;
                  }

                  toast.warning(msg, {
                    duration: isUrgent ? 15000 : 10000,
                    style: {
                      background: isUrgent ? '#fee2e2' : '#fef3c7',
                      color: isUrgent ? '#991b1b' : '#92400e',
                      border: isUrgent ? '1px solid #f87171' : '1px solid #fbbf24',
                      fontSize: '14px',
                      fontWeight: '500'
                    }
                  });
                  triggeredAlert = true;
                }
              }
            });

            if (triggeredAlert) {
              localStorage.setItem(LAST_ALERT_KEY, now.toString());
            }
          }
        }
      } catch (error: any) {
        console.error('Error fetching profile or evals:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();

    async function fetchNotifications() {
      try {
        const { data, error } = await supabase
          .from('notificaciones')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (!error && data) {
          setNotifications(data);
        }
      } catch (err) {
        console.error("Error fetching notificaciones", err);
      }
    }
    fetchNotifications();

    const readIds = localStorage.getItem('notificaciones_leidas');
    if (readIds) {
      try {
        setReadNotificationIds(JSON.parse(readIds));
      } catch (e) { }
    }
  }, []);

  const unreadCount = notifications.filter(n => !readNotificationIds.includes(n.id)).length;

  const handleNotificationClick = (notif: any) => {
    if (!readNotificationIds.includes(notif.id)) {
      const newReadIds = [...readNotificationIds, notif.id];
      setReadNotificationIds(newReadIds);
      localStorage.setItem('notificaciones_leidas', JSON.stringify(newReadIds));
    }
    setSelectedNotification(notif);
    setShowNotifications(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error al cerrar sesión');
    } else {
      toast.success('Sesión cerrada correctamente');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getPlanMejoraCountdown = (plan: any, fechaEvaluacion: string) => {
    if (!plan || !fechaEvaluacion || !plan.plazo_dias) return null;
    
    const start = new Date(fechaEvaluacion);
    const target = new Date(start.getTime() + plan.plazo_dias * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    target.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return { status: 'pending', text: `Faltan ${diffDays} días`, color: 'text-amber-700 bg-amber-100' };
    if (diffDays === 0) return { status: 'warning', text: 'Vence hoy', color: 'text-orange-700 bg-orange-100' };
    return { status: 'danger', text: `Vencido hace ${Math.abs(diffDays)} días`, color: 'text-rose-700 bg-rose-100' };
  };

  const latestFinalizedEval = evaluaciones.find(e => e.estado === 'FINALIZADO');
  const hasPlanMejora = latestFinalizedEval && latestFinalizedEval.planes_mejora && latestFinalizedEval.planes_mejora.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative overflow-hidden">
      {/* Navbar */}
      <header className="bg-teal-800 shadow-md border-b border-teal-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[5rem] py-3 flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center bg-white p-1 rounded-xl shadow-lg border border-teal-100/20">
              <img
                src="/logo.png"
                alt="Logo SEDES"
                className="h-8 sm:h-10 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-none">SEDES</h1>
              <p className="text-[10px] sm:text-xs text-teal-200 uppercase font-bold tracking-widest mt-1">Plataforma Oficial</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Notificaciones */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 rounded-xl transition-all duration-300 relative ${
                  unreadCount > 0 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                    : 'text-white bg-white/10 hover:bg-white/20 border border-white/10'
                }`}
                title="Notificaciones"
              >
                <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-[swing_2s_ease-in-out_infinite] origin-top' : ''}`} />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full border-2 border-teal-800 flex items-center justify-center text-[10px] font-black text-white z-10 shadow-lg shadow-red-500/50">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
                  </>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-4 fade-in duration-200 origin-top-right">
                  <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Notificaciones</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-black uppercase tracking-widest shadow-sm">{unreadCount} Nueva{unreadCount !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2 space-y-2 bg-slate-50/50">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          <Bell className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium text-sm">No tienes nuevas notificaciones</p>
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const isRead = readNotificationIds.includes(notif.id);
                        return (
                          <div 
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 rounded-2xl transition-all duration-200 cursor-pointer group shadow-sm border ${!isRead ? 'bg-white border-teal-200 shadow-teal-100/50 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md hover:-translate-y-0.5'}`}
                          >
                            {!isRead && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500"></div>
                            )}
                            <div className="flex justify-between items-start mb-1">
                              <p className={`text-sm pr-2 ${!isRead ? 'font-extrabold text-slate-800' : 'font-semibold text-slate-600 group-hover:text-teal-700 transition-colors'}`}>
                                {notif.titulo}
                              </p>
                              {!isRead && <span className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)] flex-shrink-0 mt-1.5 ml-1 animate-pulse"></span>}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-1">{notif.mensaje}</p>
                            <span className="text-[10px] font-bold text-slate-400 mt-2 block uppercase tracking-wider">
                              {formatDate(notif.created_at, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-3 text-center border-t border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => setShowNotifications(false)}>
                    <span className="text-xs font-bold text-slate-500 group-hover:text-teal-600 transition-colors uppercase tracking-wider">Cerrar bandeja</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="group flex flex-1 sm:flex-none justify-center items-center px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-red-500 rounded-xl transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md"
            >
              <LogOut className="h-4 w-4 sm:mr-2 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <span className="sm:hidden ml-1">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 z-10 relative">

        {/* Modal Notificacion */}
        {selectedNotification && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setSelectedNotification(null)}
            ></div>
            <div className="bg-white rounded-[2rem] w-full max-w-lg relative shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="bg-gradient-to-br from-teal-50 to-white px-8 py-6 border-b border-slate-100 relative shrink-0">
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="absolute top-6 right-6 p-2 bg-white hover:bg-rose-50 hover:text-rose-500 rounded-full text-slate-400 shadow-sm border border-slate-100 transition-all hover:scale-110"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="pr-10">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Aviso Oficial
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 leading-tight">{selectedNotification.titulo}</h3>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mt-2 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(selectedNotification.created_at, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
              
              <div className="p-8 overflow-y-auto">
                {selectedNotification.imagen_url && (
                  <div className="mb-6 rounded-2xl overflow-hidden border border-slate-100 shadow-md group">
                    <img 
                      src={selectedNotification.imagen_url} 
                      alt="Notificación" 
                      className="w-full h-auto object-cover max-h-72 group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base font-medium">
                  {selectedNotification.mensaje}
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white shadow-lg shadow-teal-500/30 font-extrabold text-sm uppercase tracking-widest rounded-xl transition-all hover:-translate-y-0.5"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center space-x-2 text-teal-600 mb-2 font-bold">
              <Calendar className="h-4 w-4" />
              <span className="text-sm capitalize">{currentDate}</span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-800 uppercase">
              {loading ? 'Cargando perfil...' : `Hola, ${profile?.nombre_completo.split(' ')[0]}`}
            </h2>
            <p className="text-slate-500 mt-2 font-medium max-w-xl">
              Bienvenido a tu panel de control. Desde aquí puedes gestionar tu información institucional y acceder a tus módulos asignados.
            </p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: ID Card */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transform transition-all hover:-translate-y-1 hover:shadow-2xl duration-300">

              <div className="h-32 bg-gradient-to-br from-teal-500 to-teal-700 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              </div>

              <div className="px-6 pb-8 relative text-center">
                <div className="h-28 w-28 mx-auto -mt-14 bg-white rounded-full shadow-lg border-4 border-white flex items-center justify-center text-4xl font-black text-teal-600 mb-4 z-10 relative">
                  {loading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                  ) : (
                    getInitials(profile?.nombre_completo)
                  )}
                </div>

                <h3 className="text-xl font-extrabold text-slate-800 uppercase">
                  {loading ? 'Cargando...' : profile?.nombre_completo}
                </h3>
                <p className="text-teal-600 font-bold mt-1 text-sm uppercase tracking-wide">
                  {profile?.cargo || 'Sin cargo'}
                </p>

                <div className="mt-6 inline-flex items-center px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-800">
                  <ShieldCheck className="h-5 w-5 mr-2 text-teal-500" />
                  <span className="text-sm font-bold tracking-wide uppercase">{profile?.rol || 'Cargando'}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estado de Cuenta</span>
                <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                  Activo
                </span>
              </div>
            </div>

            {/* Quick Actions / Info Card */}
            <div className="mt-8 bg-white rounded-3xl shadow-lg border border-slate-100 p-6">
              <h4 className="text-slate-800 font-bold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-teal-500" />
                Accesos Rápidos
              </h4>
              <div className="space-y-3 mt-2">
                {hasPlanMejora ? (
                  <button disabled className="w-full flex items-center justify-center p-4 rounded-2xl bg-slate-100 text-slate-500 shadow-sm cursor-not-allowed font-extrabold tracking-wide text-sm border border-slate-200">
                    <FilePlus className="h-5 w-5 mr-2" />
                    <span>Plan de Mejora (Ya Enviado)</span>
                  </button>
                ) : (
                  <Link to="/plan-mejora/nuevo" className="w-full flex items-center justify-center p-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all group font-extrabold tracking-wide text-sm">
                    <FilePlus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    <span>Añadir Plan de Mejora</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Institutional Details */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 h-full overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 bg-white">
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                  <Building className="h-6 w-6 mr-3 text-teal-500" />
                  Expediente Institucional
                </h3>
              </div>

              <div className="p-8">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
                  </div>
                ) : profile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">

                    <div className="group">
                      <div className="flex items-center mb-2">
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600 mr-3 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                          <Mail className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Correo Electrónico</p>
                      </div>
                      <p className="font-semibold text-slate-800 text-lg pl-12 uppercase">{profile.email}</p>
                    </div>

                    <div className="group">
                      <div className="flex items-center mb-2">
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600 mr-3 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                          <Phone className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Celular</p>
                      </div>
                      <p className="font-semibold text-slate-800 text-lg pl-12 uppercase">{profile.celular || 'No registrado'}</p>
                    </div>

                    <div className="group">
                      <div className="flex items-center mb-2">
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600 mr-3 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargo Desempeñado</p>
                      </div>
                      <p className="font-semibold text-slate-800 text-lg pl-12 uppercase">{profile.cargo || 'No registrado'}</p>
                    </div>

                    <div className="group">
                      <div className="flex items-center mb-2">
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600 mr-3 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                          <Building className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Establecimiento de Salud</p>
                      </div>
                      <p className="font-semibold text-slate-800 text-lg pl-12 uppercase">{profile.establecimiento_salud || 'No registrado'}</p>
                    </div>

                    <div className="group">
                      <div className="flex items-center mb-2">
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600 mr-3 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Red de Salud</p>
                      </div>
                      <p className="font-semibold text-slate-800 text-lg pl-12 uppercase">{profile.red_salud || 'No registrado'}</p>
                    </div>

                    <div className="group">
                      <div className="flex items-center mb-2">
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600 mr-3 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                          <Activity className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nivel de Atención</p>
                      </div>
                      <p className="font-semibold text-slate-800 text-lg pl-12 uppercase">{profile.nivel_atencion || 'No registrado'}</p>
                    </div>

                    <div className="group">
                      <div className="flex items-center mb-2">
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600 mr-3 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                          <Landmark className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sector</p>
                      </div>
                      <p className="font-semibold text-slate-800 text-lg pl-12 uppercase">{profile.sector || 'No registrado'}</p>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500 font-medium">No se encontraron datos del expediente.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Evaluaciones History */}
        <div className="mt-8 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
              <Activity className="h-6 w-6 mr-3 text-teal-500" />
              Mis Evaluaciones
            </h3>
            <div className="hidden sm:flex space-x-4 text-sm font-semibold">
              <span className="text-slate-500">Total: {evaluaciones.length}</span>
              <span className="text-teal-600">Finalizadas: {evaluaciones.filter(e => e.estado === 'FINALIZADO').length}</span>
              <span className="text-amber-500">Borradores: {evaluaciones.filter(e => e.estado === 'BORRADOR').length}</span>
            </div>
          </div>

          <div className="p-8">
            {evaluaciones.length === 0 && !loading ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-500 font-medium">Aún no has enviado ninguna evaluación.</p>
                <Link to="/evaluacion/nueva" className="mt-4 inline-flex items-center px-4 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-md">
                  Comenzar Primera Evaluación
                </Link>
              </div>
            ) : loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {evaluaciones.map((ev) => (
                  <div key={ev.id} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-teal-300 hover:shadow-md transition-all group gap-4 bg-white">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${ev.estado === 'FINALIZADO' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                            {ev.estado}
                          </span>
                          {ev.estado === 'FINALIZADO' && ev.planes_mejora && ev.planes_mejora.length > 0 && (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                              Con Plan de Mejora
                            </span>
                          )}
                          <span className="text-sm font-semibold text-slate-500">
                            {formatDate(ev.fecha_evaluacion, { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-700">
                          {ev.estado === 'FINALIZADO'
                            ? 'Evaluación Finalizada y Enviada'
                            : 'Evaluación en Progreso (Incompleta)'}
                        </h4>
                      </div>

                      <div className="flex-shrink-0 flex items-center space-x-2">
                        {ev.estado === 'BORRADOR' ? (
                          <Link to={`/evaluacion/editar/${ev.id}`} className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-sm">
                            Continuar Evaluación
                          </Link>
                        ) : (
                          <>
                            <button
                              onClick={() => handleDownloadPDF(ev.id)}
                              disabled={downloadingId === ev.id}
                              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
                              title="Descargar Evaluación"
                            >
                              {downloadingId === ev.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <Download className="h-4 w-4 mr-2" />
                              )}
                              Descargar
                            </button>
                            <Link to={`/evaluacion/detalle/${ev.id}`} className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">
                              Ver Calificacion
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Tarjeta Separada para el Plan de Mejora si existe */}
                    {ev.estado === 'FINALIZADO' && ev.planes_mejora && ev.planes_mejora.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-blue-100 bg-blue-50/50 hover:border-blue-300 hover:shadow-md transition-all group gap-4 mt-2 ml-4 sm:ml-8 relative">
                        {/* Línea conectora visual */}
                        <div className="hidden sm:block absolute -left-8 top-1/2 w-8 border-t-2 border-slate-200 border-dashed"></div>
                        <div className="hidden sm:block absolute -left-8 -top-8 h-[calc(100%+32px)] border-l-2 border-slate-200 border-dashed"></div>

                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                              Plan de Mejora
                            </span>
                            {(() => {
                              const countdown = getPlanMejoraCountdown(ev.planes_mejora[0], ev.fecha_evaluacion);
                              if (!countdown) return null;
                              return (
                                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${countdown.color}`}>
                                  ⏳ {countdown.text}
                                </span>
                              );
                            })()}
                          </div>
                          <h4 className="font-bold text-slate-700">
                            Acciones Correctivas y Evidencias
                          </h4>
                        </div>

                        <div className="flex-shrink-0 flex items-center space-x-2">
                          <button
                            onClick={() => handleDownloadPlanPDF(ev)}
                            disabled={downloadingPlanId === ev.id}
                            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                            title="Descargar Plan en PDF"
                          >
                            {downloadingPlanId === ev.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <FilePlus className="h-4 w-4 mr-2" />
                            )}
                            Descargar Plan PDF
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
      
      <style>{`
        @keyframes swing {
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
