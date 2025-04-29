
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

  const processParticipant = async (data: PaymentFormData): Promise<string | null> => {
    try {
      console.log("🔵 Processing participant with data:", data);
      
      const formattedPhone = formatPhoneNumber(data.buyerPhone);
      console.log("🔄 Phone formatted from processParticipant: ", formattedPhone);
      
      const { data: existingParticipant, error: searchError } = await supabase
        .from('participants')
        .select('id, name, phone, cedula, direccion, sugerencia_producto, nota')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (searchError) {
        console.error("Error searching for existing participant:", searchError);
      }

      let participantId: string | null = null;

      if (existingParticipant) {
        participantId = existingParticipant.id;
        console.log("✅ Found existing participant:", existingParticipant);

        const updateData: any = {
          name: data.buyerName,
          phone: formattedPhone,
          nota: data.nota,
          cedula: data.buyerCedula || null,
          direccion: data.direccion || null,
          sugerencia_producto: data.sugerenciaProducto || null
        };

        const { error: updateError } = await supabase
          .from('participants')
          .update(updateData)
          .eq('id', participantId);

        if (updateError) {
          console.error("Error updating participant:", updateError);
          throw updateError;
        }
      } else {
        console.log("🆕 Creating new participant");

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
            raffle_id: raffleId,
            seller_id: raffleSeller?.seller_id || "76c5b100-1530-458b-84d6-29fae68cd5d2"
          })
          .select('id')
          .single();

        if (participantError) {
          console.error("Error creating new participant:", participantError);
          throw participantError;
        }

        participantId = newParticipant.id;
      }

      return participantId;
    } catch (error) {
      console.error('Error processing participant:', error);
      throw error;
    }
  };

  const updateNumbersToSold = async (
    numbers: string[],
    participantId: string,
    paymentProofUrl: string | null
  ) => {
    console.log("🔵 hooks/usePaymentProcessor/paymentCompletion.ts: Actualización de números a vendidos:", {
      numbers,
      participantId,
      paymentProofUrl
    });
  
    // Trae los datos del participante para rellenar los campos
    const { data: participantData } = await supabase
      .from('participants')
      .select('name, phone, cedula, direccion')
      .eq('id', participantId)
      .single();
  
    if (!participantData) {
      throw new Error('No se encontraron datos del participante');
    }
  
    const updatePromises = numbers.map(async (numStr) => {
      try {
        const numInt = parseInt(numStr, 10);
        
        // Primero verificamos si ya existe un registro para este número en la rifa actual
        const { data: existingNumbers, error: checkError } = await supabase
          .from('raffle_numbers')
          .select('id, status')
          .eq('raffle_id', raffleId)
          .eq('number', numInt)
          .maybeSingle();
        
        if (checkError) {
          console.error(`Error verificando número ${numStr}:`, checkError);
          throw checkError;
        }
      
        const commonData = {
          status: 'sold' as const,
          seller_id: raffleSeller?.seller_id || "76c5b100-1530-458b-84d6-29fae68cd5d2",
          participant_id: participantId,
          payment_proof: paymentProofUrl,
          payment_approved: true,
          reservation_expires_at: null,
          participant_name: participantData.name,
          participant_phone: participantData.phone,
          participant_cedula: participantData.cedula
        };
      
        if (existingNumbers) {
          console.log(`🔄 Actualizando número existente ${numStr}:`, { id: existingNumbers.id, ...commonData });
          
          const { error } = await supabase
            .from('raffle_numbers')
            .update(commonData)
            .eq('id', existingNumbers.id);
            
          if (error) {
            console.error(`Error actualizando número ${numStr}:`, error);
            throw error;
          }
        } else {
          console.log(`🆕 Insertando nuevo número ${numStr}:`, { 
            raffle_id: raffleId,
            number: numInt,
            ...commonData 
          });
          
          // Using upsert to avoid duplicate key errors
          const { error } = await supabase
            .from('raffle_numbers')
            .upsert([{
              raffle_id: raffleId,
              number: numInt,
              ...commonData
            }], {
              onConflict: 'raffle_id,number'
            });
            
          if (error) {
            console.error(`Error insertando número ${numStr}:`, error);
            throw error;
          }
        }
      } catch (error) {
        console.error(`Error procesando número ${numStr}:`, error);
        throw error;
      }
    });
  
    try {
      await Promise.all(updatePromises);
      console.log("✅ Todos los números actualizados/insertados al estado vendido");
    } catch (error) {
      console.error("❌ Error actualizando números:", error);
      throw error;
    }
  };

  return {
    uploadPaymentProof,
    processParticipant,
    updateNumbersToSold
  };
}
