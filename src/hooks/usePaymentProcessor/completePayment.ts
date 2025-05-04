
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/types/payment';
import { updateNumbersToSold } from './numberStatusUpdates';

interface UseCompletePaymentProps {
  raffleSeller: any;
  raffleId: string;
  selectedNumbers: string[];
  refetchRaffleNumbers: () => Promise<any>;
  setPaymentData: (data: PaymentFormData | null) => void;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  setIsVoucherOpen: (isOpen: boolean) => void;
  allowVoucherPrint: boolean;
  uploadPaymentProof: (paymentProof: File | string | null) => Promise<string | null>;
  processParticipant: (data: PaymentFormData) => Promise<string | null>;
  supabase: any;
  debugMode?: boolean;
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
  debugMode = false
}: UseCompletePaymentProps) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - CompletePayment - ${context}]:`, data);
    }
  };

  const handleCompletePayment = async (data: PaymentFormData) => {
    console.log("🚀 completePayment.ts:41 - Iniciando proceso de completar pago");
    debugLog('handleCompletePayment called with data', data);
    
    try {
      // 1. Upload payment proof if it exists
      console.log("🧾 completePayment.ts:46 - Procesando comprobante de pago");
      const paymentProofUrl = await uploadPaymentProof(data.paymentProof);
      debugLog('Payment proof uploaded', paymentProofUrl);

      // 2. Process participant information
      console.log("👤 completePayment.ts:51 - Procesando información del participante");
      console.log("📧 completePayment.ts:52 - Email a guardar:", data.buyerEmail);
      
      const participantId = await processParticipant(data);
      
      if (!participantId) {
        throw new Error('Failed to process participant information');
      }
      debugLog('Participant processed', participantId);

      // 3. Get the latest raffle numbers (for checking status)
      console.log("🎟️ completePayment.ts:61 - Obteniendo números actualizados de la rifa");
      const { data: raffleNumbers } = await supabase
        .from('raffle_numbers')
        .select('*')
        .eq('raffle_id', raffleId);
      
      // 4. Update numbers to sold
      console.log("✅ completePayment.ts:67 - Actualizando números a vendidos");
      // Fix: Pass the required object with all parameters instead of separate arguments
      await updateNumbersToSold({
        numbers: selectedNumbers,
        participantId: participantId,
        paymentProofUrl: paymentProofUrl,
        raffleNumbers: raffleNumbers,
        raffleSeller: raffleSeller,
        raffleId: raffleId
      });
      debugLog('Numbers updated to sold', selectedNumbers);

      // 5. Refresh data
      await refetchRaffleNumbers();
      
      // 6. Show success message and prepare voucher data
      toast.success('¡Pago completado con éxito!');
      
      // Fix: Create a copy of data without adding unknown properties
      const paymentDataToSet = {
        ...data,
        // Do not add paymentProofUrl as it's not in the type
      };
      
      // Set the data in a type-safe way
      setPaymentData(paymentDataToSet);
      
      setIsPaymentModalOpen(false);
      
      if (allowVoucherPrint) {
        setIsVoucherOpen(true);
      }
      
      console.log("🎉 completePayment.ts:91 - Proceso de pago completado con éxito");
    } catch (error) {
      console.error('completePayment.ts:93 - ❌ Error al completar el pago:', error);
      toast.error(`Error al completar el pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return {
    handleCompletePayment
  };
}
