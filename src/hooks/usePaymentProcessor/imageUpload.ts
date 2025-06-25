
import { supabase } from '@/integrations/supabase/client';

export const uploadImageToSupabase = async (paymentProof: File): Promise<string | null> => {
  if (!paymentProof || !(paymentProof instanceof File)) {
    console.log("[imageUpload.ts] ⚠️ No se proporcionó archivo válido para subir");
    return null;
  }
  
  // BUCKET EXCLUSIVO para imágenes de prueba de transferencia
  const bucketName = 'payment-proofs';
  
  try {
    console.log(`[imageUpload.ts] 📸 CORRECCIÓN: Subiendo imagen de TRANSFERENCIA exclusivamente a bucket: ${bucketName}`);
    
    const fileName = `transfer_${Date.now()}_${paymentProof.name}`;
    
    // Crear bucket si no existe
    try {
      const { error: createBucketError } = await supabase.storage.createBucket(bucketName, { public: true });
      if (createBucketError && !createBucketError.message.includes('already exists')) {
        console.warn(`[imageUpload.ts] ⚠️ Error menor al crear bucket ${bucketName}:`, createBucketError.message);
      }
    } catch (bucketError) {
      console.log(`[imageUpload.ts] ℹ️ Bucket ${bucketName} probablemente ya existe`);
    }
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, paymentProof, {
        contentType: paymentProof.type,
        upsert: true
      });
    
    if (uploadError) {
      console.error(`[imageUpload.ts] ❌ ERROR: No se pudo subir imagen de transferencia a bucket "${bucketName}":`, uploadError);
      throw new Error(`Error al subir imagen de transferencia: ${uploadError.message}`);
    }
    
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    console.log(`[imageUpload.ts] ✅ ÉXITO: Imagen de transferencia subida correctamente a bucket "${bucketName}":`, urlData.publicUrl);
    console.log(`[imageUpload.ts] ✅ VERIFICACIÓN: URL correcta termina con /payment-proofs/: ${urlData.publicUrl.includes('/payment-proofs/')}`);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error(`[imageUpload.ts] ❌ Error general al subir imagen de transferencia:`, error);
    throw error;
  }
};
