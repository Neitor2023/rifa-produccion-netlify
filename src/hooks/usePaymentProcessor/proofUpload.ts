
import { supabase } from '@/integrations/supabase/client';

interface UploadPaymentProofProps {
  paymentProof: File | string | null;
  raffleId: string;
  debugLog: (context: string, data: any) => void;
}

// CORRECCIÓN CRÍTICA: Función EXCLUSIVA para payment_proof (imágenes de transferencia)
export const uploadPaymentProofToCorrectBucket = async ({
  paymentProof,
  raffleId,
  debugLog
}: UploadPaymentProofProps): Promise<string | null> => {
  console.log('[proofUpload.ts] 🔍 INVESTIGACIÓN PROFUNDA: uploadPaymentProofToCorrectBucket iniciada');
  console.log('[proofUpload.ts] 📋 Parámetros:', {
    hasPaymentProof: !!paymentProof,
    isFile: paymentProof instanceof File,
    raffleId
  });

  if (!paymentProof || !(paymentProof instanceof File)) {
    console.log('[proofUpload.ts] ⚠️ No hay archivo de prueba de pago válido para subir');
    return typeof paymentProof === 'string' ? paymentProof : null;
  }
  
  const bucketName = 'payment-proofs'; // BUCKET EXCLUSIVO para payment_proof
  
  try {
    console.log(`[proofUpload.ts] 📸 CORRECCIÓN DEFINITIVA: Guardando imagen de TRANSFERENCIA EXCLUSIVAMENTE en bucket: ${bucketName}`);
    
    const fileName = `transfer_proof_${raffleId}_${Date.now()}_${paymentProof.name}`;
    console.log(`[proofUpload.ts] 📝 Nombre de archivo generado: ${fileName}`);
    debugLog('Uploading payment TRANSFER proof to EXCLUSIVE bucket', { fileName, bucket: bucketName });
    
    // Crear bucket si no existe
    try {
      const { error: createBucketError } = await supabase.storage.createBucket(bucketName, { public: true });
      if (createBucketError && !createBucketError.message.includes('already exists')) {
        console.warn(`[proofUpload.ts] ⚠️ Error menor al crear bucket ${bucketName}:`, createBucketError.message);
      }
    } catch (bucketError) {
      console.log(`[proofUpload.ts] ℹ️ Bucket ${bucketName} probablemente ya existe`);
    }
    
    console.log(`[proofUpload.ts] 📤 Subiendo archivo a bucket ${bucketName}...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, paymentProof, {
        contentType: paymentProof.type,
        upsert: true
      });
    
    if (uploadError) {
      console.error(`[proofUpload.ts] 🔴 ERROR CRÍTICO: No se pudo guardar imagen de transferencia en bucket "${bucketName}":`, uploadError);
      throw new Error(`Error al subir imagen de transferencia al bucket "${bucketName}": ${uploadError.message}`);
    }
    
    console.log(`[proofUpload.ts] ✅ Archivo subido exitosamente:`, uploadData);
    
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    console.log(`[proofUpload.ts] 🟢 ÉXITO DEFINITIVO: Imagen de TRANSFERENCIA guardada en bucket correcto "${bucketName}":`, urlData.publicUrl);
    console.log(`[proofUpload.ts] ✅ VERIFICACIÓN FINAL: URL termina correctamente con /payment-proofs/:`, urlData.publicUrl.includes('/payment-proofs/'));
    console.log(`[proofUpload.ts] 🔍 DIAGNÓSTICO CRÍTICO: URL generada para raffle_number_transfers.payment_proof:`, {
      url: urlData.publicUrl,
      esString: typeof urlData.publicUrl === 'string',
      longitudUrl: urlData.publicUrl.length,
      empiezaConHttp: urlData.publicUrl.startsWith('http'),
      incluyeBucket: urlData.publicUrl.includes('/payment-proofs/'),
      urlCompleta: urlData.publicUrl
    });
    
    debugLog('Payment TRANSFER proof uploaded to EXCLUSIVE correct bucket', { url: urlData.publicUrl, bucket: bucketName });
    return urlData.publicUrl;
  } catch (error) {
    console.error(`[proofUpload.ts] 🔴 ERROR FATAL al guardar imagen de transferencia en bucket "${bucketName}":`, error);
    throw error;
  }
};
