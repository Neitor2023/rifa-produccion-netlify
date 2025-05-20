
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumber } from './phoneUtils';
import { ValidatedBuyerInfo } from '@/types/participant';
import { getSellerUuidFromCedula } from '@/hooks/useRaffleData/useSellerIdMapping';
import { SELLER_ID } from '@/lib/constants/ids';

/**
 * Get a participant by phone number and raffle ID
 */
export const getParticipantByPhoneAndRaffle = async (
  phone: string,
  raffleId: string
): Promise<{ id: string; name: string; phone: string; email: string; cedula: string } | null> => {
  const formattedPhone = formatPhoneNumber(phone);
  
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
  
  return data;
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
    
    if (participantData.seller_id) {
      // Verificar si el sellerId ya es un UUID (contiene guiones y es suficientemente largo)
      const isUuid = participantData.seller_id.includes('-') && participantData.seller_id.length > 30;
      
      if (isUuid) {
        // Ya es un UUID, usarlo directamente
        validSellerId = participantData.seller_id;
        console.log("[participantUtils.ts] Usando UUID de vendedor:", validSellerId);
      } else {
        // Parece una cédula, intentar obtener el UUID
        try {
          console.log("[participantUtils.ts] Buscando UUID para cédula:", participantData.seller_id);
          const uuid = await getSellerUuidFromCedula(participantData.seller_id);
          if (uuid) {
            validSellerId = uuid;
            console.log("[participantUtils.ts] UUID encontrado para cédula:", {cedula: participantData.seller_id, uuid});
          } else {
            console.log("[participantUtils.ts] No se encontró UUID para cédula, buscando con SELLER_ID por defecto:", SELLER_ID);
            // Si falla la búsqueda con el seller_id proporcionado, intentar con el SELLER_ID por defecto
            const defaultUuid = await getSellerUuidFromCedula(SELLER_ID);
            if (defaultUuid) {
              validSellerId = defaultUuid;
              console.log("[participantUtils.ts] UUID encontrado para SELLER_ID por defecto:", {cedula: SELLER_ID, uuid: defaultUuid});
            } else {
              console.log("[participantUtils.ts] No se pudo encontrar un UUID válido para el vendedor");
            }
          }
        } catch (err) {
          console.error("[participantUtils.ts] Error al convertir cédula a UUID:", err);
        }
      }
    } else if (SELLER_ID) {
      // Si no se proporcionó un seller_id, intentar usar el SELLER_ID por defecto
      try {
        console.log("[participantUtils.ts] No hay seller_id, buscando UUID para SELLER_ID por defecto:", SELLER_ID);
        const defaultUuid = await getSellerUuidFromCedula(SELLER_ID);
        if (defaultUuid) {
          validSellerId = defaultUuid;
          console.log("[participantUtils.ts] UUID encontrado para SELLER_ID por defecto:", {cedula: SELLER_ID, uuid: defaultUuid});
        }
      } catch (err) {
        console.error("[participantUtils.ts] Error al convertir SELLER_ID por defecto a UUID:", err);
      }
    }
    
    // Verificar si el participante ya existe
    const existingParticipant = await getParticipantByPhoneAndRaffle(
      formattedPhone, 
      participantData.raffle_id
    );
    
    // Verificar datos del participante antes de proceder
    console.log("[participantUtils.ts] Verificando datos del participante:", {
      name: participantData.name,
      cedula: participantData.cedula,
      phone: formattedPhone,
      email: participantData.email || '',
      seller_id: validSellerId,
      raffle_id: participantData.raffle_id,
    });
    
    if (existingParticipant) {
      console.log('[participantUtils.ts] Participante ya existe:', existingParticipant);
      
      // Actualizar el participante existente
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          name: participantData.name,
          email: participantData.email || existingParticipant.email,
          cedula: participantData.cedula || existingParticipant.cedula,
          direccion: participantData.direccion,
          sugerencia_producto: participantData.sugerencia_producto,
          nota: participantData.nota,
          seller_id: validSellerId
        })
        .eq('id', existingParticipant.id);
      
      if (updateError) {
        console.error('[participantUtils.ts] ❌ Error al actualizar participante:', updateError.message);
        return null;
      }
      
      console.log("[participantUtils.ts] ✅ Participante actualizado correctamente:", existingParticipant.id);
      return existingParticipant.id;
    }
    
    // Crear nuevo participante
    const { data: newParticipant, error: createError } = await supabase
      .from('participants')
      .insert({
        name: participantData.name,
        phone: formattedPhone,
        email: participantData.email || '',
        cedula: participantData.cedula,
        raffle_id: participantData.raffle_id,
        direccion: participantData.direccion,
        sugerencia_producto: participantData.sugerencia_producto,
        nota: participantData.nota,
        seller_id: validSellerId
      })
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
