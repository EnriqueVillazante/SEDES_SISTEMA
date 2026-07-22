import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

interface ImageUploaderProps {
  bucketName: string;
  fieldPath: string; // The exact path in react-hook-form, e.g. "seccion_2_respuestas.residuos_comprobantes"
  setValue: any;
  watch: any;
  maxImages?: number;
}

export default function ImageUploader({ bucketName, fieldPath, setValue, watch, maxImages = 5 }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Watch the current array of URLs for this field (default to empty array)
  const currentImages: string[] = watch(fieldPath) || [];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (currentImages.length + files.length > maxImages) {
      toast.error(`Puedes subir un máximo de ${maxImages} imágenes por sección.`);
      return;
    }

    setIsUploading(true);
    const newUrls: string[] = [...currentImages];

    for (const file of files) {
      try {
        // 1. Opciones de Compresión (Asegura imágenes livianas)
        const options = {
          maxSizeMB: 1, // Tamaño máximo 1MB
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        
        // 2. Comprimir
        const compressedFile = await imageCompression(file, options);
        
        // 3. Generar nombre único para la imagen
        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 4. Subir a Supabase
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, compressedFile);

        if (uploadError) {
          throw uploadError;
        }

        // 5. Obtener URL Pública
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        newUrls.push(publicUrlData.publicUrl);
        
      } catch (error) {
        console.error("Error al procesar la imagen:", error);
        toast.error(`No se pudo subir la imagen ${file.name}`);
      }
    }

    // 6. Actualizar el estado del formulario con las nuevas URLs
    setValue(fieldPath, newUrls, { shouldDirty: true, shouldValidate: true });
    setIsUploading(false);
    
    // Resetear el input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async (indexToRemove: number) => {
    const urlToRemove = currentImages[indexToRemove];
    
    // Opcional: Eliminar del bucket de Supabase para no ocupar espacio "basura"
    try {
      // Extraemos el nombre del archivo de la URL
      const urlParts = urlToRemove.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      await supabase.storage.from(bucketName).remove([fileName]);
    } catch (e) {
      console.warn("No se pudo eliminar de supabase, procediendo a quitar de la vista", e);
    }

    // Quitar del array local
    const newUrls = currentImages.filter((_, idx) => idx !== indexToRemove);
    setValue(fieldPath, newUrls, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-700 flex items-center">
            <ImageIcon className="w-4 h-4 mr-2 text-teal-600" />
            Comprobantes Fotográficos
          </h4>
          <p className="text-xs text-slate-500 mt-1">Sube actas o fotos (Max. {maxImages}). Serán comprimidas automáticamente.</p>
        </div>
        
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
          disabled={isUploading || currentImages.length >= maxImages}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || currentImages.length >= maxImages}
          className="flex-shrink-0 inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-teal-500 hover:text-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-teal-600" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {isUploading ? 'Subiendo...' : 'Añadir Fotos'}
        </button>
      </div>

      {/* Grid de Previsualización */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
          {currentImages.map((url, idx) => (
            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
              <img src={url} alt={`Comprobante ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 hover:scale-110 transition-all shadow-lg"
                  title="Eliminar imagen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
