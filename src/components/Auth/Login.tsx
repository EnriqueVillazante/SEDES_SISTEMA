import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Mail, Lock, LogIn } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error('Credenciales incorrectas o usuario no encontrado');
        return;
      }

      // Obtener el rol del usuario
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: profile } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('id', userData.user.id)
          .single();

        toast.success('Bienvenido al sistema SEDES');

        if (profile && profile.rol === 'ADMINISTRADOR') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast.error('Ocurrió un error inesperado al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Image & Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://www.lapaz.gob.bo/storage/notas/imagen_02092025-114242ECCH112045581968b7107238d869.25709137.jpg')" }}
      ></div>
      <div className="absolute inset-0 z-0 bg-slate-950/70 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-0">
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="Logo SEDES"
            className="h-28 w-auto object-contain drop-shadow-2xl"
          />
        </div>
        <h2 className="text-center text-3xl font-black text-white tracking-tight drop-shadow-md">
          SEDES
        </h2>
        <p className="mt-2 text-center text-sm text-slate-200 font-medium tracking-wide uppercase drop-shadow">
          Sistema de Vigilancia Epidemiológica
        </p>
      </div>

      <div className="relative z-10 mt-8 w-full max-w-md mx-auto px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-xl py-10 px-6 shadow-2xl rounded-3xl sm:px-10 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="email">
                Correo Electrónico
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className={`block w-full pl-10 pr-3 py-3.5 text-sm bg-slate-50/90 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all shadow-inner ${errors.email ? 'border-red-400 text-red-900 placeholder-red-300' : 'border-slate-300 placeholder-slate-500 text-slate-900 font-medium'
                    }`}
                  placeholder="ejemplo@institucion.gob.bo"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="password">
                Contraseña
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  className={`block w-full pl-10 pr-3 py-3.5 text-sm bg-slate-50/90 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all shadow-inner ${errors.password ? 'border-red-400 text-red-900 placeholder-red-300' : 'border-slate-300 placeholder-slate-500 text-slate-900 font-medium'
                    }`}
                  placeholder="••••••••"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:shadow-xl active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300/50" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-slate-500 font-bold rounded-full border border-slate-200 shadow-sm">
                  ¿Personal nuevo?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="font-bold text-teal-600 hover:text-teal-700 transition-colors"
              >
                Registrarse en el Sistema
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
