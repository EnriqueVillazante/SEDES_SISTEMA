import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import EvaluacionForm from './components/Evaluacion/EvaluacionForm';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminEvaluacionDetalle from './components/Admin/AdminEvaluacionDetalle';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData(currentSession: Session | null) {
      if (currentSession) {
        const { data } = await supabase.from('usuarios').select('rol').eq('id', currentSession.user.id).single();
        setProfile(data);
      } else {
        setProfile(null);
      }
      setSession(currentSession);
      setLoading(false);
    }

    // Obtener la sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadData(session);
    });

    // Escuchar cambios de estado (login, logout, registro)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadData(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Si NO hay sesión, mostramos rutas públicas. Si intenta ir a raíz, va a login. */}
      {!session ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        /* Si HAY sesión, mostramos rutas protegidas. */
        <>
          <Route path="/" element={profile?.rol === 'ADMINISTRADOR' ? <Navigate to="/admin" replace /> : <Dashboard />} />
          <Route path="/admin" element={profile?.rol === 'ADMINISTRADOR' ? <AdminDashboard /> : <Navigate to="/" replace />} />
          <Route path="/admin/evaluacion/:id" element={profile?.rol === 'ADMINISTRADOR' ? <AdminEvaluacionDetalle /> : <Navigate to="/" replace />} />
          <Route path="/evaluacion/nueva" element={<EvaluacionForm />} />
          <Route path="/evaluacion/editar/:id" element={<EvaluacionForm />} />
          <Route path="*" element={<Navigate to={profile?.rol === 'ADMINISTRADOR' ? '/admin' : '/'} replace />} />
        </>
      )}
    </Routes>
  );
}

export default App;
