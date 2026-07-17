import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LogOut, Activity, Building, ShieldCheck, Briefcase, MapPin, Phone, Mail, Calendar, Clock, ChevronRight, Landmark } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');

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

        // Fetch user evaluations
        const { data: userEvals, error: evalsError } = await supabase
          .from('evaluaciones')
          .select('id, fecha_evaluacion, estado, puntaje_total, porcentaje, nivel_semaforo')
          .eq('usuario_id', user.id)
          .order('fecha_evaluacion', { ascending: false });
        
        if (!evalsError && userEvals) {
          setEvaluaciones(userEvals);
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

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
          <button
            onClick={handleSignOut}
            className="group flex flex-1 sm:flex-none justify-center items-center px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-red-500 rounded-xl transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md"
          >
            <LogOut className="h-4 w-4 sm:mr-2 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
            <span className="sm:hidden ml-1">Salir</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 z-10 relative">
        
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
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-teal-50 transition-colors group">
                  <span className="text-sm font-semibold text-slate-600 group-hover:text-teal-700">Actualizar Datos</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-500" />
                </button>
                <Link to="/evaluacion/nueva" className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-teal-50 transition-colors group">
                  <span className="text-sm font-semibold text-slate-600 group-hover:text-teal-700">Añadir Formulario</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-500" />
                </Link>
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
                  <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-teal-300 hover:shadow-md transition-all group gap-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          ev.estado === 'FINALIZADO' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ev.estado}
                        </span>
                        <span className="text-sm font-semibold text-slate-500">
                          {new Date(ev.fecha_evaluacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-700">
                        {ev.estado === 'FINALIZADO' 
                          ? 'Evaluación Finalizada y Enviada' 
                          : 'Evaluación en Progreso (Incompleta)'}
                      </h4>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {ev.estado === 'BORRADOR' ? (
                        <Link to={`/evaluacion/editar/${ev.id}`} className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-sm">
                          Continuar Evaluación
                        </Link>
                      ) : (
                        <button className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors opacity-50 cursor-not-allowed" title="Visualización próximamente">
                          Ver Detalles
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
