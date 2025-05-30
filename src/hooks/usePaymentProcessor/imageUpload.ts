
import { supabase } from '@/integrations/supabase/client';
import { getPaymentProofsBucket } from '@/lib/supabase-env';

export const uploadImageToSupabase = async (paymentProof: File): Promise<string | null> => {
  if (!paymentProof || !(paymentProof instanceof File)) {
    console.log("[imageUpload.ts] ⚠️ No se proporcionó archivo válido para subir");
    return null;
  }
  
  const bucketName = getPaymentProofsBucket();
  
  try {
    console.log(`[imageUpload.ts] 📸 Iniciando subida de imagen a bucket: ${bucketName}`);
    
    const fileName = `payment_proof_${Date.now()}_${paymentProof.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, paymentProof);
    
    if (uploadError) {
      console.error(`[imageUpload.ts] ❌ Error al subir imagen a bucket "${bucketName}":`, uploadError);
      throw new Error(`Error al subir imagen: ${uploadError.message}`);
    }
    
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    console.log(`[imageUpload.ts] ✅ Imagen subida exitosamente a bucket "${bucketName}":`, urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error(`[imageUpload.ts] ❌ Error general al subir imagen:`, error);
    throw error;
  }
};
