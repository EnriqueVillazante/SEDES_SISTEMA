import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getQuestionById, type EvaluationQuestion } from '../../utils/evaluationDictionary';
import { Loader2, AlertCircle, FileText, CheckCircle2, Save, Edit3, UserPlus, Upload, X } from 'lucide-react';
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

      // Check for preview mode
      const params = new URLSearchParams(window.location.search);
      if (params.get('preview') === 'true') {
        setItems([
          { hallazgo: { id: 'test1', sectionId: '1', title: 'Falta de protocolos de bioseguridad visibles', text: 'El establecimiento no cuenta con protocolos de bioseguridad visibles', sectionTitle: 'Bioseguridad' } as any },
          { hallazgo: { id: 'test2', sectionId: '2', title: 'Extintores vencidos', text: 'Los extintores del área de farmacia se encuentran vencidos', sectionTitle: 'Infraestructura' } as any }
        ]);
        setEvalMetaData({ establecimiento_salud: 'Previsualización', fecha_evaluacion: new Date().toISOString(), nivel_semaforo: 'REGULAR' });
        setLoading(false);
        return;
      }

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

  const validateForm = () => {
    const isStep1Valid = items.every(item => item.accion_correctiva && item.accion_correctiva.trim() !== '' && item.recursos_necesarios && item.recursos_necesarios.trim() !== '');
    if (!isStep1Valid) {
      toast.error('Debe completar la acción correctiva y recursos para TODOS los hallazgos.');
      return false;
    }
    
    const isStep2Valid = globalResp1.trim() !== '' && globalPlazo !== '' && globalPlazo > 0;
    if (!isStep2Valid) {
      toast.error('Debe asignar al Director Técnico y el plazo general en días.');
      return false;
    }
    
    if (evidenceFiles.length === 0) {
      toast.error('Debe subir al menos una evidencia obligatoria.');
      return false;
    }
    
    return true;
  };

  const handleSaveFinal = async () => {
    if (!validateForm()) return;
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

      toast.success('¡Plan de Mejora registrado correctamente!');
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
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-8 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors w-full sm:w-auto text-lg"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">

        {/* Header Documento */}
        <div className="bg-slate-900 p-6 sm:p-8 rounded-t-2xl text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between border-b-4 border-amber-500">
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Plan de Acción Correctiva</h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              Formulario oficial para el planteamiento de acciones y corrección de hallazgos.
            </p>
          </div>
          <div className="mt-4 md:mt-0 relative z-10 bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-sm w-full md:w-auto">
             <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Establecimiento</p>
             <p className="font-bold text-base sm:text-lg text-white">{evalMetaData.establecimiento_salud || 'No definido'}</p>
          </div>
          <FileText className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 h-64 w-64 text-white/5 pointer-events-none" />
        </div>

      {/* Warning */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl shadow-sm flex items-start">
        <AlertCircle className="h-6 w-6 text-amber-500 mr-4 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-amber-800 font-bold mb-1">Aviso Importante</h3>
          <p className="text-amber-700 text-sm">
            Este formulario <strong>no guarda el progreso como borrador</strong>. Si sale de la página o la recarga antes de enviar, perderá todos los datos ingresados. Asegúrese de completar todo en un solo intento.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8 min-h-[400px]">

        {/* STEP 1: Hallazgos e Identificación */}
        <div className="bg-white p-6 sm:p-8 rounded-b-2xl sm:rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <span className="bg-slate-900 text-white text-sm w-8 h-8 flex items-center justify-center rounded-lg mr-3">1</span>
              Identificación de Hallazgos y Acciones
            </h2>
            <p className="text-slate-500 text-sm mt-2 ml-11">Declare la acción correctiva propuesta y los recursos necesarios para cada hallazgo.</p>
          </div>

          <div className="grid gap-4">
            {items.map((item, idx) => {
              const isCompleted = item.accion_correctiva && item.recursos_necesarios;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveModalItem(idx)}
                  className={`text-left p-5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between group
                    ${isCompleted ? 'bg-slate-50 border-emerald-500/50 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-md'}
                  `}
                >
                  <div className="flex-1 pr-0 sm:pr-4 mb-4 sm:mb-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase tracking-wider">{item.hallazgo.sectionTitle}</span>
                      {isCompleted && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded uppercase tracking-wider flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Completado</span>}
                    </div>
                    <h3 className={`font-semibold text-base leading-snug ${isCompleted ? 'text-slate-700' : 'text-slate-900'}`}>
                      {item.hallazgo.title || item.hallazgo.text}
                    </h3>
                    {isCompleted && (
                      <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-600 line-clamp-2">
                          <span className="font-semibold text-slate-800">Acción:</span> {item.accion_correctiva}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 self-end sm:self-center">
                    {isCompleted ? (
                      <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold border border-emerald-100 flex items-center transition-colors hover:bg-emerald-100">
                        <Edit3 className="h-4 w-4 mr-2" /> Editar
                      </div>
                    ) : (
                      <div className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold flex items-center group-hover:bg-slate-800 transition-colors shadow-sm">
                        <Edit3 className="h-4 w-4 mr-2" /> Redactar
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: Responsables y Tiempos */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <span className="bg-slate-900 text-white text-sm w-8 h-8 flex items-center justify-center rounded-lg mr-3">2</span>
              Responsables y Plazos de Ejecución
            </h2>
            <p className="text-slate-500 text-sm mt-2 ml-11">Asigne a los profesionales a cargo y el plazo estimado para el cumplimiento global.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Responsable 1 */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Responsable 1 <span className="text-red-500">*</span></label>
              <p className="text-xs text-slate-500 mb-2">Director Técnico del Establecimiento</p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserPlus className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={globalResp1}
                  onChange={(e) => setGlobalResp1(e.target.value)}
                  placeholder="Nombre completo"
                  className="pl-10 w-full rounded-lg border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 text-sm py-2.5"
                />
              </div>
            </div>

            {/* Responsable 2 */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Responsable 2 <span className="text-slate-400 font-normal">(Opcional)</span></label>
              <p className="text-xs text-slate-500 mb-2">Responsable de Vigilancia Epidemiológica</p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserPlus className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={globalResp2}
                  onChange={(e) => setGlobalResp2(e.target.value)}
                  placeholder="Nombre completo"
                  className="pl-10 w-full rounded-lg border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 text-sm py-2.5"
                />
              </div>
            </div>

            {/* Plazo */}
            <div className="md:col-span-2 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <div>
                <h3 className="font-bold text-slate-800">Plazo para la corrección <span className="text-red-500">*</span></h3>
                <p className="text-sm text-slate-500">Tiempo estimado en días calendario para solventar los hallazgos</p>
              </div>
              <div className="flex items-center bg-white p-1 rounded-lg border border-slate-300 shadow-sm w-full sm:w-auto">
                <input
                  type="number"
                  min="1"
                  value={globalPlazo}
                  onChange={(e) => setGlobalPlazo(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full sm:w-20 border-0 focus:ring-0 text-center text-lg font-bold text-slate-800 py-2"
                />
                <span className="pr-4 pl-2 font-medium text-slate-500 uppercase text-xs tracking-wider border-l border-slate-100">días</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: Evidencias */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <span className="bg-slate-900 text-white text-sm w-8 h-8 flex items-center justify-center rounded-lg mr-3">3</span>
              Evidencias de Respaldo
            </h2>
            <p className="text-slate-500 text-sm mt-2 ml-11">Adjunte la documentación fotográfica pertinente (Obligatorio).</p>
          </div>

          <div className="bg-slate-50 p-6 sm:p-8 rounded-xl border border-slate-200 border-dashed text-center">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
              <Upload className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Subir Archivos</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              Formatos aceptados: JPG, PNG. Máximo 5 imágenes.
            </p>

            <label className="inline-flex justify-center items-center px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-sm w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Examinar Equipo
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
              <div className="mt-8 text-left max-w-lg mx-auto bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-semibold text-slate-700 mb-3 text-xs uppercase tracking-wider flex justify-between">
                  <span>Archivos adjuntos</span>
                  <span className="text-slate-400">{evidenceFiles.length}/5 permitidos</span>
                </h4>
                <ul className="space-y-2">
                  {evidenceFiles.map((file, idx) => (
                    <li key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                      <div className="flex items-center overflow-hidden">
                        <FileText className="h-4 w-4 text-slate-400 mr-3 shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                      </div>
                      <button 
                        onClick={() => removeFile(idx)}
                        className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-md transition-colors shrink-0"
                        title="Eliminar"
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

      </div>

      {/* Footer Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center bg-slate-900 p-6 rounded-xl shadow-lg mt-8 gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-full sm:w-auto flex justify-center items-center px-6 py-3 rounded-lg font-semibold transition-colors text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700"
        >
          Cancelar y Volver
        </button>
        <button
          onClick={handleSaveFinal}
          disabled={saving}
          className="w-full sm:w-auto flex justify-center items-center px-8 py-3 rounded-lg font-bold bg-amber-500 text-slate-900 hover:bg-amber-400 transition-colors shadow-md disabled:opacity-70 disabled:bg-slate-700 disabled:text-slate-400"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          {saving ? 'Guardando...' : 'Guardar Documento'}
        </button>
      </div>

      {/* --- MODALS --- */}
      {/* Modal Paso 1 */}
      {activeModalItem !== null && (
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Edit3 className="w-5 h-5 mr-2 text-amber-500" />
            Redacción de Acción Correctiva
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Descripción del Hallazgo</span>
            <p className="text-slate-800 font-medium leading-relaxed">"{item.hallazgo.text}"</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Acción Correctiva Propuesta <span className="text-red-500">*</span></label>
              <textarea
                value={accion}
                onChange={(e) => setAccion(e.target.value)}
                rows={4}
                placeholder="Describa de forma clara la acción a realizar..."
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 text-sm p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Recursos Necesarios <span className="text-red-500">*</span></label>
              <textarea
                value={recursos}
                onChange={(e) => setRecursos(e.target.value)}
                rows={2}
                placeholder="Especifique los recursos humanos, materiales o financieros..."
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 text-sm p-3"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-end shrink-0 gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-5 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm transition-colors flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Guardar Acción
          </button>
        </div>

      </div>
    </div>
  );
}

