
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumber } from './phoneUtils';
import { ValidatedBuyerInfo } from '@/types/participant';
import { getSellerUuidFromCedula, isValidUuid } from '@/hooks/useRaffleData/useSellerIdMapping';
import { SELLER_ID } from '@/lib/constants/ids';

/**
 * Get a participant by phone number and raffle ID
 */
export const getParticipantByPhoneAndRaffle = async (
  phone: string,
  raffleId: string
): Promise<{ id: string; name: string; phone: string; email: string; cedula: string } | null> => {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    console.log("[participantUtils.ts] Buscando participante por teléfono:", formattedPhone);
    
    const { data, error } = await supabase
      .from('participants')
      .select('id, name, phone, email, cedula')
      .eq('phone', formattedPhone)
      .eq('raffle_id', raffleId)
      .maybeSingle();
    
    if (error) {
      console.error('[participantUtils.ts] Error al obtener participante por teléfono y rifa:', error.message);
      return null;
    }
    
    if (data) {
      console.log('[participantUtils.ts] Participante encontrado:', data.name);
    } else {
      console.log('[participantUtils.ts] No se encontró participante con teléfono:', formattedPhone);
    }
    
    return data;
  } catch (err) {
    console.error('[participantUtils.ts] Excepción en getParticipantByPhoneAndRaffle:', err);
    return null;
  }
};

/**
 * Create a new participant
 */
export const createParticipant = async (
  participantData: {
    name: string;
    phone: string;
    email?: string;
    cedula?: string;
    raffle_id: string;
    direccion?: string;
    sugerencia_producto?: string;
    nota?: string;
    seller_id?: string;
  }
): Promise<string | null> => {
  try {
    console.log("[participantUtils.ts] Iniciando creación de participante...");
    
    // Formatear el número de teléfono
    const formattedPhone = formatPhoneNumber(participantData.phone);
    
    // Procesar seller_id para asegurar que sea un UUID válido
    let validSellerId: string | null = null;
    
    // Lógica para obtener un UUID válido
    if (participantData.seller_id) {
      // Verificar si ya es un UUID
      if (isValidUuid(participantData.seller_id)) {
        validSellerId = participantData.seller_id;
        console.log("[participantUtils.ts] Usando UUID de vendedor proporcionado:", validSellerId);
      } else {
        // Intentar obtener UUID a partir de cédula
        console.log("[participantUtils.ts] Buscando UUID para cédula:", participantData.seller_id);
        validSellerId = await getSellerUuidFromCedula(participantData.seller_id);
        
        if (validSellerId) {
          console.log("[participantUtils.ts] UUID encontrado para cédula:", {
            cedula: participantData.seller_id, 
            uuid: validSellerId
          });
        } else {
          // Intentar con el SELLER_ID por defecto
          console.log("[participantUtils.ts] No se encontró UUID, usando SELLER_ID por defecto:", SELLER_ID);
          if (SELLER_ID && SELLER_ID !== participantData.seller_id) {
            validSellerId = await getSellerUuidFromCedula(SELLER_ID);
          }
        }
      }
    } else if (SELLER_ID) {
      // Si no se proporcionó seller_id, usar el valor por defecto
      console.log("[participantUtils.ts] Usando SELLER_ID por defecto:", SELLER_ID);
      validSellerId = await getSellerUuidFromCedula(SELLER_ID);
    }
    
    if (!validSellerId) {
      console.log("[participantUtils.ts] ⚠️ No se pudo determinar un UUID válido para el vendedor");
    } else {
      console.log("[participantUtils.ts] UUID válido determinado:", validSellerId);
    }
    
    // Verificar participante existente
    const existingParticipant = await getParticipantByPhoneAndRaffle(
      formattedPhone, 
      participantData.raffle_id
    );
    
    // Registrar datos antes de la operación
    console.log("[participantUtils.ts] Datos del participante a procesar:", {
      name: participantData.name,
      phone: formattedPhone,
      email: participantData.email || '',
      cedula: participantData.cedula,
      direccion: participantData.direccion,
      sugerencia_producto: participantData.sugerencia_producto,
      nota: participantData.nota,
      raffle_id: participantData.raffle_id,
      seller_id: validSellerId
    });
    
    // Actualizar o crear participante
    if (existingParticipant) {
      console.log('[participantUtils.ts] Actualizando participante existente:', existingParticipant.id);
      
      const updateData: any = {
        name: participantData.name,
        email: participantData.email || existingParticipant.email,
        cedula: participantData.cedula || existingParticipant.cedula,
        direccion: participantData.direccion,
        sugerencia_producto: participantData.sugerencia_producto,
        nota: participantData.nota
      };
      
      // Solo añadir seller_id si es válido
      if (validSellerId) {
        updateData.seller_id = validSellerId;
      }
      
      const { error: updateError } = await supabase
        .from('participants')
        .update(updateData)
        .eq('id', existingParticipant.id);
      
      if (updateError) {
        console.error('[participantUtils.ts] ❌ Error al actualizar participante:', updateError.message);
        return null;
      }
      
      console.log("[participantUtils.ts] ✅ Participante actualizado correctamente:", existingParticipant.id);
      return existingParticipant.id;
    }
    
    // Crear nuevo participante
    const insertData: any = {
      name: participantData.name,
      phone: formattedPhone,
      email: participantData.email || '',
      cedula: participantData.cedula,
      raffle_id: participantData.raffle_id,
      direccion: participantData.direccion,
      sugerencia_producto: participantData.sugerencia_producto,
      nota: participantData.nota
    };
    
    // Solo añadir seller_id si es válido
    if (validSellerId) {
      insertData.seller_id = validSellerId;
    }
    
    // Verificación final antes de insertar
    console.log("[participantUtils.ts] Datos finales para inserción:", insertData);
    
    const { data: newParticipant, error: createError } = await supabase
      .from('participants')
      .insert(insertData)
      .select('id')
      .single();
    
    if (createError) {
      console.error('[participantUtils.ts] ❌ Error al crear participante:', createError.message);
      return null;
    }
    
    console.log("[participantUtils.ts] ✅ Participante creado correctamente:", newParticipant.id);
    return newParticipant.id;
  } catch (error) {
    console.error('[participantUtils.ts] ❌ Excepción en createParticipant:', error);
    return null;
  }
};
