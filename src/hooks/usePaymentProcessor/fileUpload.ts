
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
    const fileName = `${raffleId}_${Date.now()}_${paymentProof.name}`;
    debugLog('Uploading payment proof', { fileName });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment_proofs')
      .upload(fileName, paymentProof);
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage
      .from('payment_proofs')
      .getPublicUrl(fileName);
    
    debugLog('Payment proof uploaded', { url: urlData.publicUrl });
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    throw error;
  }
};
