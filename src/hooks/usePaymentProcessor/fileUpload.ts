
import { uploadPaymentProofToCorrectBucket } from './proofUpload';

interface UploadPaymentProofProps {
  paymentProof: File | string | null;
  raffleId: string;
  debugLog: (context: string, data: any) => void;
}

// CORRECCIÓN CRÍTICA: Función que EXCLUSIVAMENTE maneja payment_proof (transferencias)
export const uploadPaymentProof = async ({
  paymentProof,
  raffleId,
  debugLog
}: UploadPaymentProofProps): Promise<string | null> => {
  console.log('[fileUpload.ts] 🔄 INVESTIGACIÓN PROFUNDA: Función uploadPaymentProof llamada');
  console.log('[fileUpload.ts] 📋 Parámetros:', {
    tienePaymentProof: !!paymentProof,
    paymentProofTipo: typeof paymentProof,
    esFile: paymentProof instanceof File,
    raffleId
  });
  
  if (!paymentProof || !(paymentProof instanceof File)) {
    console.log('[fileUpload.ts] ⚠️ No hay archivo válido para subir o no es File');
    return typeof paymentProof === 'string' ? paymentProof : null;
  }

  console.log('[fileUpload.ts] 🔄 CORRECCIÓN: Redirigiendo EXCLUSIVAMENTE a uploadPaymentProofToCorrectBucket (bucket payment-proofs)');
  debugLog('uploadPaymentProof - redirecting to payment-proofs bucket ONLY', { 
    fileName: paymentProof.name,
    fileSize: paymentProof.size,
    fileType: paymentProof.type
  });
  
  // CORRECCIÓN CRÍTICA: Usar la función dedicada que va SOLO a payment-proofs
  const result = await uploadPaymentProofToCorrectBucket({
    paymentProof,
    raffleId,
    debugLog
  });
  
  console.log('[fileUpload.ts] 📋 Resultado de uploadPaymentProofToCorrectBucket:', {
    resultado: result,
    esValidoURL: result?.startsWith('http'),
    bucketCorrecto: result?.includes('/payment-proofs/')
  });
  
  return result;
};
