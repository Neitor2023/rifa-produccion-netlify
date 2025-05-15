
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { toast } from 'sonner';
import { SupabaseClient } from '@supabase/supabase-js';

interface UseCompletePaymentProps {
  raffleSeller: {
    seller_id: string;
  };
  raffleId: string;
  selectedNumbers: string[];
  refetchRaffleNumbers: () => Promise<any>;
  setPaymentData: (data: PaymentFormData | null) => void;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  setIsVoucherOpen: (isOpen: boolean) => void;
  allowVoucherPrint: boolean;
  uploadPaymentProof: (paymentProof: File | string | null) => Promise<string | null>;
  processParticipant: (data: PaymentFormData) => Promise<string | null>;
  supabase: SupabaseClient;
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
  supabase,
  debugMode = false,
}: UseCompletePaymentProps) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - CompletePayment - ${context}]:`, data);
    }
  };

  const handleCompletePayment = async (data: PaymentFormData) => {
    try {
      // Validar que raffleId esté definido
      if (!raffleId) {
        console.error("❌ Error: raffleId está undefined en handleCompletePayment. Abortando ejecución.");
        toast.error("Error de validación: ID de rifa no disponible.");
        return;
      }
      
      // Validar que los números estén definidos y no estén vacíos
      if (!selectedNumbers || selectedNumbers.length === 0) {
        console.error("❌ Error: selectedNumbers está vacío en handleCompletePayment. Abortando ejecución.");
        toast.error("Error de validación: No hay números seleccionados.");
        return;
      }

      debugLog('handleCompletePayment', { data, selectedNumbers });

      // 1. Verify numbers are still available
      const unavailableNumbers = await verifyNumbersAvailability(selectedNumbers);
      if (unavailableNumbers.length > 0) {
        toast.error(`Algunos números ya no están disponibles: ${unavailableNumbers.join(', ')}`);
        await refetchRaffleNumbers();
        setIsPaymentModalOpen(false);
        return;
      }

      // 2. Upload payment proof if provided
      let paymentProofUrl: string | null = null;
      if (data.paymentMethod === 'transfer' && data.paymentProof) {
        paymentProofUrl = await uploadPaymentProof(data.paymentProof);
        debugLog('paymentProofUrl', paymentProofUrl);
      }

      // 3. Process participant and get participant_id
      const participantId = await processParticipant(data);
      if (!participantId) {
        toast.error('Error al procesar datos del participante');
        setIsPaymentModalOpen(false);
        return;
      }

      debugLog('participantId', participantId);

      // 4. Update numbers to sold status
      const updateSuccess = await updateNumbersToSold(
        selectedNumbers,
        participantId,
        paymentProofUrl,
        raffleId,
        raffleSeller.seller_id
      );

      if (!updateSuccess) {
        toast.error('Error al actualizar el estado de los números');
        setIsPaymentModalOpen(false);
        return;
      }

      // 5. Set payment data for voucher
      setPaymentData(data);

      // Close payment modal
      setIsPaymentModalOpen(false);

      // 6. Show voucher if allowed
      if (allowVoucherPrint) {
        setIsVoucherOpen(true);
      }

      // 7. Refresh raffle numbers
      await refetchRaffleNumbers();

      toast.success('¡Pago completado con éxito!');
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.error('Error al procesar el pago. Por favor intente de nuevo.');
      setIsPaymentModalOpen(false);
    }
  };

  const verifyNumbersAvailability = async (numbers: string[]): Promise<string[]> => {
    try {
      // Validar que raffleId esté definido
      if (!raffleId) {
        console.error("❌ Error: raffleId está undefined en verifyNumbersAvailability. Abortando ejecución.");
        throw new Error("ID de rifa no disponible");
      }
      
      debugLog('verifyNumbersAvailability', { numbers, raffleId });
      
      // Convert strings to integers for database query
      const numberInts = numbers.map(num => parseInt(num, 10));
      
      // Check if any of these numbers are already sold or reserved
      const { data: unavailableData, error } = await supabase
        .from('raffle_numbers')
        .select('number, status')
        .eq('raffle_id', raffleId)
        .in('number', numberInts)
        .in('status', ['sold']);
      
      if (error) {
        console.error('Error checking number availability:', error);
        throw error;
      }
      
      // Map unavailable numbers back to string format
      const unavailableNumbers = unavailableData?.map(item => 
        String(item.number).padStart(2, '0')
      ) || [];
      
      debugLog('unavailableNumbers', unavailableNumbers);
      
      return unavailableNumbers;
    } catch (error) {
      console.error('Error in verifyNumbersAvailability:', error);
      toast.error('Error al verificar disponibilidad de números');
      return [];
    }
  };

  const updateNumbersToSold = async (
    numbers: string[],
    participantId: string, 
    paymentProofUrl: string | null,
    raffleId: string,
    sellerId: string
  ): Promise<boolean> => {
    try {
      // Validar que todos los parámetros estén definidos
      if (!raffleId) {
        console.error("❌ Error: raffleId está undefined en updateNumbersToSold");
        throw new Error("ID de rifa no disponible");
      }
      
      if (!sellerId) {
        console.error("❌ Error: sellerId está undefined en updateNumbersToSold");
        throw new Error("ID de vendedor no disponible");
      }
      
      if (!participantId) {
        console.error("❌ Error: participantId está undefined en updateNumbersToSold");
        throw new Error("ID de participante no disponible");
      }
      
      debugLog('updateNumbersToSold', { 
        numbers, 
        participantId, 
        paymentProofUrl,
        raffleId,
        sellerId
      });
      
      // Process each number separately to handle both updates and inserts
      const updatePromises = numbers.map(async (numStr) => {
        const numInt = parseInt(numStr, 10);
        
        // Check if this number already exists for this raffle
        const { data: existingNumber, error: checkError } = await supabase
          .from('raffle_numbers')
          .select('id, status, seller_id')
          .eq('raffle_id', raffleId)
          .eq('number', numInt)
          .maybeSingle();
          
        if (checkError) {
          console.error(`Error checking if number ${numStr} exists:`, checkError);
          return false;
        }
        
        const updateData = {
          status: 'sold',
          seller_id: sellerId,
          participant_id: participantId,
          updated_at: new Date().toISOString(),
          reservation_expires_at: null
        };
        
        // Add payment proof if provided
        if (paymentProofUrl) {
          updateData['payment_proof'] = paymentProofUrl;
        }
        
        // If number exists, update it
        if (existingNumber) {
          debugLog(`Number ${numStr} exists, updating`, existingNumber);
          
          // Check if number is already sold
          if (existingNumber.status === 'sold') {
            console.error(`Number ${numStr} is already sold`);
            return false;
          }
          
          const { error: updateError } = await supabase
            .from('raffle_numbers')
            .update(updateData)
            .eq('id', existingNumber.id);
            
          if (updateError) {
            console.error(`Error updating number ${numStr}:`, updateError);
            return false;
          }
        } else {
          // If number doesn't exist, insert it
          debugLog(`Number ${numStr} doesn't exist, inserting new record`);
          
          const { error: insertError } = await supabase
            .from('raffle_numbers')
            .insert({
              ...updateData,
              raffle_id: raffleId,
              number: numInt,
              created_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error(`Error inserting number ${numStr}:`, insertError);
            return false;
          }
        }
        
        return true;
      });
      
      // Wait for all updates to complete
      const results = await Promise.all(updatePromises);
      
      // Check if all updates were successful
      const allSuccessful = results.every(result => result === true);
      
      if (!allSuccessful) {
        console.error('Some numbers could not be updated or inserted');
      }
      
      return allSuccessful;
    } catch (error) {
      console.error('Error in updateNumbersToSold:', error);
      return false;
    }
  };

  return { handleCompletePayment };
}
