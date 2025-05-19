
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { ValidatedBuyerInfo } from '@/types/participant';
import { toast } from 'sonner';
import { updateNumbersToSold } from './numberStatusUpdates';

interface UseCompletePaymentProps {
  raffleSeller: any;
  raffleId: string;
  selectedNumbers: string[];
  refetchRaffleNumbers: () => Promise<any>;
  setPaymentData: (data: PaymentFormData) => void;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  setIsVoucherOpen: (isOpen: boolean) => void;
  allowVoucherPrint: boolean;
  uploadPaymentProof: (paymentProof: File | string | null) => Promise<string | null>;
  processParticipant: (data: PaymentFormData) => Promise<string | null>;
  supabase: any;
  debugMode?: boolean;
}

// Define the return type for conflict checks
export interface ConflictResult {
  success: boolean;
  conflictingNumbers?: string[];
  message?: string;
}

export function useCompletePayment({
  raffleSeller,
  raffleId,
  selectedNumbers,
  refetchRaffleNumbers,
  setPaymentData,
  setIsPaymentModalOpen,
  setIsVoucherOpen,
  allowVoucherPrint,
  uploadPaymentProof,
  processParticipant,
  supabase,
  debugMode
}: UseCompletePaymentProps) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ${context}]:`, data);
    }
  };

  // Function to verify numbers are not sold by other sellers
  const verifyNumbersNotSoldByOthers = async (numbers: string[]): Promise<ConflictResult> => {
    try {
      const numbersInts = numbers.map(numStr => parseInt(numStr, 10));
      const { data: existingNumbers, error: checkError } = await supabase
        .from('raffle_numbers')
        .select('number, participant_id, status')
        .eq('raffle_id', raffleId)
        .in('number', numbersInts);

      if (checkError) {
        console.error('❌ Error al verificar la existencia de números:', checkError);
        return { success: false, message: 'Error al verificar la disponibilidad de números' };
      }

      // Verificar si algún número ya pertenece a otro participante con estado "sold"
      const conflictingNumbers = existingNumbers
        ?.filter(n => n.status === 'sold')
        .map(n => n.number.toString());

      if (conflictingNumbers && conflictingNumbers.length > 0) {
        console.error('❌ Números ya reservados por otro participante:', conflictingNumbers);
        return { success: false, conflictingNumbers };
      }

      return { success: true };
    } catch (error) {
      console.error("❌ Error en verifyNumbersNotSoldByOthers:", error);
      return { success: false, message: "Error al verificar la disponibilidad de números" };
    }
  };

  // Handle complete payment form submission
  const handleCompletePayment = async (formData: PaymentFormData): Promise<ConflictResult> => {
    try {
      debugLog("handleCompletePayment", "Starting payment completion process");
      console.log("[completePayment.ts] Iniciando proceso de completar pago con datos:", { 
        nombreComprador: formData.buyerName,
        metodoPago: formData.paymentMethod,
        numerosSeleccionados: selectedNumbers.length,
        clickedButtonType: formData.clickedButtonType || 'No especificado'
      });
      
      // Validate we have selected numbers
      if (!selectedNumbers.length) {
        toast.error("No hay números seleccionados para procesar el pago");
        return { success: false, message: "No hay números seleccionados" };
      }
      
      // Upload payment proof if present
      let paymentProofUrl = null;
      if (formData.paymentProof) {
        paymentProofUrl = await uploadPaymentProof(formData.paymentProof);
        debugLog("handleCompletePayment", `Payment proof uploaded: ${paymentProofUrl}`);
      }
      
      // Create or find participant
      const participantId = await processParticipant(formData);
      if (!participantId) {
        toast.error("Error al procesar datos del comprador");
        return { success: false, message: "Error al procesar datos del comprador" };
      }
      
      // Add participant ID to form data for later use
      formData.participantId = participantId;
      
      // Check that all numbers are still available before setting to sold
      const verificationResult = await verifyNumbersNotSoldByOthers(selectedNumbers);
      if (!verificationResult.success) {
        return verificationResult;
      }
      
      // Update all numbers to sold in the database, including payment method
      const updateResult = await updateNumbersToSold({
        numbers: selectedNumbers,
        participantId,
        paymentProofUrl,
        raffleNumbers: [], // These will be fetched inside the function
        raffleSeller,
        raffleId,
        paymentMethod: formData.paymentMethod // Pass payment method
      });
      
      if (!updateResult.success) {
        return { 
          success: false, 
          conflictingNumbers: updateResult.conflictingNumbers,
          message: "Error al actualizar los números a vendidos"
        };
      }
      
      // Close payment modal and show voucher
      setPaymentData(formData);
      setIsPaymentModalOpen(false);
      
      // Refresh the numbers grid
      await refetchRaffleNumbers();
      
      // Always show voucher or alert based on allowVoucherPrint
      setIsVoucherOpen(true);
      
      return { success: true };
    } catch (error) {
      console.error("[completePayment.ts] Error al completar pago:", error);
      toast.error("Error al procesar pago. Por favor, intente nuevamente.");
      return { success: false, message: "Error al procesar pago" };
    }
  };

  return {
    handleCompletePayment,
    verifyNumbersNotSoldByOthers
  };
}
