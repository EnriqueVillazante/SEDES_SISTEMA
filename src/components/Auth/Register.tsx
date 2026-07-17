import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Mail, Lock, User, Phone, Briefcase, Building, MapPin, Activity, Landmark } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico inválido' }),
  password: z.string().min(6, { message: 'Mínimo 6 caracteres' }),
  nombre_completo: z.string().min(3, { message: 'Requerido' }),
  celular: z.string().min(7, { message: 'Requerido' }),
  cargo: z.string().min(2, { message: 'Requerido' }),
  establecimiento_salud: z.string().min(2, { message: 'Requerido' }),
  red_salud: z.string().min(2, { message: 'Requerido' }),
  nivel_atencion: z.string().min(1, { message: 'Requerido' }),
  sector: z.enum(['Público', 'SSCP', 'Privado'], { message: 'Seleccione un sector' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nombre_completo: data.nombre_completo,
            celular: data.celular,
            cargo: data.cargo,
            establecimiento_salud: data.establecimiento_salud,
            red_salud: data.red_salud,
            nivel_atencion: data.nivel_atencion,
            sector: data.sector,
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Registro exitoso. Tu perfil ha sido creado correctamente.');
      navigate('/');
    } catch (error: any) {
      toast.error('Ocurrió un error inesperado al registrar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ label, id, type, icon: Icon, placeholder, registerName, error }: any) => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor={id}>
        {label}
      </label>
      <div className="relative rounded-xl shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-slate-400" />
        </div>
        <input
          id={id}
          type={type}
          className={`block w-full pl-10 pr-3 py-3.5 text-sm bg-slate-50/90 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all shadow-inner ${error ? 'border-red-400 text-red-900 placeholder-red-300' : 'border-slate-300 placeholder-slate-500 text-slate-900 font-medium'
            }`}
          placeholder={placeholder}
          {...register(registerName)}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error.message}</p>}
    </div>
  );

  const SelectField = ({ label, id, icon: Icon, options, registerName, error }: any) => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor={id}>
        {label}
      </label>
      <div className="relative rounded-xl shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-slate-400" />
        </div>
        <select
          id={id}
          className={`block w-full pl-10 pr-3 py-3.5 text-sm bg-slate-50/90 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all shadow-inner appearance-none ${error ? 'border-red-400 text-red-900' : 'border-slate-300 text-slate-900 font-medium'
            }`}
          {...register(registerName)}
          defaultValue=""
        >
          <option value="" disabled hidden>Seleccione una opción</option>
          {options.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error.message}</p>}
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Image & Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://www.lapaz.gob.bo/storage/notas/imagen_02092025-114242ECCH112045581968b7107238d869.25709137.jpg')" }}
      ></div>
      <div className="absolute inset-0 z-0 bg-slate-950/70 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-0">
        <div className="flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="Logo SEDES"
            className="h-24 w-auto object-contain drop-shadow-2xl"
          />
        </div>
        <h2 className="text-center text-3xl font-black text-white tracking-tight drop-shadow-md">
          SEDES
        </h2>
        <p className="mt-2 text-center text-sm text-slate-200 font-medium tracking-wide uppercase drop-shadow">
          Registro Institucional de Nuevo Usuario
        </p>
      </div>

      <div className="relative z-10 mt-8 w-full max-w-3xl mx-auto px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="md:col-span-2 border-b border-slate-200 pb-2 mb-2">
                <h3 className="text-lg font-bold text-slate-800">Datos Personales y de Acceso</h3>
              </div>

              <InputField label="Nombre Completo" id="nombre_completo" type="text" icon={User} placeholder="Ej. Dr. Juan Pérez" registerName="nombre_completo" error={errors.nombre_completo} />
              <InputField label="Celular" id="celular" type="tel" icon={Phone} placeholder="Ej. 70012345" registerName="celular" error={errors.celular} />
              <InputField label="Correo Electrónico" id="email" type="email" icon={Mail} placeholder="ejemplo@institucion.gob.bo" registerName="email" error={errors.email} />
              <InputField label="Contraseña" id="password" type="password" icon={Lock} placeholder="••••••••" registerName="password" error={errors.password} />

              <div className="md:col-span-2 border-b border-slate-200 pb-2 mt-4 mb-2">
                <h3 className="text-lg font-bold text-slate-800">Datos Institucionales</h3>
              </div>

              <SelectField label="Sector" id="sector" icon={Landmark} options={['Público', 'SSCP', 'Privado']} registerName="sector" error={errors.sector} />
              <InputField label="Cargo" id="cargo" type="text" icon={Briefcase} placeholder="Ej. Médico General" registerName="cargo" error={errors.cargo} />
              <InputField label="Establecimiento de Salud" id="establecimiento_salud" type="text" icon={Building} placeholder="Ej. Hospital Obrero" registerName="establecimiento_salud" error={errors.establecimiento_salud} />
              <InputField label="Red de Salud" id="red_salud" type="text" icon={MapPin} placeholder="Ej. Red de Salud Centro" registerName="red_salud" error={errors.red_salud} />
              <InputField label="Nivel de Atención" id="nivel_atencion" type="text" icon={Activity} placeholder="Ej. Primer Nivel" registerName="nivel_atencion" error={errors.nivel_atencion} />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:shadow-xl active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Confirmar Registro'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="text-center">
              <span className="text-sm text-slate-500 font-medium">¿Ya formas parte de la institución? </span>
              <Link
                to="/login"
                className="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
