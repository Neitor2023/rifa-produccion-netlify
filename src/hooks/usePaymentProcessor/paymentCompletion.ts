
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
      console.log("🔵 Processing participant with data:", data);
      
      // Check for existing participant
      const { data: existingParticipant, error: searchError } = await supabase
        .from('participants')
        .select('id, name, phone, cedula, direccion, sugerencia_producto')
        .eq('phone', data.buyerPhone)
        .eq('raffle_id', raffleId)
        .maybeSingle();
      
      if (searchError) {
        console.error("Error searching for existing participant:", searchError);
      }
      
      // Update existing participant
      if (existingParticipant) {
        const participantId = existingParticipant.id;
        console.log("✅ Found existing participant:", existingParticipant);
        
        const updateData: any = {
          name: data.buyerName
        };
        
        // Only update these if they have values
        if (data.buyerCedula) updateData.cedula = data.buyerCedula;
        if (data.direccion) updateData.direccion = data.direccion;
        if (data.sugerenciaProducto) updateData.sugerencia_producto = data.sugerenciaProducto;
        
        const { error: updateError } = await supabase
          .from('participants')
          .update(updateData)
          .eq('id', participantId);
          
        if (updateError) {
          console.error("Error updating participant:", updateError);
        } else {
          console.log("✅ Updated participant with new data:", updateData);
        }
        
        return participantId;
      } 
      
      console.log("🆕 Creating new participant");
      
      // Create new participant
      const { data: newParticipant, error: participantError } = await supabase
        .from('participants')
        .insert({
          name: data.buyerName,
          phone: data.buyerPhone,
          email: data.buyerEmail || '',
          cedula: data.buyerCedula,
          direccion: data.direccion || null,
          sugerencia_producto: data.sugerenciaProducto || null,
          raffle_id: raffleId,
          seller_id: raffleSeller.seller_id
        })
        .select('id')
        .single();
      
      if (participantError) {
        console.error("Error creating new participant:", participantError);
        throw participantError;
      }
      
      console.log("✅ Created new participant with ID:", newParticipant.id);
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
    console.log("🔵 Updating numbers to sold:", {
      numbers,
      participantId,
      paymentProofUrl
    });
    
    // Get participant data to store in raffle_numbers
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .select('name, phone, cedula')
      .eq('id', participantId)
      .single();
      
    if (participantError) {
      console.error("Error fetching participant data:", participantError);
    }
    
    const updatePromises = numbers.map(async (numStr) => {
      const num = parseInt(numStr);
      const existingNumber = raffleNumbers?.find(n => n.number === numStr);
      
      if (existingNumber) {
        // If there's already a payment proof, don't overwrite it
        const proofToUse = paymentProofUrl || existingNumber.payment_proof;
        
        const updateData: any = { 
          status: 'sold', 
          seller_id: raffleSeller.seller_id,
          participant_id: participantId,
          payment_proof: proofToUse,
          payment_approved: true,
          reservation_expires_at: null
        };
        
        // Add participant details if available
        if (participantData) {
          updateData.participant_name = participantData.name;
          updateData.participant_phone = participantData.phone;
          updateData.participant_cedula = participantData.cedula;
        }
        
        console.log(`🔄 Updating number ${numStr} with data:`, updateData);
        
        const { error } = await supabase
          .from('raffle_numbers')
          .update(updateData)
          .eq('id', existingNumber.id);
        
        if (error) {
          console.error(`Error updating number ${numStr}:`, error);
          throw error;
        }
      } else {
        const insertData: any = { 
          raffle_id: raffleId, 
          number: num, 
          status: 'sold', 
          seller_id: raffleSeller.seller_id,
          participant_id: participantId,
          payment_proof: paymentProofUrl,
          payment_approved: true
        };
        
        // Add participant details if available
        if (participantData) {
          insertData.participant_name = participantData.name;
          insertData.participant_phone = participantData.phone;
          insertData.participant_cedula = participantData.cedula;
        }
        
        console.log(`🆕 Inserting new number ${numStr} with data:`, insertData);
        
        const { error } = await supabase
          .from('raffle_numbers')
          .insert(insertData);
        
        if (error) {
          console.error(`Error inserting number ${numStr}:`, error);
          throw error;
        }
      }
    });
    
    await Promise.all(updatePromises);
    console.log("✅ All numbers updated to sold status");
  };

  return {
    uploadPaymentProof,
    processParticipant,
    updateNumbersToSold
  };
}
