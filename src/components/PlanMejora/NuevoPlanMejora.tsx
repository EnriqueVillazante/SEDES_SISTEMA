import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getQuestionById, type EvaluationQuestion } from '../../utils/evaluationDictionary';
import { Loader2, AlertCircle, FileText, CheckCircle2, ChevronRight, ChevronLeft, Save, Edit3, UserPlus, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { generatePlanMejoraPDF } from '../../utils/pdfPlanMejoraGenerator';

interface Evaluacion {
  id: string;
  fecha_evaluacion: string;
  seccion_1_respuestas: Record<string, any>;
  seccion_2_respuestas: Record<string, any>;
  seccion_3_respuestas: Record<string, any>;
}

export interface PlanMejoraItem {
  hallazgo: EvaluationQuestion;
  // Step 1
  accion_correctiva?: string;
  recursos_necesarios?: string;
  // Step 2 (These will now be handled globally, but we leave the types here just in case, though they are no longer needed on the item itself).
  // Step 3
  evidencia_archivo_ruta?: string;
}

export default function NuevoPlanMejora() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluacionId, setEvaluacionId] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [items, setItems] = useState<PlanMejoraItem[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [evalMetaData, setEvalMetaData] = useState({ establecimiento_salud: '', fecha_evaluacion: '', nivel_semaforo: '' });

  // Global Step 2 State
  const [globalResp1, setGlobalResp1] = useState('');
  const [globalResp2, setGlobalResp2] = useState('');
  const [globalPlazo, setGlobalPlazo] = useState<number | ''>('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  // Modal State
  const [activeModalItem, setActiveModalItem] = useState<number | null>(null);

  useEffect(() => {
    fetchLatestEvaluation();
  }, []);

  const fetchLatestEvaluation = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No hay usuario autenticado");
      }
      setUsuarioId(user.id);

      // Fetch the latest finalized evaluation for this user
      const { data, error: evalError } = await supabase
        .from('evaluaciones')
        .select('*, establecimiento_salud, fecha_evaluacion, nivel_semaforo')
        .eq('usuario_id', user.id)
        .eq('estado', 'FINALIZADO')
        .order('creado_en', { ascending: false })
        .limit(1)
        .single();

      if (evalError) {
        if (evalError.code === 'PGRST116') {
          throw new Error("No se encontró ninguna evaluación FINALIZADA para generar un plan de mejora.");
        }
        throw evalError;
      }

      setEvaluacionId(data.id);
      setEvalMetaData({
        establecimiento_salud: data.establecimiento_salud,
        fecha_evaluacion: data.fecha_evaluacion,
        nivel_semaforo: data.nivel_semaforo
      });
      extractHallazgos(data);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar la evaluación');
    } finally {
      setLoading(false);
    }
  };

  const extractHallazgos = (evalData: Evaluacion) => {
    const fallas: PlanMejoraItem[] = [];

    const checkSection = (respuestas: Record<string, any>, sectionId: string) => {
      if (!respuestas) return;
      Object.entries(respuestas).forEach(([key, value]) => {
        if (value === '0' || value === 0) {
          const question = getQuestionById(key, sectionId);
          if (question) {
            fallas.push({ hallazgo: question });
          }
        }
      });
    };

    checkSection(evalData.seccion_1_respuestas, 'seccion_1_respuestas');
    checkSection(evalData.seccion_2_respuestas, 'seccion_2_respuestas');
    checkSection(evalData.seccion_3_respuestas, 'seccion_3_respuestas');

    setItems(fallas);
  };

  // --- Handlers ---
  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, data: Partial<PlanMejoraItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...data };
    setItems(newItems);
  };

  const canProceedToStep2 = () => {
    return items.every(item => item.accion_correctiva && item.accion_correctiva.trim() !== '' && item.recursos_necesarios && item.recursos_necesarios.trim() !== '');
  };

  const canProceedToStep3 = () => {
    return globalResp1.trim() !== '' && globalPlazo !== '' && globalPlazo > 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!canProceedToStep2()) {
        toast.error('Debe completar la acción correctiva y recursos para TODOS los hallazgos.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!canProceedToStep3()) {
        toast.error('Debe asignar al Director Técnico y el plazo general en días.');
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSaveFinal = async () => {
    if (evidenceFiles.length === 0) {
      toast.error('Debe subir al menos una evidencia obligatoria.');
      return;
    }
    try {
      setSaving(true);
      
      // 1. Subir evidencias si existen
      const rutasEvidencias: string[] = [];
      
      if (evidenceFiles.length > 0) {
        for (const file of evidenceFiles) {
          try {
            // Comprimir imagen
            const compressedFile = await imageCompression(file, {
              maxSizeMB: 1, // Max 1MB
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            });
            
            const fileExt = compressedFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${usuarioId}/${evaluacionId}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('evidencias_mejora')
              .upload(filePath, compressedFile);
              
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage
              .from('evidencias_mejora')
              .getPublicUrl(filePath);
              
            rutasEvidencias.push(data.publicUrl);
          } catch (uploadErr) {
            console.error('Error uploading file:', file.name, uploadErr);
            toast.error(`Error al subir la imagen: ${file.name}`);
            // Continuar con los demás archivos aunque uno falle
          }
        }
      }

      const rutasString = rutasEvidencias.length > 0 ? JSON.stringify(rutasEvidencias) : null;

      // 2. Guardar en base de datos
      const rowsToInsert = items.map(item => ({
        usuario_id: usuarioId,
        evaluacion_id: evaluacionId,
        item_reprobado: `${item.hallazgo.sectionTitle} - ${item.hallazgo.title || item.hallazgo.text}`,
        accion_correctiva: item.accion_correctiva,
        responsable_1_nombre: globalResp1,
        responsable_1_cargo: 'Director Técnico del Establecimiento',
        responsable_2_nombre: globalResp2 || null,
        responsable_2_cargo: globalResp2 ? 'Responsable de Vigilancia Epidemiológica' : null,
        plazo_dias: Number(globalPlazo),
        recursos_necesarios: item.recursos_necesarios,
        estado: 'PENDIENTE',
        evidencia_archivo_ruta: rutasString
      }));

      const { error } = await supabase.from('planes_mejora').insert(rowsToInsert);

      if (error) throw error;

      setIsSuccess(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al guardar el plan de mejora');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl shadow-sm border border-red-100 flex items-center">
        <AlertCircle className="h-8 w-8 mr-4" />
        <p className="font-medium text-lg">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
        <div className="bg-green-50 border border-green-200 p-10 rounded-3xl text-center shadow-sm">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-green-800 mb-2">¡Felicidades!</h2>
          <p className="text-green-700 text-lg font-medium">No se encontraron ítems reprobados (calificación 0) en su última evaluación.</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto mt-10 space-y-8 animate-fade-in pb-20 px-4">
        <div className="bg-white border-2 border-green-500 p-10 rounded-3xl text-center shadow-lg">
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-800 mb-4">¡Plan de Mejora Registrado con Éxito!</h2>
          <p className="text-slate-600 text-lg font-medium max-w-lg mx-auto mb-10">
            Tus acciones correctivas han sido guardadas. Ahora puedes descargar tu reporte oficial en formato PDF.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => {
                const mappedItems = items.map(item => ({
                  hallazgo_str: `${item.hallazgo.sectionTitle}\n${item.hallazgo.title || item.hallazgo.text}`,
                  accion_correctiva: item.accion_correctiva || '',
                  recursos_necesarios: item.recursos_necesarios || ''
                }));
                generatePlanMejoraPDF(evalMetaData, mappedItems, globalResp1, globalResp2, Number(globalPlazo));
              }}
              className="inline-flex items-center px-8 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-md hover:shadow-lg transition-all w-full sm:w-auto text-lg"
            >
              <FileText className="h-6 w-6 mr-3" />
              Descargar Plan en PDF
            </button>
            
            <button 
              onClick={() => navigate('/')}
              className="inline-flex items-center px-8 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors w-full sm:w-auto text-lg"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 px-4 sm:px-0">

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-600 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-3">Plan de Mejora</h1>
          <p className="text-teal-100 text-lg font-medium max-w-2xl">
            Complete los 3 pasos para formular acciones correctivas a los hallazgos de su última evaluación.
          </p>
        </div>
        <FileText className="absolute right-8 top-1/2 -translate-y-1/2 h-32 w-32 text-white/10" />
      </div>

      {/* Stepper */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-500 rounded-full z-0 transition-all duration-500`} style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}></div>

          {[1, 2, 3].map((step) => (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors shadow-sm
                ${step < currentStep ? 'bg-teal-600 text-white' : step === currentStep ? 'bg-teal-500 text-white ring-4 ring-teal-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}
              `}>
                {step < currentStep ? <CheckCircle2 className="h-6 w-6" /> : step}
              </div>
              <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${step <= currentStep ? 'text-teal-800' : 'text-slate-400'}`}>
                {step === 1 ? 'Hallazgos' : step === 2 ? 'Responsables' : 'Evidencias'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">

        {/* STEP 1: Hallazgos e Identificación */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6">1. Identificación y Acciones Correctivas</h2>
            <p className="text-slate-600 mb-6 font-medium">Haga clic en cada hallazgo para redactar la acción correctiva propuesta y los recursos necesarios.</p>

            <div className="grid gap-4">
              {items.map((item, idx) => {
                const isCompleted = item.accion_correctiva && item.recursos_necesarios;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveModalItem(idx)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group
                      ${isCompleted ? 'bg-white border-green-500 shadow-sm' : 'bg-white border-slate-200 hover:border-teal-400 shadow-sm'}
                    `}
                  >
                    <div className="flex-1 pr-4">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">{item.hallazgo.sectionTitle}</span>
                      <h3 className={`font-extrabold text-lg line-clamp-1 ${isCompleted ? 'text-green-800' : 'text-slate-800'}`}>
                        {item.hallazgo.title || item.hallazgo.text}
                      </h3>
                      {isCompleted && (
                        <p className="text-sm text-slate-500 mt-2 line-clamp-1 font-medium">
                          <span className="font-bold text-slate-700">Acción:</span> {item.accion_correctiva}
                        </p>
                      )}
                    </div>
                    <div>
                      {isCompleted ? (
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                          <Edit3 className="h-5 w-5 text-teal-600" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Responsables y Tiempos */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2">2. Asignación de Responsables y Plazos</h2>
            <p className="text-slate-600 mb-8 font-medium">Asigne a los encargados de ejecutar el plan de mejora y defina el plazo general en días. Estos responsables aplicarán para todos los hallazgos identificados.</p>

            <div className="space-y-6">
              {/* Responsable 1 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                    <UserPlus className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-lg">Responsable 1 <span className="text-red-500">*</span></h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cargo: Director Técnico del Establecimiento</p>
                  </div>
                </div>
                <div className="pl-14">
                  <input
                    type="text"
                    value={globalResp1}
                    onChange={(e) => setGlobalResp1(e.target.value)}
                    placeholder="Escriba el nombre completo..."
                    className="w-full rounded-xl border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 bg-slate-50 p-3 font-medium"
                  />
                </div>
              </div>

              {/* Responsable 2 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mr-4">
                    <UserPlus className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-lg">Responsable 2 <span className="text-red-500">*</span></h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cargo: Responsable de Vigilancia Epidemiológica</p>
                  </div>
                </div>
                <div className="pl-14">
                  <input
                    type="text"
                    value={globalResp2}
                    onChange={(e) => setGlobalResp2(e.target.value)}
                    placeholder="Escriba el nombre completo..."
                    className="w-full rounded-xl border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 bg-slate-50 p-3 font-medium"
                  />
                </div>
              </div>

              {/* Plazo */}
              <div className="bg-teal-50 p-6 rounded-2xl shadow-sm border border-teal-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-teal-900 text-lg">Días de plazo para la corrección <span className="text-red-500">*</span></h3>
                    <p className="text-sm font-medium text-teal-700">Tiempo estimado en días calendario</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="1"
                      value={globalPlazo}
                      onChange={(e) => setGlobalPlazo(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ej: 30"
                      className="w-32 rounded-xl border-teal-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 bg-white p-3 text-center text-xl font-black text-teal-800"
                    />
                    <span className="ml-3 font-bold text-teal-700">días</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 3: Evidencias */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6">3. Evidencias de Cumplimiento</h2>

            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 mb-8">
              <p className="text-amber-800 font-medium">
                Al momento de formular el plan, la evidencia es <span className="font-bold uppercase">No es opcional</span>. Debes subir las evidencias.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
              <div className="h-20 w-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="h-10 w-10 text-teal-600" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-xl mb-2">Adjuntar Archivo de Evidencia</h3>
              <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
                Sube hasta 5 imágenes (JPG o PNG) que respalden el cumplimiento de todas las acciones correctivas planteadas.
              </p>

              <label className="inline-flex justify-center items-center px-8 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700 transition-colors w-full sm:w-auto cursor-pointer">
                <Upload className="h-5 w-5 mr-2" />
                Seleccionar Imágenes
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/jpeg, image/png"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const validFiles = files.filter(f => f.type === 'image/jpeg' || f.type === 'image/png');
                    
                    if (validFiles.length !== files.length) {
                      toast.error('Solo se permiten imágenes JPG y PNG.');
                    }
                    
                    if (evidenceFiles.length + validFiles.length > 5) {
                      toast.error('Puedes subir un máximo de 5 imágenes.');
                      return;
                    }
                    
                    setEvidenceFiles(prev => [...prev, ...validFiles]);
                    e.target.value = ''; // reset
                  }}
                />
              </label>

              {evidenceFiles.length > 0 && (
                <div className="mt-8 text-left max-w-md mx-auto">
                  <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Imágenes seleccionadas ({evidenceFiles.length}/5)</h4>
                  <ul className="space-y-2">
                    {evidenceFiles.map((file, idx) => (
                      <li key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-sm font-medium text-slate-600 truncate mr-4">{file.name}</span>
                        <button 
                          onClick={() => removeFile(idx)}
                          className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          className={`flex items-center px-6 py-3 rounded-xl font-bold transition-colors ${currentStep === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'}`}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Atrás
        </button>

        {currentStep < 3 ? (
          <button
            onClick={handleNextStep}
            className="flex items-center px-6 py-3 rounded-xl font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-md"
          >
            Siguiente Paso
            <ChevronRight className="h-5 w-5 ml-1" />
          </button>
        ) : (
          <button
            onClick={handleSaveFinal}
            disabled={saving}
            className="flex items-center px-6 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-md disabled:opacity-70"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Guardar y Enviar Plan
          </button>
        )}
      </div>

      {/* --- MODALS --- */}
      {/* Modal Paso 1 */}
      {currentStep === 1 && activeModalItem !== null && (
        <ModalStep1
          item={items[activeModalItem]}
          onClose={() => setActiveModalItem(null)}
          onSave={(data) => {
            updateItem(activeModalItem, data);
            setActiveModalItem(null);
          }}
        />
      )}

    </div>
  );
}

// --- Componentes de Modales ---

function ModalStep1({ item, onClose, onSave }: { item: PlanMejoraItem, onClose: () => void, onSave: (d: any) => void }) {
  const [accion, setAccion] = useState(item.accion_correctiva || '');
  const [recursos, setRecursos] = useState(item.recursos_necesarios || '');

  const handleSave = () => {
    if (!accion.trim() || !recursos.trim()) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }
    onSave({ accion_correctiva: accion, recursos_necesarios: recursos });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-center z-10">
          <h3 className="text-xl font-extrabold text-slate-800">Redactar Acción Correctiva</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-6 w-6 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <span className="text-xs font-black text-red-600 uppercase tracking-wider block mb-1">Hallazgo</span>
            <p className="text-red-900 font-medium">"{item.hallazgo.text}"</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Acción Correctiva Propuesta (¿Qué se va a hacer?) <span className="text-red-500">*</span></label>
            <textarea
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              rows={4}
              placeholder="Ej: Se elaborará un nuevo manual de procesos y se capacitará al personal..."
              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 bg-slate-50 p-4 text-slate-700 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Recursos Necesarios (Material / Presupuesto) <span className="text-red-500">*</span></label>
            <textarea
              value={recursos}
              onChange={(e) => setRecursos(e.target.value)}
              rows={2}
              placeholder="Ej: Proyector para capacitación, Bs. 500 para refrigerios..."
              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 bg-slate-50 p-4 text-slate-700 font-medium"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex justify-end">
          <button onClick={handleSave} className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-md transition-colors">
            Guardar Acción
          </button>
        </div>
      </div>
    </div>
  );
}

