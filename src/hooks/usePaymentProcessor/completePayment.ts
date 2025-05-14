
import { PaymentFormData } from '@/types/payment';
import { supabase } from '@/integrations/supabase/client';

interface UseCompletePaymentProps {
  raffleSeller: { seller_id: string };
  raffleId: string;
  selectedNumbers: string[];
  refetchRaffleNumbers: () => Promise<any>;
  setPaymentData: (data: PaymentFormData | null) => void;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  setIsVoucherOpen: (isOpen: boolean) => void;
  allowVoucherPrint?: boolean;
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
  allowVoucherPrint = true,
  uploadPaymentProof,
  processParticipant,
  supabase,
  debugMode = false
}: UseCompletePaymentProps) {

  const handleCompletePayment = async (formData: PaymentFormData) => {
    if (debugMode) {
      console.log("💲 completePayment.ts: Completing payment with data:", formData);
    }

    try {
      // 1. Upload payment proof if provided (for transfer)
      let paymentProofUrl = null;
      if (formData.paymentMethod === 'transfer' && formData.paymentProof) {
        paymentProofUrl = await uploadPaymentProof(formData.paymentProof);
        
        if (debugMode) {
          console.log("📄 completePayment.ts: Payment proof URL:", paymentProofUrl);
        }
      }
      
      // 2. Verify numbers are not sold by other sellers (should already be done prior, but double-check)
      const canProceed = await verifyNumbersAvailability(selectedNumbers);
      if (!canProceed) {
        console.error("❌ completePayment.ts: Numbers are not available, aborting payment");
        return;
      }

      // 3. Create or update participant
      const participantId = await processParticipant(formData);
      
      if (!participantId) {
        console.error("❌ completePayment.ts: Failed to process participant");
        return;
      }

      if (debugMode) {
        console.log("👤 completePayment.ts: Participant ID:", participantId);
      }

      // 4. Update numbers to sold status
      await updateNumbersToSold(selectedNumbers, participantId, paymentProofUrl || formData.paymentReceiptUrl);

      // 5. Set payment data for voucher/receipt
      setPaymentData(formData);

      // 6. Close payment modal
      setIsPaymentModalOpen(false);

      // 7. Refresh numbers
      await refetchRaffleNumbers();

      // 8. Show voucher if allowed
      if (allowVoucherPrint) {
        setIsVoucherOpen(true);
      }

      if (debugMode) {
        console.log("✅ completePayment.ts: Payment completed successfully");
      }
    } catch (error) {
      console.error("❌ completePayment.ts: Error completing payment:", error);
      throw error;
    }
  };

  /**
   * Verify that the numbers are still available before completing the payment
   */
  const verifyNumbersAvailability = async (numbers: string[]): Promise<boolean> => {
    if (debugMode) {
      console.log("🔍 completePayment.ts: Verifying numbers availability:", numbers);
    }

    try {
      // Convert strings to integers for database query
      const numberInts = numbers.map(num => parseInt(num, 10));
      
      // Check for numbers that are already sold
      const { data: soldNumbers, error } = await supabase
        .from('raffle_numbers')
        .select('number, status, seller_id')
        .eq('raffle_id', raffleId)
        .in('number', numberInts)
        .eq('status', 'sold');
      
      if (error) {
        console.error("❌ completePayment.ts: Error checking sold numbers:", error);
        throw error;
      }
      
      if (debugMode) {
        console.log("🔢 completePayment.ts: Sold numbers check:", soldNumbers);
      }
      
      if (soldNumbers && soldNumbers.length > 0) {
        // Filter to only include numbers sold by other sellers
        const soldByOtherSellers = soldNumbers.filter(
          item => item.seller_id !== raffleSeller.seller_id
        );
        
        if (soldByOtherSellers.length > 0) {
          const unavailableNumbers = soldByOtherSellers.map(n => n.number).join(', ');
          console.error(`❌ completePayment.ts: Numbers ${unavailableNumbers} are sold by other sellers`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("❌ completePayment.ts: Error verifying numbers availability:", error);
      return false;
    }
  };

  /**
   * Update the numbers' status to sold
   */
  const updateNumbersToSold = async (
    numbers: string[], 
    participantId: string, 
    paymentProofUrl: string | null
  ) => {
    if (debugMode) {
      console.log("📝 completePayment.ts: Updating numbers to sold:", {
        numbers,
        participantId,
        paymentProofUrl
      });
    }
    
    try {
      // Get participant data for filling fields
      const { data: participantData } = await supabase
        .from('participants')
        .select('name, phone, email, cedula, direccion')
        .eq('id', participantId)
        .single();
        
      if (!participantData) {
        throw new Error('No participant data found');
      }
      
      // Process each number individually
      for (const numStr of numbers) {
        const numInt = parseInt(numStr, 10);
        
        // Check if this number already exists
        const { data: existingNumber, error: checkError } = await supabase
          .from('raffle_numbers')
          .select('id, status, participant_id')
          .eq('raffle_id', raffleId)
          .eq('number', numInt)
          .maybeSingle();
          
        if (checkError) {
          console.error(`❌ completePayment.ts: Error checking number ${numStr}:`, checkError);
          continue;
        }
        
        const commonData = {
          status: 'sold' as const,
          seller_id: raffleSeller.seller_id,
          participant_id: participantId,
          payment_proof: paymentProofUrl,
          payment_approved: true,
          reservation_expires_at: null,
          participant_name: participantData.name,
          participant_phone: participantData.phone,
          participant_cedula: participantData.cedula
        };
        
        if (existingNumber) {
          // Update existing number
          if (debugMode) {
            console.log(`🔄 completePayment.ts: Updating number ${numStr}:`, commonData);
          }
          
          const { error: updateError } = await supabase
            .from('raffle_numbers')
            .update(commonData)
            .eq('id', existingNumber.id);
            
          if (updateError) {
            console.error(`❌ completePayment.ts: Error updating number ${numStr}:`, updateError);
          }
        } else {
          // Insert new number
          const insertData = {
            ...commonData,
            raffle_id: raffleId,
            number: numInt
          };
          
          if (debugMode) {
            console.log(`➕ completePayment.ts: Inserting number ${numStr}:`, insertData);
          }
          
          const { error: insertError } = await supabase
            .from('raffle_numbers')
            .insert(insertData);
            
          if (insertError) {
            console.error(`❌ completePayment.ts: Error inserting number ${numStr}:`, insertError);
          }
        }
      }
      
      if (debugMode) {
        console.log("✅ completePayment.ts: All numbers updated to sold");
      }
      
    } catch (error) {
      console.error("❌ completePayment.ts: Error updating numbers to sold:", error);
      throw error;
    }
  };

  return {
    handleCompletePayment
  };
}
