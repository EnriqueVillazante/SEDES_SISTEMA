import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  LogOut, Activity, Building, ShieldCheck, MapPin, Calendar, Clock, Landmark,
  Download, FilePlus, Bell, X, Newspaper, Eye, ExternalLink,
  FileText, Sparkles
} from 'lucide-react';
import { generatePDF } from '../../utils/pdfGenerator';
import { generatePlanMejoraPDF } from '../../utils/pdfPlanMejoraGenerator';
import { toast } from 'sonner';
import { formatDate } from '../../utils/dateUtils';

export interface BoletinEpidemiologico {
  id: string;
  titulo: string;
  edicion: string;
  descripcion: string;
  fecha_publicacion: string;
  archivo_url?: string;
  archivo_nombre?: string;
  tamanio_kb?: number;
  autor?: string;
  es_oficial?: boolean;
}

export function formatPdfPreviewUrl(url: string | undefined): string {
  if (!url) return '';
  // Si es un enlace de Google Drive tipo https://drive.google.com/file/d/ID/view...
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  return url;
}

export function formatPdfDownloadUrl(url: string | undefined): string {
  if (!url) return '#';
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }
  return url;
}



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

  // Estados de Boletines Epidemiológicos (Solo lectura y previsualización para el usuario)
  const [boletines, setBoletines] = useState<BoletinEpidemiologico[]>([]);
  const [loadingBoletines, setLoadingBoletines] = useState(true);
  const [seenBoletinIds, setSeenBoletinIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sedes_boletines_vistos');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error cargando boletines vistos', e);
    }
    return [];
  });

  const markBoletinAsSeen = (id: string) => {
    setSeenBoletinIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem('sedes_boletines_vistos', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Modal de Previsualización de PDF
  const [previewBoletin, setPreviewBoletin] = useState<BoletinEpidemiologico | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchBoletines();

    // Sincronización en tiempo real con Supabase
    const channel = supabase
      .channel('boletines_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'boletines_epidemiologicos' },
        () => {
          fetchBoletines();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBoletines = async () => {
    setLoadingBoletines(true);
    try {
      const { data, error } = await supabase
        .from('boletines_epidemiologicos')
        .select('*')
        .order('fecha_publicacion', { ascending: false });

      if (error) {
        console.error('Error cargando boletines desde Supabase:', error);
      } else if (data) {
        setBoletines(data);
        localStorage.setItem('sedes_boletines_epidemiologicos', JSON.stringify(data));
      }
    } catch (e) {
      console.error('Error de red al consultar boletines:', e);
      // Respaldo de contingencia local
      try {
        const saved = localStorage.getItem('sedes_boletines_epidemiologicos');
        if (saved) setBoletines(JSON.parse(saved));
      } catch (err) {}
    } finally {
      setLoadingBoletines(false);
    }
  };

  const handleOpenPreview = (boletin: BoletinEpidemiologico) => {
    try {
      markBoletinAsSeen(boletin.id);
      if (!boletin.archivo_url) {
        toast.warning('Este boletín no cuenta con un enlace de documento disponible');
        return;
      }
      const url = formatPdfPreviewUrl(boletin.archivo_url);
      setPreviewPdfUrl(url);
      setPreviewBoletin(boletin);
    } catch (err) {
      console.error('Error generando previsualización:', err);
      toast.error('No se pudo generar la previsualización del PDF');
    }
  };

  const handleClosePreview = () => {
    setPreviewBoletin(null);
    setPreviewPdfUrl(null);
  };


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
          recursos_necesarios: row.recursos_necesarios || '',
          plazo_dias: row.plazo_dias ? Number(row.plazo_dias) : 0,
          responsable_1_nombre: row.responsable_1_nombre || '',
          responsable_1_cargo: row.responsable_1_cargo || '',
          responsable_2_nombre: row.responsable_2_nombre || '',
          responsable_2_cargo: row.responsable_2_cargo || ''
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
                const validPlanes = ev.planes_mejora.filter((p: any) => p && p.plazo_dias && Number(p.plazo_dias) > 0);
                if (validPlanes.length === 0) return;

                const start = new Date(ev.fecha_evaluacion);
                start.setHours(0, 0, 0, 0);
                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);

                const diffDaysList = validPlanes.map((p: any) => {
                  const target = new Date(start.getTime() + Number(p.plazo_dias) * 24 * 60 * 60 * 1000);
                  target.setHours(0, 0, 0, 0);
                  return Math.ceil((target.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                });

                const diffDays = Math.min(...diffDaysList);

                // Notificar si quedan 3 días o menos, o si ya se pasó del plazo
                if (diffDays <= 3) {
                  let msg = '';
                  let isUrgent = false;

                  if (diffDays > 0) {
                    msg = `⚠️ Atención: Quedan ${diffDays} ${diffDays === 1 ? 'día laboral' : 'días laborales'} para el próximo vencimiento de su Plan de Mejora (${new Date(ev.fecha_evaluacion).toLocaleDateString('es-ES')}).`;
                  } else if (diffDays === 0) {
                    msg = `🚨 ¡URGENTE! HOY vence al menos una acción correctiva de su Plan de Mejora.`;
                    isUrgent = true;
                  } else {
                    msg = `❌ Tiene acciones de su Plan de Mejora vencidas hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día laboral' : 'días laborales'}. Póngase en contacto con el administrador inmediatamente.`;
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

  const getPlanMejoraCountdown = (planes: any, fechaEvaluacion: string) => {
    if (!planes || !fechaEvaluacion) return null;
    const planList = Array.isArray(planes) ? planes : [planes];
    const validPlanes = planList.filter(p => p && p.plazo_dias && Number(p.plazo_dias) > 0);
    if (validPlanes.length === 0) return null;

    const start = new Date(fechaEvaluacion);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diffDaysList = validPlanes.map(p => {
      const target = new Date(start.getTime() + Number(p.plazo_dias) * 24 * 60 * 60 * 1000);
      target.setHours(0, 0, 0, 0);
      return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    });

    const diffDays = Math.min(...diffDaysList);

    if (diffDays > 0) return { status: 'pending', text: `Próximo vencimiento: ${diffDays} ${diffDays === 1 ? 'día laboral' : 'días laborales'}`, color: 'text-amber-700 bg-amber-100' };
    if (diffDays === 0) return { status: 'warning', text: 'Vence hoy', color: 'text-orange-700 bg-orange-100' };
    return { status: 'danger', text: `Vencido hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día laboral' : 'días laborales'}`, color: 'text-rose-700 bg-rose-100' };
  };

  const latestFinalizedEval = evaluaciones.find(e => e.estado === 'FINALIZADO');
  const hasPlanMejora = Boolean(latestFinalizedEval && latestFinalizedEval.planes_mejora && latestFinalizedEval.planes_mejora.length > 0);
  const showPlanMejoraAction = Boolean(latestFinalizedEval && !hasPlanMejora);

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
                className={`p-2.5 rounded-xl transition-all duration-300 relative ${unreadCount > 0
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
            {showPlanMejoraAction && (
              <div className="mt-8 bg-white rounded-3xl shadow-lg border border-slate-100 p-6 animate-fade-in">
                <h4 className="text-slate-800 font-bold mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-teal-500" />
                  Accesos Rápidos
                </h4>
                <div className="space-y-3 mt-2">
                  <Link to="/plan-mejora/nuevo" className="w-full flex items-center justify-center p-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all group font-extrabold tracking-wide text-sm">
                    <FilePlus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    <span>Añadir Plan de Mejora</span>
                  </Link>
                </div>
              </div>
            )}
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

        {/* Sector de Boletines Epidemiológicos Oficiales */}
        <div className="mt-10 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 overflow-hidden relative">
          {/* Cabecera estilizada con degradado sutil */}
          <div className="px-6 sm:px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-teal-50/70 via-white to-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl text-white shadow-lg shadow-teal-500/25 shrink-0">
                <Newspaper className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Boletines Epidemiológicos Oficiales
                  </h3>
                  {boletines.some((b) => !seenBoletinIds.includes(b.id)) && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-800 border border-amber-500/25 px-2.5 py-0.5 rounded-full shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                      Nuevas publicaciones
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
                  Directrices técnicas, situación epidemiológica departamental y alertas emitidas por el SEDES Cochabamba.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs font-black bg-teal-50 text-teal-800 border border-teal-200/80 px-3.5 py-1.5 rounded-xl shadow-xs">
                {boletines.length} Publicaci{boletines.length === 1 ? 'ón' : 'ones'}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {loadingBoletines ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"></div>
                </div>
                <p className="text-slate-600 font-bold text-xs sm:text-sm mt-4">Sincronizando boletines oficiales con la base de datos...</p>
              </div>
            ) : boletines.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-b from-slate-50/70 to-white rounded-3xl border border-dashed border-slate-200 p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center shadow-inner">
                  <Newspaper className="h-8 w-8" />
                </div>
                <h4 className="text-slate-800 font-black text-base">No hay boletines epidemiológicos disponibles</h4>
                <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-md mx-auto">
                  El personal del SEDES publicará los reportes técnicos y alertas sanitarias periódicamente en este panel.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boletines.map((boletin) => {
                  const isUnseen = !seenBoletinIds.includes(boletin.id);
                  return (
                    <div
                      key={boletin.id}
                      className={`rounded-3xl transition-all duration-300 flex flex-col justify-between group overflow-hidden relative ${
                        isUnseen
                          ? 'bg-gradient-to-b from-amber-50/40 via-white to-white border-2 border-amber-400 ring-4 ring-amber-400/20 shadow-[0_12px_32px_-8px_rgba(245,158,11,0.3)] hover:shadow-[0_22px_45px_-8px_rgba(245,158,11,0.4)] -translate-y-1 hover:-translate-y-2'
                          : 'bg-white border border-slate-200/80 hover:border-teal-400/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_35px_-10px_rgba(13,148,136,0.15)] hover:-translate-y-1.5'
                      }`}
                    >
                      {/* Barra superior de acento institucional o vibrante si es nuevo */}
                      <div
                        className={`h-2.5 w-full ${
                          isUnseen
                            ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 animate-pulse'
                            : 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600'
                        }`}
                      ></div>

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Fila 1: Icono PDF + Badges de estado */}
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div
                              className={`p-3 rounded-2xl group-hover:scale-105 transition-transform shrink-0 shadow-xs border ${
                                isUnseen
                                  ? 'bg-gradient-to-br from-amber-100 to-rose-100 border-amber-300 text-amber-700'
                                  : 'bg-gradient-to-br from-rose-50 to-rose-100/70 border-rose-200/80 text-rose-600'
                              }`}
                            >
                              <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {isUnseen && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wider bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/30 animate-pulse">
                                  <Sparkles className="h-3 w-3" /> ¡Nuevo!
                                </span>
                              )}
                              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wider bg-teal-50 text-teal-800 border border-teal-200/80">
                                {boletin.edicion}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ShieldCheck className="h-3 w-3" /> Oficial
                              </span>
                            </div>
                          </div>

                          {/* Título del Boletín */}
                          <h4
                            className={`font-black text-base leading-snug transition-colors line-clamp-2 mb-2.5 tracking-tight ${
                              isUnseen
                                ? 'text-amber-950 group-hover:text-amber-700'
                                : 'text-slate-900 group-hover:text-teal-700'
                            }`}
                          >
                            {boletin.titulo}
                          </h4>

                          {/* Descripción / Extracto técnico */}
                          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4 font-normal">
                            {boletin.descripcion}
                          </p>
                        </div>

                        {/* Metadatos institucionales */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-2">
                          <span className="flex items-center text-slate-500 truncate max-w-[150px]">
                            <Building className="h-3.5 w-3.5 mr-1.5 text-teal-600 shrink-0" />
                            {boletin.autor || 'SEDES Cochabamba'}
                          </span>
                          <span className="flex items-center text-slate-500 shrink-0">
                            <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
                            {formatDate(boletin.fecha_publicacion, { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Footer con los dos botones de acción con acabados finos */}
                      <div className="bg-slate-50/80 px-5 py-3.5 border-t border-slate-100/90 flex gap-2.5 items-center">
                        <button
                          onClick={() => handleOpenPreview(boletin)}
                          className="flex-1 flex items-center justify-center py-2.5 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black rounded-xl shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 transition-all group/btn hover:scale-[1.02] active:scale-95 tracking-wide"
                        >
                          <Eye className="h-4 w-4 mr-1.5 group-hover/btn:scale-110 transition-transform" />
                          Previsualizar
                        </button>

                        {boletin.archivo_url && (
                          <a
                            href={formatPdfDownloadUrl(boletin.archivo_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={boletin.archivo_nombre || `${boletin.titulo}.pdf`}
                            onClick={() => markBoletinAsSeen(boletin.id)}
                            className="flex-1 flex items-center justify-center py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                          >
                            <Download className="h-4 w-4 mr-1.5 text-slate-500" />
                            Descargar
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                            <Link to={`/evaluacion/detalle/${ev.id}`} className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 bg-slate-100 text-slate-700 hover:text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-xs">
                              Ver Calificación
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
                              const countdown = getPlanMejoraCountdown(ev.planes_mejora, ev.fecha_evaluacion);
                              if (!countdown) return null;
                              return (
                                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${countdown.color}`}>
                                  ⏳ {countdown.text}
                                </span>
                              );
                            })()}
                          </div>
                          <h4 className="font-bold text-slate-700">
                            Acciones Correctivas y Compromisos
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

        {/* Modal de Previsualización de PDF del Boletín */}
        {previewBoletin && previewPdfUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">

              {/* Barra Superior del Visor de PDF */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-sm sm:text-base text-white truncate">
                      {previewBoletin.titulo}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {previewBoletin.edicion} • Fecha: {formatDate(previewBoletin.fecha_publicacion)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <a
                    href={previewPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center text-xs font-semibold"
                    title="Abrir en pestaña nueva"
                  >
                    <ExternalLink className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Pestaña Nueva</span>
                  </a>

                  <a
                    href={previewPdfUrl}
                    download={previewBoletin.archivo_nombre || `${previewBoletin.titulo}.pdf`}
                    className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-colors flex items-center text-xs font-semibold"
                    title="Descargar PDF"
                  >
                    <Download className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Descargar</span>
                  </a>

                  <button
                    onClick={handleClosePreview}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                    title="Cerrar previsualización"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Contenedor del Iframe Visor de PDF */}
              <div className="flex-1 bg-slate-100 relative">
                <iframe
                  src={previewPdfUrl}
                  title="Visor de PDF - Boletín Epidemiológico"
                  className="w-full h-full border-0"
                />
              </div>

              {/* Pie de visor informativo */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
                <span className="font-semibold text-teal-700">Sistema de Difusión y Vigilancia Epidemiológica - SEDES</span>
                <span className="hidden sm:inline">Previsualización interactiva de documentos PDF</span>
              </div>
            </div>
          </div>
        )}

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
