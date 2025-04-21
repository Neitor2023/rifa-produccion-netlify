
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/components/PaymentModal';

interface UsePaymentCompletionProps {
  raffleSeller: any;
  raffleId: string;
  debugMode?: boolean;
}

export function usePaymentCompletion({
  raffleSeller,
  raffleId,
  debugMode = false
}: UsePaymentCompletionProps) {
  
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PaymentCompletion - ${context}]:`, data);
    }
  };

  /**
   * Uploads payment proof to Supabase storage
   * @param paymentProof File object or URL string
   * @returns Public URL of the uploaded file or null
   */
  const uploadPaymentProof = async (paymentProof: File | string | null): Promise<string | null> => {
    if (!paymentProof || !(paymentProof instanceof File)) {
      return typeof paymentProof === 'string' ? paymentProof : null;
    }
    
    try {
      const fileName = `${raffleId}_${Date.now()}_${paymentProof.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(fileName);
        
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      throw error;
    }
  };
  
  /**
   * Processes participant data during payment completion
   * @param data Payment form data
   * @returns Participant ID or null if operation failed
   */
  const processParticipant = async (data: PaymentFormData): Promise<string | null> => {
    try {
      // Check for existing participant
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id')
        .eq('phone', data.buyerPhone)
        .eq('raffle_id', raffleId)
        .maybeSingle();
      
      // Update existing participant
      if (existingParticipant) {
        const participantId = existingParticipant.id;
        
        await supabase
          .from('participants')
          .update({ name: data.buyerName })
          .eq('id', participantId);
          
        return participantId;
      } 
      
      // Create new participant
      const { data: newParticipant, error: participantError } = await supabase
        .from('participants')
        .insert({
          name: data.buyerName,
          phone: data.buyerPhone,
          email: '',
          raffle_id: raffleId,
          seller_id: raffleSeller.seller_id
        })
        .select('id')
        .single();
      
      if (participantError) throw participantError;
      
      return newParticipant.id;
    } catch (error) {
      console.error('Error processing participant:', error);
      throw error;
    }
  };
  
  /**
   * Updates raffle numbers to sold status
   * @param numbers Array of number strings to mark as sold
   * @param participantId Participant ID to associate with numbers
   * @param paymentProofUrl Optional URL to payment proof
   */
  const updateNumbersToSold = async (
    numbers: string[], 
    participantId: string, 
    paymentProofUrl: string | null,
    raffleNumbers: any[]
  ) => {
    const updatePromises = numbers.map(async (numStr) => {
      const num = parseInt(numStr);
      const existingNumber = raffleNumbers?.find(n => n.number === numStr);
      
      if (existingNumber) {
        // If there's already a payment proof, don't overwrite it
        const proofToUse = paymentProofUrl || existingNumber.payment_proof;
        
        const { error } = await supabase
          .from('raffle_numbers')
          .update({ 
            status: 'sold', 
            seller_id: raffleSeller.seller_id,
            participant_id: participantId,
            payment_proof: proofToUse,
            payment_approved: true,
            reservation_expires_at: null
          })
          .eq('id', existingNumber.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('raffle_numbers')
          .insert({ 
            raffle_id: raffleId, 
            number: num, 
            status: 'sold', 
            seller_id: raffleSeller.seller_id,
            participant_id: participantId,
            payment_proof: paymentProofUrl,
            payment_approved: true
          });
        
        if (error) throw error;
      }
    });
    
    await Promise.all(updatePromises);
  };

  return {
    uploadPaymentProof,
    processParticipant,
    updateNumbersToSold
  };
}
