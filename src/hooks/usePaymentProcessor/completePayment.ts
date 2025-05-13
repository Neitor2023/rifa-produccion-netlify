
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateNumbersToSold } from './numberStatusUpdates';

interface UseCompletePaymentProps {
  raffleSeller: any;
  raffleId: string;
  selectedNumbers: string[];
  refetchRaffleNumbers: () => Promise<any>;
  setPaymentData: (data: PaymentFormData | null) => void;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  setIsVoucherOpen: (isOpen: boolean) => void;
  allowVoucherPrint?: boolean;
  uploadPaymentProof: (file: File | string | null) => Promise<string | null>;
  processParticipant: (data: PaymentFormData) => Promise<string | null>;
  supabase: typeof supabase;
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
  allowVoucherPrint = true,
  uploadPaymentProof,
  processParticipant,
  supabase,
  debugMode = false
}: UseCompletePaymentProps) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - CompletePayment - ${context}]:`, data);
    }
  };

  const handleCompletePayment = async (paymentData: PaymentFormData, clickedButton?: string): Promise<void> => {
    debugLog('handleCompletePayment', { paymentData, clickedButton });
    
    try {
      // Get raffle numbers to check status
      const { data: raffleNumbers } = await supabase
        .from('raffle_numbers')
        .select('*')
        .eq('raffle_id', raffleId);
        
      if (!raffleNumbers) {
        throw new Error('Failed to fetch raffle numbers');
      }
      
      // Step 1: Upload payment proof if exists
      const fileToUpload = paymentData.paymentProof || null;
      const paymentProofUrl = await uploadPaymentProof(fileToUpload);
      
      // Step 2: Create or find participant
      const participantId = await processParticipant(paymentData);
      if (!participantId) {
        throw new Error('Failed to process participant');
      }
      
      // Step 3: Update numbers to sold status
      await updateNumbersToSold({
        numbers: selectedNumbers,
        participantId,
        paymentProofUrl,
        raffleNumbers,
        raffleSeller,
        raffleId
      });
      
      // Step 4: Update payment receipt URL if available
      if (paymentData.paymentReceiptUrl) {
        debugLog('Payment receipt URL available', { paymentReceiptUrl: paymentData.paymentReceiptUrl });
        // This was handled earlier in the process now, but we'll leave it here for backup
      }
      
      // Step 5: Refetch raffle numbers to get latest state
      await refetchRaffleNumbers();
      
      // Step 6: Close payment modal and open voucher if allowed
      setPaymentData(paymentData);
      setIsPaymentModalOpen(false);
      
      // Only show voucher if allowed (may be disabled for some sellers)
      if (allowVoucherPrint) {
        setIsVoucherOpen(true);
      } else {
        toast.success('¡Compra completada exitosamente!');
      }
      
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.error('Error procesando pago');
    }
  };

  return { handleCompletePayment };
}
