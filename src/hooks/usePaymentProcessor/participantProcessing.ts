
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/types/payment';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { SELLER_ID } from '@/lib/constants'; // Import the constant SELLER_ID

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
    console.log("🔵 participantProcessing.ts:17 - Procesando participante con datos:", data);
    debugLog('Processing participant', data);
    
    const formattedPhone = formatPhoneNumber(data.buyerPhone);
    console.log("🔵 participantProcessing.ts:21 - Teléfono formateado para almacenamiento:", formattedPhone);
    
    const { data: existingParticipant, error: searchError } = await supabase
      .from('participants')
      .select('id, name, phone, cedula, direccion, sugerencia_producto, nota, email')
      .eq('phone', formattedPhone)
      .eq('raffle_id', raffleId)
      .maybeSingle();

    if (searchError) {
      console.error("participantProcessing.ts:31 - Error buscando participante existente:", searchError);
      debugLog('Search error', searchError);
    }

    let participantId: string | null = null;

    if (existingParticipant) {
      participantId = existingParticipant.id;
      console.log("✅ participantProcessing.ts:38 - Participante existente encontrado:", existingParticipant);
      debugLog('Using existing participant', existingParticipant);

      // No incluir seller_id en la actualización
      console.log("🔄 participantProcessing.ts:42 - Actualizando participante sin seller_id");

      const updateData: any = {
        name: data.buyerName,
        phone: formattedPhone,
        nota: data.nota,
        cedula: data.buyerCedula || null,
        direccion: data.direccion || null,
        sugerencia_producto: data.sugerenciaProducto || null,
        email: data.buyerEmail || ''
      };

      console.log("🔄 participantProcessing.ts:54 - Actualizando participante con datos:", updateData);
      debugLog('Update data with email', updateData);

      const { error: updateError } = await supabase
        .from('participants')
        .update(updateData)
        .eq('id', participantId);

      if (updateError) {
        console.error("participantProcessing.ts:63 - Error actualizando participante:", updateError);
        debugLog('Update error', updateError);
        throw updateError;
      }
      
      console.log("✅ participantProcessing.ts:68 - Participante actualizado exitosamente con email:", data.buyerEmail);
    } else {
      console.log("🆕 participantProcessing.ts:71 - Creando nuevo participante");
      
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
          raffle_id: raffleId,
          seller_id: raffleId  // Usar raffleId como seller_id para evitar errores de UUID
        })
        .select('id')
        .single();

      if (participantError) {
        console.error("participantProcessing.ts:95 - Error creando nuevo participante:", participantError);
        debugLog('Creation error', participantError);
        throw participantError;
      }

      participantId = newParticipant.id;
      console.log("✅ participantProcessing.ts:101 - Nuevo participante creado con ID:", participantId);
      debugLog('New participant created', { id: participantId });
    }

    return participantId;
  } catch (error) {
    console.error('participantProcessing.ts:107 - Error procesando participante:', error);
    debugLog('Process error', error);
    throw error;
  }
};
