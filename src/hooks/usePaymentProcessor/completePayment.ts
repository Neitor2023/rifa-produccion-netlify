
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
  debugMode = false
}: CompletePaymentProps) {

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[completePayment.ts] ${context}:`, data);
    }
  };

  const completePayment = async (data: PaymentFormData): Promise<ConflictResult | void> => {
    try {
      console.log("[completePayment.ts] 🎯 Iniciando proceso de pago con datos:", {
        participantId: data.participantId,
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

      // Upload image if provided
      let paymentProofUrl: string | null = null;
      if (data.paymentProof) {
        console.log("[completePayment.ts] 📸 Subiendo comprobante de pago");
        paymentProofUrl = await uploadImageToSupabase(data.paymentProof);
        console.log("[completePayment.ts] ✅ Comprobante subido:", paymentProofUrl);
      }

      // Update numbers to sold status - PASANDO selectedNumbers como parámetro adicional
      const updateResult: UpdateResult = await updateNumbersToSold({
        numbers: selectedNumbers, // Esta es la lista original que se mantiene
        selectedNumbers, // NUEVO: Pasar selectedNumbers explícitamente
        participantId: data.participantId || '',
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
        participantId: data.participantId,
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
