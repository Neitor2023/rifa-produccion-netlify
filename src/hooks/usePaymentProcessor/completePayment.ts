
import { toast } from 'sonner';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { updateNumbersToSold, UpdateResult } from './numberStatusUpdates';
import { uploadImageToSupabase } from './imageUpload';
import { processParticipant } from './participantProcessing';
import { processFraudReport } from './fraudReportProcessing';

export interface ConflictResult {
  success: boolean;
  conflictingNumbers?: string[];
  message?: string;
}

interface CompletePaymentProps {
  selectedNumbers: string[];
  raffleSeller: any;
  raffleId: string;
  raffleNumbers: any[];
  setIsVoucherOpen: (open: boolean) => void;
  setPaymentData: (data: any) => void;
  setIsPaymentModalOpen: (open: boolean) => void;
  refetchRaffleNumbers: () => Promise<any>;
  debugMode?: boolean;
  allowVoucherPrint?: boolean;
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
    console.warn('[completePayment.ts] + UUID inválido detectado, será procesado como nuevo participante:', participantId);
    return null;
  }
  
  return participantId;
}

export function useCompletePayment({
  selectedNumbers,
  raffleSeller,
  raffleId,
  raffleNumbers,
  setIsVoucherOpen,
  setPaymentData,
  setIsPaymentModalOpen,
  refetchRaffleNumbers,
  debugMode = false,
  allowVoucherPrint = true
}: CompletePaymentProps) {

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[completePayment.ts] + ${context}:`, data);
    }
  };

  const completePayment = async (data: PaymentFormData): Promise<ConflictResult | void> => {
    try {
      console.log("[completePayment.ts] + Iniciando proceso de pago completo con datos:", {
        participantIdOriginal: data.participantId,
        sellerId: data.sellerId,
        tipoBoton: data.clickedButtonType,
        numerosSeleccionados: selectedNumbers,
        cantidadSeleccionada: selectedNumbers.length,
        tieneReporteSospechoso: !!(data.reporteSospechoso && data.reporteSospechoso.trim())
      });

      if (!data.buyerName) {
        throw new Error('El nombre del comprador es requerido');
      }

      if (selectedNumbers.length === 0) {
        throw new Error('No hay números seleccionados para procesar');
      }

      // Procesar o crear participante primero
      console.log("[completePayment.ts] + Procesando datos del participante...");
      const participantId = await processParticipant({
        data,
        raffleId,
        debugLog
      });

      if (!participantId) {
        throw new Error('Error al procesar participante');
      }

      console.log("[completePayment.ts] + Participante procesado exitosamente con ID:", participantId);

      // Procesar reporte de actividad sospechosa si existe
      if (data.reporteSospechoso && data.reporteSospechoso.trim()) {
        console.log("[completePayment.ts] + Procesando reporte de actividad sospechosa...");
        await processFraudReport({
          participantId,
          sellerId: data.sellerId || raffleSeller?.seller_id || null,
          raffleId,
          reporteSospechoso: data.reporteSospechoso,
          debugLog
        });
        console.log("[completePayment.ts] + Reporte de actividad sospechosa procesado correctamente");
      }

      // Upload image if provided
      let paymentProofUrl: string | null = null;
      if (data.paymentProof) {
        console.log("[completePayment.ts] + Subiendo comprobante de pago...");
        paymentProofUrl = await uploadImageToSupabase(data.paymentProof);
        console.log("[completePayment.ts] + Comprobante subido correctamente en URL:", paymentProofUrl);
      }

      // Update numbers to sold status with the processed participantId
      console.log("[completePayment.ts] + Actualizando números a estado vendido...");
      const updateResult: UpdateResult = await updateNumbersToSold({
        numbers: selectedNumbers,
        selectedNumbers,
        participantId: participantId, // Usar el participantId procesado
        paymentProofUrl,
        raffleNumbers,
        raffleSeller,
        raffleId,
        paymentMethod: data.paymentMethod,
        clickedButtonType: data.clickedButtonType || ''
      });

      if (!updateResult.success) {
        if (updateResult.conflictingNumbers && updateResult.conflictingNumbers.length > 0) {
          console.warn("[completePayment.ts] + Números en conflicto detectados:", updateResult.conflictingNumbers);
          return {
            success: false,
            conflictingNumbers: updateResult.conflictingNumbers,
            message: updateResult.message || 'Algunos números ya no están disponibles'
          };
        }
        
        throw new Error(updateResult.message || 'Error al actualizar números');
      }

      // Prepare payment data for voucher
      const paymentDataForVoucher = {
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        buyerCedula: data.buyerCedula,
        selectedNumbers,
        paymentMethod: data.paymentMethod,
        paymentProof: paymentProofUrl,
        participantId: participantId,
        sellerId: data.sellerId,
        clickedButtonType: data.clickedButtonType
      };

      console.log("[completePayment.ts] + Preparando datos para voucher:", {
        comprador: data.buyerName,
        telefono: data.buyerPhone,
        numeros: selectedNumbers.length,
        metodo: data.paymentMethod,
        participantId: participantId
      });

      // Set payment data and open voucher
      setPaymentData(paymentDataForVoucher);
      setIsPaymentModalOpen(false);
      setIsVoucherOpen(true);

      // Refresh data
      await refetchRaffleNumbers();

      console.log("[completePayment.ts] + Proceso de pago completado exitosamente para participante:", participantId);
      toast.success('Pago procesado exitosamente');

      return { success: true };

    } catch (error: any) {
      console.error("[completePayment.ts] + Error en completePayment:", error);
      toast.error(`Error al procesar el pago: ${error.message}`);
      throw error;
    }
  };

  return { completePayment };
}

// Export the function for backwards compatibility
export const handleCompletePayment = (props: CompletePaymentProps) => {
  const { completePayment } = useCompletePayment(props);
  return completePayment;
};
