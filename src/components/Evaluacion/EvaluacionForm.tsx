import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { calculateScores } from '../../utils/scoring';

import StepProgressBar from './StepProgressBar';
import Seccion1 from './Seccion1';
import Seccion2 from './Seccion2';
import Seccion3 from './Seccion3';

export default function EvaluacionForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const totalSteps = 3;

  const {
    register,
    trigger,
    getValues,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      seccion_1_respuestas: {},
      seccion_2_respuestas: {},
      seccion_3_respuestas: {},
      plan_accion_correctiva: [],
    }
  });

  useEffect(() => {
    async function fetchProfileAndEval() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
      }

      // Si hay un ID en la URL, cargar los datos de esa evaluación (Modo Edición/Borrador)
      if (id) {
        const { data: evalData } = await supabase
          .from('evaluaciones')
          .select('*')
          .eq('id', id)
          .single();
        
        if (evalData) {
          // Rellenar el formulario con las respuestas anteriores
          reset({
            seccion_1_respuestas: evalData.seccion_1_respuestas || {},
            seccion_2_respuestas: evalData.seccion_2_respuestas || {},
            seccion_3_respuestas: evalData.seccion_3_respuestas || {},
            plan_accion_correctiva: evalData.plan_accion_correctiva || [],
          });
        }
      }
    }
    fetchProfileAndEval();
  }, [id, reset]);

  const nextStep = async () => {
    // Validar los campos del paso actual antes de avanzar
    let isValid = false;
    if (currentStep === 1) {
      isValid = await trigger('seccion_1_respuestas');
    } else if (currentStep === 2) {
      isValid = await trigger('seccion_2_respuestas');
    } else if (currentStep === 3) {
      isValid = await trigger('seccion_3_respuestas');
    } else {
      // Por ahora pasamos de largo en las demás secciones que no existen aún
      isValid = true;
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo(0, 0);
    } else {
      toast.error('Por favor, responda todas las preguntas antes de continuar.');
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSaveDraft = async () => {
    if (!userId || !profile) {
      toast.error('Error cargando perfil del usuario.');
      return;
    }
    const data = getValues();
    const scores = calculateScores(data);
    
    try {
      const evalDataToSave = {
        usuario_id: userId,
        establecimiento_salud: profile.establecimiento_salud || 'Desconocido',
        red_salud: profile.red_salud,
        nivel_atencion: profile.nivel_atencion,
        seccion_1_respuestas: data.seccion_1_respuestas,
        seccion_2_respuestas: data.seccion_2_respuestas,
        seccion_3_respuestas: data.seccion_3_respuestas,
        ...scores,
        estado: 'BORRADOR'
      };

      let error;
      if (id) {
        // Actualizar borrador existente
        const { error: updateError } = await supabase.from('evaluaciones').update(evalDataToSave).eq('id', id);
        error = updateError;
      } else {
        // Crear nuevo borrador
        const { error: insertError } = await supabase.from('evaluaciones').insert(evalDataToSave);
        error = insertError;
      }

      if (error) throw error;
      toast.success('Borrador guardado exitosamente en la base de datos');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el borrador');
    }
  };

  const handleSubmitFinal = async () => {
    if (!userId || !profile) {
      toast.error('Error cargando perfil del usuario.');
      return;
    }
    const data = getValues();
    setIsSubmitting(true);
    try {
      const scores = calculateScores(data);
      
      const evalDataToSave = {
        usuario_id: userId,
        establecimiento_salud: profile.establecimiento_salud || 'Desconocido',
        red_salud: profile.red_salud,
        nivel_atencion: profile.nivel_atencion,
        seccion_1_respuestas: data.seccion_1_respuestas,
        seccion_2_respuestas: data.seccion_2_respuestas,
        seccion_3_respuestas: data.seccion_3_respuestas,
        ...scores,
        estado: 'FINALIZADO'
      };

      let error;
      if (id) {
        // Finalizar borrador existente
        const { error: updateError } = await supabase.from('evaluaciones').update(evalDataToSave).eq('id', id);
        error = updateError;
      } else {
        // Finalizar nueva evaluación
        const { error: insertError } = await supabase.from('evaluaciones').insert(evalDataToSave);
        error = insertError;
      }

      if (error) throw error;

      toast.success('¡Evaluación finalizada y guardada exitosamente!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la evaluación');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabecera superior */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Nueva Evaluación</h1>
            <p className="text-slate-500 font-medium">Complete los criterios de evaluación del establecimiento.</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            Cancelar y Volver
          </button>
        </div>

        {/* Contenedor Principal del Formulario */}
        <div className="bg-white shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 overflow-hidden">
          
          <div className="px-6 sm:px-10 py-6 bg-slate-50 border-b border-slate-100">
            <StepProgressBar currentStep={currentStep} totalSteps={totalSteps} />
          </div>

          <div className="px-6 sm:px-10 py-10">
            <form>
              
              {/* VISTAS DE CADA PASO */}
              <div className={currentStep === 1 ? 'block' : 'hidden'}>
                <Seccion1 register={register} errors={errors} />
              </div>
              
              <div className={currentStep === 2 ? 'block' : 'hidden'}>
                <Seccion2 register={register} errors={errors} />
              </div>

              <div className={currentStep === 3 ? 'block' : 'hidden'}>
                <Seccion3 register={register} errors={errors} />
              </div>

            </form>
          </div>

          {/* Barra inferior de botones (Controles) */}
          <div className="px-6 sm:px-10 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
                currentStep === 1 
                  ? 'text-slate-400 bg-slate-100 cursor-not-allowed' 
                  : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 shadow-sm'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center px-5 py-2.5 text-sm font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-xl transition-colors shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" /> Guardar Borrador
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center px-6 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-md"
                >
                  Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-md disabled:opacity-70"
                >
                  {isSubmitting ? (
                     <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>Finalizar y Enviar <CheckCircle className="w-4 h-4 ml-2" /></>
                  )}
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
