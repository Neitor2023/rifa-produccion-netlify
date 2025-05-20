
import { supabase } from "@/integrations/supabase/client";
import { PaymentFormData } from "@/types/payment";
import { formatPhoneNumber } from "@/utils/phoneUtils";
import { getSellerUuidFromCedula, isValidUuid } from "@/hooks/useRaffleData/useSellerIdMapping";
import { SELLER_ID, RAFFLE_ID } from "@/lib/constants/ids";

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
    console.log("[participantProcessing.ts] Iniciando creación de participante...");
    debugLog('Iniciando procesamiento del participante', data);
    
    // Validar que tengamos al menos los datos básicos necesarios
    if (!data.buyerName || !data.buyerPhone) {
      console.error("[participantProcessing.ts] ❌ Faltan datos obligatorios del participante");
      debugLog('Faltan datos obligatorios', { 
        nombre: !!data.buyerName, 
        telefono: !!data.buyerPhone 
      });
      throw new Error("Faltan datos obligatorios del participante");
    }
    
    const formattedPhone = formatPhoneNumber(data.buyerPhone);
    
    // Validar y procesar el sellerId para asegurar que sea un UUID válido
    let validSellerId: string | null = null;
    
    if (data.sellerId) {
      // Verificar si el sellerId ya es un UUID
      if (isValidUuid(data.sellerId)) {
        // Ya es un UUID, usarlo directamente
        validSellerId = data.sellerId;
        debugLog('Usando UUID de vendedor proporcionado', validSellerId);
        console.log("[participantProcessing.ts] Usando UUID de vendedor proporcionado:", validSellerId);
      } else {
        // Parece una cédula, intentar obtener el UUID
        try {
          console.log("[participantProcessing.ts] Buscando UUID para cédula:", data.sellerId);
          const uuid = await getSellerUuidFromCedula(data.sellerId);
          if (uuid) {
            validSellerId = uuid;
            console.log("[participantProcessing.ts] UUID encontrado para cédula:", {cedula: data.sellerId, uuid});
            debugLog('Cédula de vendedor convertida a UUID', { cedula: data.sellerId, uuid });
          } else {
            console.log("[participantProcessing.ts] No se encontró UUID para cédula, usando valor por defecto:", SELLER_ID);
            debugLog('No se encontró UUID para la cédula', data.sellerId);
            
            // Intentar nuevamente con SELLER_ID
            const defaultUuid = await getSellerUuidFromCedula(SELLER_ID);
            if (defaultUuid) {
              validSellerId = defaultUuid;
              console.log("[participantProcessing.ts] Usando UUID del SELLER_ID por defecto:", {
                cedula: SELLER_ID,
                uuid: defaultUuid
              });
              debugLog('Usando UUID del valor por defecto', { 
                cedula: SELLER_ID, 
                uuid: defaultUuid 
              });
            } else {
              console.log("[participantProcessing.ts] ⚠️ No se encontró UUID válido");
            }
          }
        } catch (err) {
          console.error("[participantProcessing.ts] Error al convertir cédula a UUID:", err);
          debugLog('Error al convertir cédula', err);
        }
      }
    } else if (SELLER_ID) {
      // Si no se proporcionó un seller_id, intentar usar el SELLER_ID por defecto
      try {
        console.log("[participantProcessing.ts] No hay seller_id, buscando UUID para SELLER_ID por defecto:", SELLER_ID);
        const defaultUuid = await getSellerUuidFromCedula(SELLER_ID);
        if (defaultUuid) {
          validSellerId = defaultUuid;
          console.log("[participantProcessing.ts] UUID encontrado para SELLER_ID por defecto:", {cedula: SELLER_ID, uuid: defaultUuid});
          debugLog('UUID encontrado para valor por defecto', { 
            cedula: SELLER_ID, 
            uuid: defaultUuid 
          });
        } else {
          console.log("[participantProcessing.ts] ⚠️ No se pudo encontrar UUID con SELLER_ID por defecto");
        }
      } catch (err) {
        console.error("[participantProcessing.ts] Error al convertir SELLER_ID por defecto a UUID:", err);
        debugLog('Error al convertir SELLER_ID', err);
      }
    }
    
    // Validar que el raffleId esté definido
    if (!raffleId) {
      console.log("[participantProcessing.ts] ⚠️ raffleId no proporcionado, usando valor por defecto:", RAFFLE_ID);
      raffleId = RAFFLE_ID;
    }

    // Buscar participante existente
    const { data: existingParticipant, error: searchError } = await supabase
      .from('participants')
      .select('id, name, phone, email, cedula, direccion, sugerencia_producto, nota')
      .eq('phone', formattedPhone)
      .eq('raffle_id', raffleId)
      .maybeSingle();

    if (searchError) {
      console.error("[participantProcessing.ts] ❌ Error al buscar participante existente:", searchError.message);
      debugLog('Error en búsqueda', searchError);
      throw new Error("Error al buscar participante en la base de datos");
    }

    let participantId: string | null = null;

    // Log de los datos que se usarán para actualizar o crear el participante
    console.log("[participantProcessing.ts] Datos del participante a procesar:", {
      name: data.buyerName,
      cedula: data.buyerCedula,
      phone: formattedPhone,
      email: data.buyerEmail || '',
      seller_id: validSellerId,
      raffle_id: raffleId,
    });
    debugLog('Datos a procesar', {
      name: data.buyerName,
      phone: formattedPhone,
      seller_id: validSellerId
    });

    if (existingParticipant) {
      participantId = existingParticipant.id;
      console.log("[participantProcessing.ts] ✅ Participante existente encontrado:", existingParticipant);
      debugLog('Usando participante existente', existingParticipant);

      const updateData: any = {
        name: data.buyerName,
        phone: formattedPhone,
        nota: data.nota,
        email: data.buyerEmail || existingParticipant.email || '',
        cedula: data.buyerCedula || existingParticipant.cedula || null,
        direccion: data.direccion || existingParticipant.direccion || null,
        sugerencia_producto: data.sugerenciaProducto || existingParticipant.sugerencia_producto || null
      };

      // Solo agregar seller_id si tenemos un UUID válido
      if (validSellerId) {
        updateData.seller_id = validSellerId;
        debugLog('Añadiendo seller_id a la actualización', validSellerId);
      } else {
        console.log("[participantProcessing.ts] ⚠️ No se incluirá seller_id en la actualización (no disponible)");
      }

      console.log("[participantProcessing.ts] Actualizando participante con datos:", updateData);
      debugLog('Datos de actualización', updateData);

      const { error: updateError } = await supabase
        .from('participants')
        .update(updateData)
        .eq('id', participantId);

      if (updateError) {
        console.error("[participantProcessing.ts] ❌ Error al actualizar participante:", updateError.message);
        debugLog('Error de actualización', updateError);
        throw new Error("Error al actualizar participante en la base de datos");
      }
      
      console.log("[participantProcessing.ts] ✅ Participante actualizado correctamente:", participantId);
    } else {
      console.log("[participantProcessing.ts] 🆕 Creando nuevo participante");
      debugLog('Creando nuevo participante', { 
        name: data.buyerName, 
        phone: formattedPhone,
        email: data.buyerEmail || ''
      });

      const insertData: any = {
        name: data.buyerName,
        phone: formattedPhone,
        email: data.buyerEmail || '',
        cedula: data.buyerCedula || null,
        direccion: data.direccion || null,
        sugerencia_producto: data.sugerenciaProducto || null,
        nota: data.nota || null,
        raffle_id: raffleId
      };
      
      // Solo agregar seller_id si tenemos un UUID válido
      if (validSellerId) {
        insertData.seller_id = validSellerId;
      } else {
        console.log("[participantProcessing.ts] ⚠️ No se incluirá seller_id en la creación (no disponible)");
      }
      
      console.log("[participantProcessing.ts] Insertando participante con datos:", insertData);
      debugLog('Datos de inserción', insertData);

      const { data: newParticipant, error: participantError } = await supabase
        .from('participants')
        .insert(insertData)
        .select('id')
        .single();

      if (participantError) {
        console.error("[participantProcessing.ts] ❌ Error al crear nuevo participante:", participantError.message);
        debugLog('Error de creación', participantError);
        throw new Error("Error al registrar participante en la base de datos");
      }

      participantId = newParticipant.id;
      console.log("[participantProcessing.ts] ✅ Nuevo participante creado:", participantId);
      debugLog('Nuevo participante creado', { id: participantId });
    }

    // Guardar reporte de actividad sospechosa si se proporciona
    if (data.reporteSospechoso) {
      try {
        console.log("[participantProcessing.ts] 🚨 Guardando reporte de actividad sospechosa:", data.reporteSospechoso);
        debugLog('Guardando reporte sospechoso', {
          mensaje: data.reporteSospechoso,
          participant_id: participantId,
          seller_id: validSellerId,
          raffle_id: raffleId
        });
        
        const { error: fraudReportError } = await supabase
          .from('fraud_reports')
          .insert({
            mensaje: data.reporteSospechoso,
            participant_id: participantId,
            seller_id: validSellerId,
            raffle_id: raffleId
          });
          
        if (fraudReportError) {
          console.error("[participantProcessing.ts] ❌ Error al guardar reporte de fraude:", fraudReportError.message);
          debugLog('Error en reporte de fraude', fraudReportError);
        } else {
          console.log("[participantProcessing.ts] ✅ Reporte de fraude guardado correctamente");
        }
      } catch (fraudError) {
        console.error("[participantProcessing.ts] ❌ Excepción al guardar reporte de fraude:", fraudError);
        debugLog('Excepción en reporte de fraude', fraudError);
        // No lanzar aquí - no queremos impedir la creación/actualización del participante si falla el reporte de fraude
      }
    }

    console.log("[participantProcessing.ts] ✅ Participante procesado correctamente:", participantId);
    return participantId;
  } catch (error) {
    console.error('[participantProcessing.ts] ❌ Error al procesar participante:', error);
    debugLog('Error de procesamiento', error);
    throw error;
  }
};
