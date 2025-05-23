
import { supabase } from '@/integrations/supabase/client';
import { getPaymentProofsBucket } from '@/lib/supabase-env';

interface UploadPaymentProofProps {
  paymentProof: File | string | null;
  raffleId: string;
  debugLog: (context: string, data: any) => void;
}

export const uploadPaymentProof = async ({
  paymentProof,
  raffleId,
  debugLog
}: UploadPaymentProofProps): Promise<string | null> => {
  if (!paymentProof || !(paymentProof instanceof File)) {
    return typeof paymentProof === 'string' ? paymentProof : null;
  }
  
  const bucketName = getPaymentProofsBucket();
  
  try {
    console.log(`[fileUpload.ts] 📸 Inicio del guardado de imagen del comprobante en bucket: ${bucketName}`);
    
    const fileName = `${raffleId}_${Date.now()}_${paymentProof.name}`;
    debugLog('Uploading payment proof', { fileName, bucket: bucketName });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, paymentProof);
    
    if (uploadError) {
      console.error(`[fileUpload.ts] 🔴 Error al guardar imagen del comprobante en bucket "${bucketName}":`, uploadError);
      throw new Error(`Error al subir imagen al bucket "${bucketName}": ${uploadError.message}`);
    }
    
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    console.log(`[fileUpload.ts] 🟢 Imagen del comprobante guardada correctamente en bucket "${bucketName}":`, urlData.publicUrl);
    debugLog('Payment proof uploaded', { url: urlData.publicUrl, bucket: bucketName });
    return urlData.publicUrl;
  } catch (error) {
    console.error(`[fileUpload.ts] 🔴 Error al guardar imagen del comprobante en bucket "${bucketName}":`, error);
    throw error;
  }
};
