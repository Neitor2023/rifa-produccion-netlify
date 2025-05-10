
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { uploadPaymentProof } from './fileUpload';
import { processParticipant } from './participantProcessing';
import { updateNumbersToSold } from './numberStatusUpdates';

interface UsePaymentCompletionProps {
  raffleSeller: any;
  raffleId: string;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo) => void;
  debugMode?: boolean;
}

export function usePaymentCompletion({
  raffleSeller,
  raffleId,
  setValidatedBuyerData,
  debugMode = false
}: UsePaymentCompletionProps) {
  console.log("🔄 usePaymentCompletion: Entry point");
  
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PaymentCompletion - ${context}]:`, data);
    }
  };

  // Function to update raffle numbers to sold status
  const updateToSold = async (
    numbers: string[],
    participantId: string,
    paymentProofUrl: string | null,
    participantData: {
      name: string;
      phone: string;
      cedula?: string;
    }
  ) => {
    console.log("🔄 updateToSold: Starting update for numbers:", numbers);
    
    for (const number of numbers) {
      // Check if the number already exists in the raffle_numbers table
      const { data: existingNumber, error: queryError } = await supabase
        .from('raffle_numbers')
        .select('id, status')
        .eq('raffle_id', raffleId)
        .eq('number', parseInt(number))
        .eq('seller_id', raffleSeller.seller_id)
        .maybeSingle();
      
      if (queryError) {
        console.error('Error checking if number exists:', queryError);
        continue;
      }
      
      // Solo actualizar si el número no está vendido
      if (existingNumber && existingNumber.status === 'sold') {
        console.log(`Número ${number} ya está vendido, omitiendo actualización.`);
        continue;
      }
      
      const updateData = {
        status: 'sold',
        participant_id: participantId,
        payment_proof: paymentProofUrl,
        participant_name: participantData.name,
        participant_phone: participantData.phone,
        participant_cedula: participantData.cedula || null,
        payment_approved: true
      };
      
      if (existingNumber) {
        // Number exists and is not sold, update it
        console.log(`Number ${number} exists but not sold, updating record with ID: ${existingNumber.id}`);
        const { error: updateError } = await supabase
          .from('raffle_numbers')
          .update(updateData)
          .eq('id', existingNumber.id)
          .neq('status', 'sold'); // Condición adicional para evitar actualizar números vendidos
        
        if (updateError) {
          console.error(`Error updating number ${number}:`, updateError);
        }
      } else {
        // Number doesn't exist, insert it
        console.log(`Number ${number} doesn't exist, creating new record`);
        const { error: insertError } = await supabase
          .from('raffle_numbers')
          .insert({
            raffle_id: raffleId,
            number: parseInt(number),
            seller_id: raffleSeller.seller_id,
            ...updateData
          });
        
        if (insertError) {
          console.error(`Error inserting number ${number}:`, insertError);
        }
      }
    }
    
    console.log("✅ updateToSold: Update completed");
  };

  console.log("✅ usePaymentCompletion: Exit");

  return {
    uploadPaymentProof: (paymentProof: File | string | null): Promise<string | null> => 
      uploadPaymentProof({ paymentProof, raffleId, debugLog }),
    processParticipant: (data: PaymentFormData): Promise<string | null> => 
      processParticipant({ data, raffleId, debugLog }),
    updateNumbersToSold: updateToSold
  };
}
