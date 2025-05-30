
import { supabase } from "@/integrations/supabase/client";
import { PaymentFormData } from "@/schemas/paymentFormSchema";

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
    console.log("[participantProcessing.ts] + Iniciando procesamiento de participante:", {
      nombre: data.buyerName,
      telefono: data.buyerPhone,
      cedula: data.buyerCedula,
      email: data.buyerEmail
    });

    debugLog('Procesando participante', {
      nombre: data.buyerName,
      telefono: data.buyerPhone,
      cedula: data.buyerCedula
    });

    // CORRECCIÓN CRÍTICA: Validar y preparar datos del participante
    if (!data.buyerName || data.buyerName.trim() === '') {
      throw new Error('El nombre del comprador es requerido');
    }

    if (!data.buyerPhone || data.buyerPhone.trim() === '') {
      throw new Error('El teléfono del comprador es requerido');
    }

    if (!data.buyerCedula || data.buyerCedula.trim() === '') {
      throw new Error('La cédula del comprador es requerida');
    }

    // Preparar datos del participante con valores por defecto para campos opcionales
    const participantData = {
      name: data.buyerName.trim(),
      phone: data.buyerPhone.trim(),
      cedula: data.buyerCedula.trim(),
      email: data.buyerEmail || '',
      direccion: data.direccion || '',
      sugerencia_producto: data.sugerenciaProducto || '',
      nota: data.nota || '',
      raffle_id: raffleId,
      seller_id: data.sellerId || null
    };

    console.log("[participantProcessing.ts] + Datos preparados para participante:", {
      ...participantData,
      seller_id: data.sellerId
    });

    // CORRECCIÓN 1: Buscar participante existente por cédula y raffle_id
    const { data: existingParticipant, error: searchError } = await supabase
      .from('participants')
      .select('id, name, phone, cedula, email, direccion, sugerencia_producto, nota')
      .eq('cedula', participantData.cedula)
      .eq('raffle_id', raffleId)
      .maybeSingle();

    if (searchError) {
      console.error("[participantProcessing.ts] + Error al buscar participante:", searchError);
      throw new Error("Error al buscar participante existente: " + searchError.message);
    }

    let participantId: string;

    if (existingParticipant) {
      console.log("[participantProcessing.ts] + Participante existente encontrado:", {
        id: existingParticipant.id,
        nombre: existingParticipant.name,
        cedula: existingParticipant.cedula
      });

      // CORRECCIÓN 2: Actualizar participante existente con nueva información
      const { data: updatedParticipant, error: updateError } = await supabase
        .from('participants')
        .update({
          name: participantData.name,
          phone: participantData.phone,
          email: participantData.email,
          direccion: participantData.direccion,
          sugerencia_producto: participantData.sugerencia_producto,
          nota: participantData.nota,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingParticipant.id)
        .select('id')
        .single();

      if (updateError) {
        console.error("[participantProcessing.ts] + Error al actualizar participante:", updateError);
        throw new Error("Error al actualizar participante existente: " + updateError.message);
      }

      participantId = updatedParticipant.id;
      console.log("[participantProcessing.ts] + Participante actualizado exitosamente con ID:", participantId);

    } else {
      console.log("[participantProcessing.ts] + Creando nuevo participante...");

      // CORRECCIÓN 3: Crear nuevo participante
      const { data: newParticipant, error: createError } = await supabase
        .from('participants')
        .insert([participantData])
        .select('id')
        .single();

      if (createError) {
        console.error("[participantProcessing.ts] + Error al crear participante:", createError);
        throw new Error("Error al crear nuevo participante: " + createError.message);
      }

      participantId = newParticipant.id;
      console.log("[participantProcessing.ts] + Nuevo participante creado exitosamente con ID:", participantId);
    }

    debugLog('Participante procesado exitosamente', {
      participantId,
      isNew: !existingParticipant
    });

    return participantId;

  } catch (error) {
    console.error('[participantProcessing.ts] + Error al procesar participante:', error);
    debugLog('Error de procesamiento de participante', error);
    throw error;
  }
};
