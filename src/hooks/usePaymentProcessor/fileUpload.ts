
import { supabase } from '@/integrations/supabase/client';

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
  
  try {
    console.log("[fileUpload.ts] 📸 Inicio del guardado de imagen del comprobante");
    
    const fileName = `${raffleId}_${Date.now()}_${paymentProof.name}`;
    debugLog('Uploading payment proof', { fileName });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment_proofs')
      .upload(fileName, paymentProof);
    
    if (uploadError) {
      console.error("[fileUpload.ts] 🔴 Error al guardar imagen del comprobante:", uploadError);
      throw uploadError;
    }
    
    const { data: urlData } = supabase.storage
      .from('payment_proofs')
      .getPublicUrl(fileName);
    
    console.log("[fileUpload.ts] 🟢 Imagen del comprobante guardada correctamente:", urlData.publicUrl);
    debugLog('Payment proof uploaded', { url: urlData.publicUrl });
    return urlData.publicUrl;
  } catch (error) {
    console.error("[fileUpload.ts] 🔴 Error al guardar imagen del comprobante:", error);
    throw error;
  }
};
