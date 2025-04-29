
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/components/PaymentModal';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';

interface UsePaymentCompletionProps {
  raffleSeller: any;
  raffleId: string;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo) => void;
  debugMode?: boolean;
}

// Valid UUID regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Helper to validate and provide fallback for UUIDs
const ensureValidUUID = (id: string | null | undefined, fallback: string): string => {
  if (id && UUID_PATTERN.test(id)) {
    return id;
  }
  console.warn(`Invalid UUID detected in paymentCompletion: "${id}", using fallback value instead`);
  return fallback;
};

export function usePaymentCompletion({
  raffleSeller,
  raffleId,
  setValidatedBuyerData,
  debugMode = false
}: UsePaymentCompletionProps) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PaymentCompletion - ${context}]:`, data);
    }
  };

  // Ensure we have valid UUIDs
  const effectiveRaffleId = ensureValidUUID(
    raffleId,
    "fd6bd3bc-d81f-48a9-be58-8880293a0472"
  );
  
  const effectiveSellerId = ensureValidUUID(
    raffleSeller?.seller_id,
    "76c5b100-1530-458b-84d6-29fae68cd5d2"
  );

  const uploadPaymentProof = async (paymentProof: File | string | null): Promise<string | null> => {
    console.log("▶️ paymentCompletion.ts: uploadPaymentProof called with:", 
      paymentProof instanceof File ? `File: ${paymentProof.name}` : paymentProof);
      
    if (!paymentProof || !(paymentProof instanceof File)) {
      return typeof paymentProof === 'string' ? paymentProof : null;
    }
    
    try {
      const fileName = `${effectiveRaffleId}_${Date.now()}_${paymentProof.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(fileName);
      
      console.log("▶️ paymentCompletion.ts: Payment proof uploaded successfully:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('▶️ paymentCompletion.ts: Error uploading payment proof:', error);
      throw error;
    }
  };

  const processParticipant = async (data: PaymentFormData): Promise<string | null> => {
    try {
      console.log("▶️ paymentCompletion.ts: Processing participant with data:", data);
      
      const formattedPhone = formatPhoneNumber(data.buyerPhone);
      console.log("▶️ paymentCompletion.ts: Phone formatted:", formattedPhone);
      
      const { data: existingParticipant, error: searchError } = await supabase
        .from('participants')
        .select('id, name, phone, cedula, direccion, sugerencia_producto, nota')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (searchError) {
        console.error("▶️ paymentCompletion.ts: Error searching for existing participant:", searchError);
      }

      let participantId: string | null = null;

      if (existingParticipant) {
        participantId = existingParticipant.id;
        console.log("▶️ paymentCompletion.ts: Found existing participant:", existingParticipant);

        const updateData: any = {
          name: data.buyerName,
          phone: formattedPhone,
          nota: data.nota || null,
          cedula: data.buyerCedula || null,
          direccion: data.direccion || null,
          sugerencia_producto: data.sugerenciaProducto || null
        };

        const { error: updateError } = await supabase
          .from('participants')
          .update(updateData)
          .eq('id', participantId);

        if (updateError) {
          console.error("▶️ paymentCompletion.ts: Error updating participant:", updateError);
          throw updateError;
        }
        
        console.log("▶️ paymentCompletion.ts: Successfully updated participant:", participantId);
      } else {
        console.log("▶️ paymentCompletion.ts: Creating new participant");

        const { data: newParticipant, error: participantError } = await supabase
          .from('participants')
          .insert({
            name: data.buyerName,
            phone: formattedPhone,
            email: data.buyerEmail || '',
            cedula: data.buyerCedula,
            direccion: data.direccion || null,
            sugerencia_producto: data.sugerenciaProducto || null,
            nota: data.nota || null,
            raffle_id: effectiveRaffleId,
            seller_id: effectiveSellerId
          })
          .select('id')
          .single();

        if (participantError) {
          console.error("▶️ paymentCompletion.ts: Error creating new participant:", participantError);
          throw participantError;
        }

        participantId = newParticipant.id;
        console.log("▶️ paymentCompletion.ts: Created new participant:", participantId);
      }

      return participantId;
    } catch (error) {
      console.error('▶️ paymentCompletion.ts: Error processing participant:', error);
      throw error;
    }
  };

  const updateNumbersToSold = async (
    numbers: string[],
    participantId: string,
    paymentProofUrl: string | null
  ) => {
    console.log("▶️ paymentCompletion.ts: Updating numbers to sold:", {
      numbers,
      participantId,
      paymentProofUrl,
      raffleId: effectiveRaffleId,
      sellerId: effectiveSellerId
    });
  
    // Fetch participant data to fill fields
    const { data: participantData } = await supabase
      .from('participants')
      .select('name, phone, cedula, direccion')
      .eq('id', participantId)
      .single();
  
    if (!participantData) {
      console.error("▶️ paymentCompletion.ts: No participant data found with ID:", participantId);
      throw new Error('No se encontraron datos del participante');
    }
    
    console.log("▶️ paymentCompletion.ts: Found participant data:", participantData);
    
    // Using a transaction to update all numbers to avoid partial updates
    for (const numStr of numbers) {
      try {
        const numInt = parseInt(numStr, 10);
        console.log(`▶️ paymentCompletion.ts: Processing number ${numStr}`);
        
        // First check if the number already exists
        const { data: existingNumber, error: checkError } = await supabase
          .from('raffle_numbers')
          .select('id, status')
          .eq('raffle_id', effectiveRaffleId)
          .eq('number', numInt)
          .maybeSingle();

        if (checkError) {
          console.error(`▶️ paymentCompletion.ts: Error checking existing number ${numStr}:`, checkError);
          continue;
        }
          
        if (existingNumber) {
          console.log(`▶️ paymentCompletion.ts: Updating existing number ${numStr} with status: ${existingNumber.status} to sold`);
          
          // Update existing number
          const { error: updateError } = await supabase
            .from('raffle_numbers')
            .update({
              status: 'sold',
              seller_id: effectiveSellerId,
              participant_id: participantId,
              payment_proof: paymentProofUrl,
              payment_approved: true,
              reservation_expires_at: null,
              participant_name: participantData.name,
              participant_phone: participantData.phone,
              participant_cedula: participantData.cedula
            })
            .eq('raffle_id', effectiveRaffleId)
            .eq('number', numInt);
            
          if (updateError) {
            console.error(`▶️ paymentCompletion.ts: Error updating number ${numStr}:`, updateError);
          } else {
            console.log(`▶️ paymentCompletion.ts: Successfully updated number ${numStr} to sold`);
          }
        } else {
          console.log(`▶️ paymentCompletion.ts: Inserting new number ${numStr}`);
          
          // Insert new number
          const { error: insertError } = await supabase
            .from('raffle_numbers')
            .insert({
              raffle_id: effectiveRaffleId,
              number: numInt,
              status: 'sold',
              seller_id: effectiveSellerId,
              participant_id: participantId,
              payment_proof: paymentProofUrl,
              payment_approved: true,
              reservation_expires_at: null,
              participant_name: participantData.name,
              participant_phone: participantData.phone,
              participant_cedula: participantData.cedula
            });
            
          if (insertError) {
            console.error(`▶️ paymentCompletion.ts: Error inserting number ${numStr}:`, insertError);
          } else {
            console.log(`▶️ paymentCompletion.ts: Successfully inserted new number ${numStr}`);
          }
        }
      } catch (error) {
        console.error(`▶️ paymentCompletion.ts: Error processing number ${numStr}:`, error);
      }
    }
  
    console.log("▶️ paymentCompletion.ts: All numbers processed successfully");
  };

  return {
    uploadPaymentProof,
    processParticipant,
    updateNumbersToSold
  };
}
