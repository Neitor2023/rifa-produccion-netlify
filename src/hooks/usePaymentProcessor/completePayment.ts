
import { toast } from 'sonner';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { updateNumbersToSold, UpdateResult } from './numberStatusUpdates';
import { uploadImageToSupabase } from './imageUpload';

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
    console.warn('[completePayment.ts] ⚠️ Invalid UUID format detected:', participantId);
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
      console.log(`[completePayment.ts] ${context}:`, data);
    }
  };

  const completePayment = async (data: PaymentFormData): Promise<ConflictResult | void> => {
    try {
      // Validate and sanitize participantId
      const sanitizedParticipantId = sanitizeParticipantId(data.participantId);
      
      console.log("[completePayment.ts] 🎯 Iniciando proceso de pago con datos validados:", {
        participantIdOriginal: data.participantId,
        participantIdSanitizado: sanitizedParticipantId,
        sellerId: data.sellerId,
        tipoBoton: data.clickedButtonType,
        numerosSeleccionados: selectedNumbers,
        cantidadSeleccionada: selectedNumbers.length
      });

      if (!data.buyerName) {
        throw new Error('El nombre del comprador es requerido');
      }

      if (selectedNumbers.length === 0) {
        throw new Error('No hay números seleccionados para procesar');
      }

      // Validate workflow based on button type
      if (data.clickedButtonType === "Pagar Apartados" && !sanitizedParticipantId) {
        throw new Error('Para pagar números apartados se requiere un participante válido');
      }

      // Upload image if provided
      let paymentProofUrl: string | null = null;
      if (data.paymentProof) {
        console.log("[completePayment.ts] 📸 Subiendo comprobante de pago");
        paymentProofUrl = await uploadImageToSupabase(data.paymentProof);
        console.log("[completePayment.ts] ✅ Comprobante subido:", paymentProofUrl);
      }

      // Update numbers to sold status with sanitized participantId
      const updateResult: UpdateResult = await updateNumbersToSold({
        numbers: selectedNumbers,
        selectedNumbers,
        participantId: sanitizedParticipantId || '', // Use empty string as fallback for backward compatibility
        paymentProofUrl,
        raffleNumbers,
        raffleSeller,
        raffleId,
        paymentMethod: data.paymentMethod,
        clickedButtonType: data.clickedButtonType || ''
      });

      if (!updateResult.success) {
        if (updateResult.conflictingNumbers && updateResult.conflictingNumbers.length > 0) {
          console.warn("[completePayment.ts] ⚠️ Números en conflicto:", updateResult.conflictingNumbers);
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
        participantId: sanitizedParticipantId,
        sellerId: data.sellerId,
        clickedButtonType: data.clickedButtonType
      };

      console.log("[completePayment.ts] 💾 Preparando datos para voucher:", {
        comprador: data.buyerName,
        telefono: data.buyerPhone,
        numeros: selectedNumbers.length,
        metodo: data.paymentMethod
      });

      // Set payment data and open voucher
      setPaymentData(paymentDataForVoucher);
      setIsPaymentModalOpen(false);
      setIsVoucherOpen(true);

      // Refresh data
      await refetchRaffleNumbers();

      console.log("[completePayment.ts] ✅ Proceso de pago completado exitosamente");
      toast.success('Pago procesado exitosamente');

      return { success: true };

    } catch (error: any) {
      console.error("[completePayment.ts] ❌ Error en completePayment:", error);
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
