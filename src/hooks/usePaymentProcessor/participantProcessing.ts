
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
    console.log("🔵 participantProcessing.ts:15 - Procesando participante con datos:", data);
    debugLog('Processing participant', data);
    
    const formattedPhone = formatPhoneNumber(data.buyerPhone);
    
    const { data: existingParticipant, error: searchError } = await supabase
      .from('participants')
      .select('id, name, phone, cedula, direccion, sugerencia_producto, nota, email')
      .eq('phone', formattedPhone)
      .eq('raffle_id', raffleId)
      .maybeSingle();

    if (searchError) {
      console.error("participantProcessing.ts:27 - Error buscando participante existente:", searchError);
      debugLog('Search error', searchError);
    }

    let participantId: string | null = null;

    if (existingParticipant) {
      participantId = existingParticipant.id;
      console.log("✅ participantProcessing.ts:34 - Participante existente encontrado:", existingParticipant);
      debugLog('Using existing participant', existingParticipant);

      const updateData: any = {
        name: data.buyerName,
        phone: formattedPhone,
        nota: data.nota,
        cedula: data.buyerCedula || null,
        direccion: data.direccion || null,
        sugerencia_producto: data.sugerenciaProducto || null,
        email: data.buyerEmail || ''
      };

      console.log("🔄 participantProcessing.ts:47 - Actualizando participante con datos:", updateData);
      debugLog('Update data with email', updateData);

      const { error: updateError } = await supabase
        .from('participants')
        .update(updateData)
        .eq('id', participantId);

      if (updateError) {
        console.error("participantProcessing.ts:56 - Error actualizando participante:", updateError);
        debugLog('Update error', updateError);
        throw updateError;
      }
      
      console.log("✅ participantProcessing.ts:61 - Participante actualizado exitosamente con email:", data.buyerEmail);
    } else {
      console.log("🆕 participantProcessing.ts:64 - Creando nuevo participante");
      debugLog('Creating new participant', { 
        name: data.buyerName, 
        phone: formattedPhone,
        email: data.buyerEmail || '' 
      });

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
          raffle_id: raffleId
        })
        .select('id')
        .single();

      if (participantError) {
        console.error("participantProcessing.ts:85 - Error creando nuevo participante:", participantError);
        debugLog('Creation error', participantError);
        throw participantError;
      }

      participantId = newParticipant.id;
      console.log("✅ participantProcessing.ts:91 - Nuevo participante creado con ID:", participantId);
      debugLog('New participant created', { id: participantId });
    }

    return participantId;
  } catch (error) {
    console.error('participantProcessing.ts:97 - Error procesando participante:', error);
    debugLog('Process error', error);
    throw error;
  }
};
