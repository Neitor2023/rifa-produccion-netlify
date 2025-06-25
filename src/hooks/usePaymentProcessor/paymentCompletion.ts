
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/types/payment';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { uploadPaymentProofToCorrectBucket } from './proofUpload';
import { processParticipant } from './participantProcessing';
import { processFraudReport } from './fraudReportProcessing';
import { updateNumbersToSold } from './numberStatusUpdates';
import { RaffleNumber } from '@/lib/constants/types';

interface UsePaymentCompletionProps {
  raffleSeller: any;
  raffleId: string;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo) => void;
  debugMode?: boolean;
  rafflePrice?: number;
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
  debugMode = false,
  rafflePrice
}: UsePaymentCompletionProps) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PaymentCompletion - ${context}]:`, data);
    }
  };

  console.log("[paymentCompletion.ts] 🎯 CORRECCIÓN: Hook inicializado con rafflePrice:", rafflePrice);

  const completePaymentProcess = async (
    data: PaymentFormData,
    numbers: string[]
  ) => {
    console.log("[paymentCompletion] 🚀 INICIANDO proceso completo de pago");
    console.log("[paymentCompletion] 📋 DATOS RECIBIDOS:", {
      participantId: data.participantId,
      numerosSeleccionados: numbers,
      numerosCount: numbers?.length || 0,
      tieneReporteSosp: !!(data.reporteSospechoso && data.reporteSospechoso.trim()),
      metodoPago: data.paymentMethod,
      clickedButtonType: data.clickedButtonType,
      hasPaymentProof: !!data.paymentProof,
      paymentProofType: typeof data.paymentProof,
      paymentProofIsFile: data.paymentProof instanceof File,
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      raffleId,
      selectedBankId: data.selectedBankId,
      rafflePrice: rafflePrice
    });

    // VALIDACIÓN CRÍTICA COMPLETA
    if (!numbers || numbers.length === 0) {
      console.error("[paymentCompletion] ❌ CRÍTICO: No hay números para procesar");
      throw new Error('No hay números para procesar');
    }

    if (!data.buyerName || data.buyerName.trim() === '') {
      console.error("[paymentCompletion] ❌ CRÍTICO: buyerName es requerido pero vacío");
      throw new Error('Nombre del comprador es requerido');
    }

    if (!raffleId || raffleId.trim() === '') {
      console.error("[paymentCompletion] ❌ CRÍTICO: raffleId es requerido");
      throw new Error('raffleId es requerido');
    }

    try {
      // PASO 1: Procesar participante primero
      console.log("[paymentCompletion] 📝 PASO 1: Procesando participante");
      const participantId = await processParticipant({ data, raffleId, debugLog });
      
      if (!participantId || participantId.trim() === '') {
        console.error("[paymentCompletion] ❌ CRÍTICO PASO 1: No se pudo procesar participante - ID vacío");
        throw new Error('Error al procesar participante - ID no generado');
      }

      console.log("[paymentCompletion] ✅ PASO 1 COMPLETADO: Participante procesado con ID:", participantId);

      // CRÍTICO: Actualizar el participantId en los datos
      data.participantId = participantId;
      console.log("[paymentCompletion] 🔄 participantId actualizado en data:", data.participantId);

      // PASO 2: Procesar reporte de fraude si existe
      if (data.reporteSospechoso && data.reporteSospechoso.trim()) {
        console.log("[paymentCompletion] 📝 PASO 2: Procesando reporte de fraude");
        await processFraudReport({
          participantId,
          sellerId: data.sellerId || raffleSeller?.seller_id || null,
          raffleId,
          reporteSospechoso: data.reporteSospechoso,
          debugLog
        });
        console.log("[paymentCompletion] ✅ PASO 2 COMPLETADO");
      } else {
        console.log("[paymentCompletion] ⏭️ PASO 2 OMITIDO: No hay reporte de fraude");
      }

      // PASO 3: Subir comprobante SOLO a bucket payment-proofs
      let paymentProofUrl: string | null = null;
      if (data.paymentProof && data.paymentMethod === 'transfer') {
        console.log("[paymentCompletion] 📝 PASO 3: Subiendo comprobante");
        console.log("[paymentCompletion] 🔍 VALIDACIÓN ARCHIVO:", {
          esFile: data.paymentProof instanceof File,
          tipoArchivo: typeof data.paymentProof,
          tamaño: data.paymentProof instanceof File ? data.paymentProof.size : 'N/A',
          nombre: data.paymentProof instanceof File ? data.paymentProof.name : 'N/A',
          metodoPago: data.paymentMethod
        });
        
        try {
          paymentProofUrl = await uploadPaymentProofToCorrectBucket({ 
            paymentProof: data.paymentProof, 
            raffleId, 
            debugLog 
          });
          
          console.log("[paymentCompletion] ✅ PASO 3 COMPLETADO: URL generada:", paymentProofUrl);
          console.log("[paymentCompletion] 🔍 VERIFICACIÓN CRÍTICA: paymentProofUrl válida:", {
            esString: typeof paymentProofUrl === 'string',
            tieneUrl: !!paymentProofUrl,
            empiezaConHttp: paymentProofUrl?.startsWith('http'),
            incluyePaymentProofs: paymentProofUrl?.includes('/payment-proofs/'),
            longitudUrl: paymentProofUrl?.length
          });
          
          // CRÍTICO: Actualizar data.paymentProof con la URL para que DigitalVoucher pueda mostrar la imagen
          if (paymentProofUrl) {
            data.paymentProof = paymentProofUrl;
            console.log("[paymentCompletion] 🔄 data.paymentProof actualizado con URL para voucher");
          }
        } catch (uploadError) {
          console.error("[paymentCompletion] ❌ ERROR EN PASO 3 - Subida de comprobante:", uploadError);
          console.error("[paymentCompletion] 📋 Continuando sin URL de comprobante");
          paymentProofUrl = null;
        }
      } else {
        console.log("[paymentCompletion] ⏭️ PASO 3 OMITIDO:", {
          tieneComprobante: !!data.paymentProof,
          esTransferencia: data.paymentMethod === 'transfer',
          metodoPago: data.paymentMethod
        });
      }

      // PASO 4: Actualizar números como vendidos CON datos de transferencia
      console.log("[paymentCompletion] 📝 PASO 4: Actualizando números como vendidos");
      console.log("[paymentCompletion] 🎯 CORRECCIÓN CRÍTICA: Verificando datos antes del update:", {
        paymentProofUrl: paymentProofUrl,
        paymentProofUrlEsValida: !!paymentProofUrl,
        rafflePrice: rafflePrice,
        selectedBankId: data.selectedBankId,
        paymentMethod: data.paymentMethod,
        esTransferencia: data.paymentMethod === 'transfer'
      });
      
      const updateResult = await updateNumbersToSold({
        numbers,
        selectedNumbers: numbers,
        participantId,
        paymentProofUrl, // CRÍTICO: Pasar la URL del comprobante
        raffleNumbers: [],
        raffleSeller,
        raffleId,
        paymentMethod: data.paymentMethod || 'cash',
        clickedButtonType: data.clickedButtonType || 'Pagar',
        selectedBankId: data.selectedBankId,
        rafflePrice: rafflePrice
      });

      console.log("[paymentCompletion] ✅ PASO 4 COMPLETADO");
      console.log("[paymentCompletion] 📊 RESULTADO UPDATE:", {
        updateResult,
        success: updateResult?.success,
        updatedNumbers: updateResult?.updatedNumbers?.length || 0
      });
      
      console.log("[paymentCompletion] 🎯 PROCESO COMPLETADO EXITOSAMENTE");
      
      return { success: true, updatedNumbers: updateResult };
      
    } catch (error: any) {
      console.error("[paymentCompletion] ❌ ERROR EN EL PROCESO:", error);
      console.error("[paymentCompletion] 📋 ERROR STACK:", error?.stack);
      throw new Error(`Error crítico en proceso de pago: ${error?.message || error}`);
    }
  };

  return {
    uploadPaymentProof: (paymentProof: File | string | null): Promise<string | null> => 
      uploadPaymentProofToCorrectBucket({ paymentProof, raffleId, debugLog }),
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
      clickedButtonType: string = 'Pagar',
      selectedBankId?: string
    ) => {
      const sanitizedParticipantId = sanitizeParticipantId(participantId);
      
      console.log("[paymentCompletion.ts] 🎯 CORRECCIÓN: updateNumbersToSold wrapper llamado con rafflePrice:", rafflePrice);
      console.log("[paymentCompletion.ts] 🔍 DIAGNÓSTICO CRÍTICO: paymentProofUrl en wrapper:", {
        paymentProofUrl,
        esString: typeof paymentProofUrl === 'string',
        tieneValor: !!paymentProofUrl
      });
      
      debugLog('updateNumbersToSold called with sanitized data', {
        originalParticipantId: participantId,
        sanitizedParticipantId,
        numbersCount: numbers.length,
        clickedButtonType,
        metodoPago: paymentMethod,
        selectedBankId: selectedBankId,
        rafflePrice: rafflePrice,
        paymentProofUrl: paymentProofUrl
      });
      
      return updateNumbersToSold({ 
        numbers, 
        selectedNumbers: numbers,
        participantId: sanitizedParticipantId || '', 
        paymentProofUrl,
        raffleNumbers, 
        raffleSeller,
        raffleId,
        paymentMethod,
        clickedButtonType,
        selectedBankId,
        rafflePrice: rafflePrice
      });
    }
  };
}
