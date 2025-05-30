
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/types/payment';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { uploadPaymentProof } from './fileUpload';
import { processParticipant } from './participantProcessing';
import { processFraudReport } from './fraudReportProcessing';
import { updateNumbersToSold } from './numberStatusUpdates';
import { RaffleNumber } from '@/lib/constants/types';

interface UsePaymentCompletionProps {
  raffleSeller: any;
  raffleId: string;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo) => void;
  debugMode?: boolean;
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to sanitize participantId
function sanitizeParticipantId(participantId: string | undefined | null): string | null {
  if (!participantId || participantId.trim() === '') {
    return null;
  }
  
  if (!isValidUUID(participantId)) {
    console.warn('[paymentCompletion.ts] + UUID inválido detectado:', participantId);
    return null;
  }
  
  return participantId;
}

export function usePaymentCompletion({
  raffleSeller,
  raffleId,
  setValidatedBuyerData,
  debugMode = false
}: UsePaymentCompletionProps) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PaymentCompletion - ${context}]:`, data);
    }
  };

  const completePaymentProcess = async (
    data: PaymentFormData,
    numbers: string[]
  ) => {
    console.log("[paymentCompletion.ts] + Iniciando proceso completo de pago:", {
      participantId: data.participantId,
      numerosSeleccionados: numbers,
      tieneReporteSospechoso: !!(data.reporteSospechoso && data.reporteSospechoso.trim())
    });

    // Procesar participante primero
    const participantId = await processParticipant({ data, raffleId, debugLog });
    
    if (!participantId) {
      throw new Error('Error al procesar participante');
    }

    console.log("[paymentCompletion.ts] + Participante procesado con ID:", participantId);

    // Procesar reporte de fraude si existe
    if (data.reporteSospechoso && data.reporteSospechoso.trim()) {
      await processFraudReport({
        participantId,
        sellerId: data.sellerId || raffleSeller?.seller_id || null,
        raffleId,
        reporteSospechoso: data.reporteSospechoso,
        debugLog
      });
      console.log("[paymentCompletion.ts] + Reporte de fraude procesado");
    }

    // Subir comprobante de pago si existe
    let paymentProofUrl: string | null = null;
    if (data.paymentProof) {
      paymentProofUrl = await uploadPaymentProof({ 
        paymentProof: data.paymentProof, 
        raffleId, 
        debugLog 
      });
      console.log("[paymentCompletion.ts] + Comprobante subido en URL:", paymentProofUrl);
    }

    // Actualizar números a vendido
    const updateResult = await updateNumbersToSold({
      numbers,
      selectedNumbers: numbers,
      participantId,
      paymentProofUrl,
      raffleNumbers: [],
      raffleSeller,
      raffleId,
      paymentMethod: data.paymentMethod || 'cash',
      clickedButtonType: data.clickedButtonType || 'Pagar'
    });

    console.log("[paymentCompletion.ts] + Proceso completo finalizado exitosamente");
    return updateResult;
  };

  return {
    uploadPaymentProof: (paymentProof: File | string | null): Promise<string | null> => 
      uploadPaymentProof({ paymentProof, raffleId, debugLog }),
    processParticipant: (data: PaymentFormData): Promise<string | null> => 
      processParticipant({ data, raffleId, debugLog }),
    processFraudReport: (
      participantId: string,
      sellerId: string | null,
      reporteSospechoso: string
    ): Promise<void> => 
      processFraudReport({ participantId, sellerId, raffleId, reporteSospechoso, debugLog }),
    completePaymentProcess,
    updateNumbersToSold: (
      numbers: string[],
      participantId: string,
      paymentProofUrl: string | null,
      raffleNumbers: RaffleNumber[],
      paymentMethod: string = 'cash',
      clickedButtonType: string = 'Pagar'
    ) => {
      // Sanitize participantId before passing to updateNumbersToSold
      const sanitizedParticipantId = sanitizeParticipantId(participantId);
      
      debugLog('updateNumbersToSold called with sanitized data', {
        originalParticipantId: participantId,
        sanitizedParticipantId,
        numbersCount: numbers.length,
        clickedButtonType
      });
      
      return updateNumbersToSold({ 
        numbers, 
        selectedNumbers: numbers,
        participantId: sanitizedParticipantId || '', // Use empty string as fallback
        paymentProofUrl, 
        raffleNumbers, 
        raffleSeller,
        raffleId,
        paymentMethod,
        clickedButtonType
      });
    }
  };
}
