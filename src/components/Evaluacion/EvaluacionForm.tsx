import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, CheckCircle, FileText, Download } from 'lucide-react';
import { generatePDF } from '../../utils/pdfGenerator';
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
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEvalData, setSubmittedEvalData] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const goBack = () => {
    if (profile?.rol === 'ADMINISTRADOR') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const totalSteps = 3;

  const {
    register,
    trigger,
    getValues,
    reset,
    setValue,
    watch,
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

        // Security check: Only one evaluation per user
        if (!id) {
          const { data: existing } = await supabase
            .from('evaluaciones')
            .select('id')
            .eq('usuario_id', user.id)
            .limit(1);
            
          if (existing && existing.length > 0) {
            toast.error('Límite alcanzado: Ya has registrado una evaluación para este establecimiento.');
            navigate('/');
            return;
          }
        }
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

      let finalData;
      let reqError;

      if (id) {
        const { data, error } = await supabase.from('evaluaciones').update(evalDataToSave).eq('id', id).select('*, usuarios(*)').single();
        finalData = data;
        reqError = error;
      } else {
        const { data, error } = await supabase.from('evaluaciones').insert(evalDataToSave).select('*, usuarios(*)').single();
        finalData = data;
        reqError = error;
      }

      if (reqError) throw reqError;

      toast.success('¡Evaluación finalizada y guardada exitosamente!');
      setSubmittedEvalData(finalData);
      setIsSuccess(true);
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la evaluación');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isSuccess && submittedEvalData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Formulario Enviado Exitosamente!</h2>
          <p className="text-slate-600 mb-8">
            Los datos han sido registrados en el sistema bajo el establecimiento <strong>{profile?.establecimiento_salud}</strong>.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => generatePDF(submittedEvalData, setIsExporting)}
              disabled={isExporting}
              className="w-full flex items-center justify-center space-x-2 bg-teal-700 hover:bg-teal-800 text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Download className="h-5 w-5" />
              )}
              <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF de Respaldo'}</span>
            </button>
            
            <button
              onClick={goBack}
              className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-medium transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Volver al Inicio</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative">
      {/* Fondo Decorativo Superior */}
      <div className="absolute top-0 inset-x-0 h-72 bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900 z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10 py-10 px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera superior */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl shadow-inner border border-white/20">
              <FileText className="h-8 w-8 text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">Evaluación Institucional</h1>
              <p className="text-teal-100 font-medium text-sm mt-1">Complete los criterios de evaluación del establecimiento.</p>
            </div>
          </div>
          <button 
            onClick={goBack}
            className="group flex items-center justify-center px-4 py-2.5 text-sm font-bold text-slate-700 bg-white/90 hover:bg-white backdrop-blur-md border border-white/50 rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            Cancelar y Volver
          </button>
        </div>

        {/* Contenedor Principal del Formulario */}
        <div className="bg-white shadow-2xl shadow-teal-900/10 rounded-3xl border border-slate-100 overflow-hidden backdrop-blur-xl">
          
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
                <Seccion2 register={register} errors={errors} setValue={setValue} watch={watch} />
              </div>

              <div className={currentStep === 3 ? 'block' : 'hidden'}>
                <Seccion3 register={register} errors={errors} />
              </div>

            </form>
                  {/* Barra inferior de botones (Controles) */}
          <div className="px-6 sm:px-10 py-6 bg-slate-50/80 backdrop-blur-sm border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
            
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`w-full sm:w-auto flex items-center justify-center px-5 py-3 sm:py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                currentStep === 1 
                  ? 'text-slate-400 bg-slate-100 cursor-not-allowed' 
                  : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 shadow-sm hover:shadow group'
              }`}
            >
              <ArrowLeft className={`w-4 h-4 mr-2 ${currentStep !== 1 && 'group-hover:-translate-x-1 transition-transform'}`} /> 
              Atrás
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="w-full sm:w-auto flex items-center justify-center px-5 py-3 sm:py-2.5 text-sm font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 hover:border-teal-300 rounded-xl transition-all shadow-sm hover:shadow"
              >
                <Save className="w-4 h-4 mr-2" /> Guardar Borrador
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 sm:py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-all shadow-md hover:shadow-lg group"
                >
                  Siguiente <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 sm:py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? (
                     <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>Finalizar y Enviar <CheckCircle className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" /></>
                  )}
                </button>
              )}
            </div>
          </div>     </div>

        </div>
      </div>
    </div>
  );
}
