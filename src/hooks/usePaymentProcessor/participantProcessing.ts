
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/types/payment';
import { formatPhoneNumber } from '@/utils/phoneUtils';

interface ProcessParticipantProps {
  data: PaymentFormData;
  raffleId: string;
  debugLog: (context: string, data: any) => void;
}

export const processParticipant = async ({
  data,
  raffleId,
  debugLog
}: ProcessParticipantProps): Promise<string | null> => {
  try {
    console.log("🔵 Processing participant with data:", data);
    debugLog('Processing participant', data);
    
    const formattedPhone = formatPhoneNumber(data.buyerPhone);
    
    const { data: existingParticipant, error: searchError } = await supabase
      .from('participants')
      .select('id, name, phone, email, cedula, direccion, sugerencia_producto, nota')
      .eq('phone', formattedPhone)
      .eq('raffle_id', raffleId)
      .maybeSingle();

    if (searchError) {
      console.error("Error searching for existing participant:", searchError);
      debugLog('Search error', searchError);
    }

    let participantId: string | null = null;

    if (existingParticipant) {
      participantId = existingParticipant.id;
      console.log("✅ Found existing participant:", existingParticipant);
      debugLog('Using existing participant', existingParticipant);

      const updateData: any = {
        name: data.buyerName,
        phone: formattedPhone, // Ensuring phone is in international format
        nota: data.nota,
        email: data.buyerEmail || null,
        cedula: data.buyerCedula || null,
        direccion: data.direccion || null,
        sugerencia_producto: data.sugerenciaProducto || null
      };

      // Save seller_id on the participant record if applicable
      // Either use the sellerId from data if available, or use the SELLER_ID constant
      if (data.sellerId) {
        updateData.seller_id = data.sellerId;
      }

      const { error: updateError } = await supabase
        .from('participants')
        .update(updateData)
        .eq('id', participantId);

      if (updateError) {
        console.error("Error updating participant:", updateError);
        debugLog('Update error', updateError);
        throw updateError;
      }
    } else {
      console.log("🆕 Creating new participant");
      debugLog('Creating new participant', { 
        name: data.buyerName, 
        phone: formattedPhone 
      });

      const insertData = {
        name: data.buyerName,
        phone: formattedPhone, // Ensuring phone is in international format
        email: data.buyerEmail || '',
        cedula: data.buyerCedula,
        direccion: data.direccion || null,
        sugerencia_producto: data.sugerenciaProducto || null,
        nota: data.nota || null,
        raffle_id: raffleId,
        seller_id: data.sellerId || null // Add seller_id when creating participant
      };
      
      debugLog('Inserting participant data', insertData);

      const { data: newParticipant, error: participantError } = await supabase
        .from('participants')
        .insert(insertData)
        .select('id')
        .single();

      if (participantError) {
        console.error("Error creating new participant:", participantError);
        debugLog('Creation error', participantError);
        throw participantError;
      }

      participantId = newParticipant.id;
      debugLog('New participant created', { id: participantId });
    }

    return participantId;
  } catch (error) {
    console.error('Error processing participant:', error);
    debugLog('Process error', error);
    throw error;
  }
};
