
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
  console.warn(`▶️ paymentCompletion.ts: UUID inválido detectado: "${id}", usando valor predeterminado`);
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
    console.log("▶️ paymentCompletion.ts: uploadPaymentProof llamado con:", 
      paymentProof instanceof File ? `Archivo: ${paymentProof.name}` : paymentProof);
      
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
      
      console.log("▶️ paymentCompletion.ts: Comprobante de pago subido exitosamente:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('▶️ paymentCompletion.ts: Error subiendo comprobante de pago:', error);
      throw error;
    }
  };

  const processParticipant = async ({ 
    validatedBuyerData,
    formData,
    raffleId,
    sellerId 
  }): Promise<string | null> => {
    try {
      console.log("▶️ paymentCompletion.ts: Procesando participante con datos:", {
        validatedBuyerData,
        formData
      });
      
      const formattedPhone = formatPhoneNumber(
        validatedBuyerData?.phone || formData.buyerPhone
      );
      console.log("▶️ paymentCompletion.ts: Teléfono formateado:", formattedPhone);
      
      let participantId = null;
      
      if (validatedBuyerData && validatedBuyerData.id) {
        // Use existing participant ID
        participantId = validatedBuyerData.id;
        console.log("▶️ paymentCompletion.ts: Usando ID de participante existente:", participantId);
        
        // Update participant information with form data
        const updateData = {
          email: formData.buyerEmail || '',
          direccion: formData.direccion || null,
          sugerencia_producto: formData.sugerenciaProducto || null,
          nota: formData.nota || null,
          raffle_id: raffleId,
          seller_id: sellerId
        };
        
        console.log("▶️ paymentCompletion.ts: Actualizando participante con datos:", updateData);
        
        const { error: updateError } = await supabase
          .from('participants')
          .update(updateData)
          .eq('id', participantId);
          
        if (updateError) {
          console.error("▶️ paymentCompletion.ts: Error actualizando participante:", updateError);
          throw updateError;
        }
      } else {
        // Search for existing participant by phone number
        const { data: existingParticipant, error: searchError } = await supabase
          .from('participants')
          .select('id, name, phone, cedula, direccion, sugerencia_producto, nota')
          .eq('phone', formattedPhone)
          .maybeSingle();
  
        if (searchError) {
          console.error("▶️ paymentCompletion.ts: Error buscando participante existente:", searchError);
        }
  
        if (existingParticipant) {
          participantId = existingParticipant.id;
          console.log("▶️ paymentCompletion.ts: Se encontró participante existente:", existingParticipant);
  
          const updateData: any = {
            name: formData.buyerName,
            phone: formattedPhone,
            nota: formData.nota || null,
            cedula: formData.buyerCedula || null,
            direccion: formData.direccion || null,
            sugerencia_producto: formData.sugerenciaProducto || null
          };
  
          const { error: updateError } = await supabase
            .from('participants')
            .update(updateData)
            .eq('id', participantId);
  
          if (updateError) {
            console.error("▶️ paymentCompletion.ts: Error actualizando participante:", updateError);
            throw updateError;
          }
          
          console.log("▶️ paymentCompletion.ts: Participante actualizado exitosamente:", participantId);
        } else {
          console.log("▶️ paymentCompletion.ts: Creando nuevo participante");
  
          const { data: newParticipant, error: participantError } = await supabase
            .from('participants')
            .insert({
              name: formData.buyerName,
              phone: formattedPhone,
              email: formData.buyerEmail || '',
              cedula: formData.buyerCedula,
              direccion: formData.direccion || null,
              sugerencia_producto: formData.sugerenciaProducto || null,
              nota: formData.nota || null,
              raffle_id: effectiveRaffleId,
              seller_id: effectiveSellerId
            })
            .select('id')
            .single();
  
          if (participantError) {
            console.error("▶️ paymentCompletion.ts: Error creando nuevo participante:", participantError);
            throw participantError;
          }
  
          participantId = newParticipant.id;
          console.log("▶️ paymentCompletion.ts: Participante nuevo creado:", participantId);
        }
      }

      return participantId;
    } catch (error) {
      console.error('▶️ paymentCompletion.ts: Error procesando participante:', error);
      throw error;
    }
  };

  const updateNumbersToSold = async ({
    numbers,
    raffleId,
    sellerId,
    participantId,
    formData,
    buyerData,
    paymentProofUrl
  }) => {
    console.log("▶️ paymentCompletion.ts: Actualizando números a vendidos:", {
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
      console.error("▶️ paymentCompletion.ts: No se encontraron datos del participante con ID:", participantId);
      throw new Error('No se encontraron datos del participante');
    }
    
    console.log("▶️ paymentCompletion.ts: Datos del participante encontrados:", participantData);
    
    // Using an upsert approach for all numbers to handle both new entries and updates
    for (const numStr of numbers) {
      try {
        const numInt = parseInt(numStr, 10);
        console.log(`▶️ paymentCompletion.ts: Procesando número ${numStr}`);
        
        // First check if the number already exists
        const { data: existingNumber, error: checkError } = await supabase
          .from('raffle_numbers')
          .select('id, status')
          .eq('raffle_id', effectiveRaffleId)
          .eq('number', numInt)
          .maybeSingle();

        if (checkError) {
          console.error(`▶️ paymentCompletion.ts: Error verificando número ${numStr}:`, checkError);
          continue;
        }
        
        const recordData = {
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
        };
        
        if (existingNumber) {
          console.log(`▶️ paymentCompletion.ts: Actualizando número existente ${numStr} con estado: ${existingNumber.status} a vendido`);
          
          // Update existing number
          const { error: updateError } = await supabase
            .from('raffle_numbers')
            .update(recordData)
            .eq('id', existingNumber.id);
            
          if (updateError) {
            console.error(`▶️ paymentCompletion.ts: Error actualizando número ${numStr}:`, updateError);
          } else {
            console.log(`▶️ paymentCompletion.ts: Número ${numStr} actualizado exitosamente como vendido`);
          }
        } else {
          console.log(`▶️ paymentCompletion.ts: Insertando nuevo número ${numStr}`);
          
          // Use upsert to avoid duplicate key errors
          const { error: upsertError } = await supabase
            .from('raffle_numbers')
            .upsert([recordData], {
              onConflict: 'raffle_id,number',
              ignoreDuplicates: false
            });
            
          if (upsertError) {
            console.error(`▶️ paymentCompletion.ts: Error al insertar/actualizar número ${numStr}:`, upsertError);
          } else {
            console.log(`▶️ paymentCompletion.ts: Número ${numStr} insertado exitosamente`);
          }
        }
      } catch (error) {
        console.error(`▶️ paymentCompletion.ts: Error procesando número ${numStr}:`, error);
      }
    }
  
    console.log("▶️ paymentCompletion.ts: Todos los números procesados exitosamente");
  };

  return {
    uploadPaymentProof,
    processParticipant,
    updateNumbersToSold
  };
}
