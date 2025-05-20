
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumber } from './phoneUtils';
import { ValidatedBuyerInfo } from '@/types/participant';

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
    console.error('Error getting participant by phone and raffle:', error);
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
    // Format the phone number
    const formattedPhone = formatPhoneNumber(participantData.phone);
    
    // Check if participant already exists
    const existingParticipant = await getParticipantByPhoneAndRaffle(
      formattedPhone, 
      participantData.raffle_id
    );
    
    if (existingParticipant) {
      console.log('Participant already exists:', existingParticipant);
      
      // Update the existing participant
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          name: participantData.name,
          email: participantData.email || existingParticipant.email,
          cedula: participantData.cedula || existingParticipant.cedula,
          direccion: participantData.direccion,
          sugerencia_producto: participantData.sugerencia_producto,
          nota: participantData.nota,
          seller_id: participantData.seller_id
        })
        .eq('id', existingParticipant.id);
      
      if (updateError) {
        console.error('Error updating participant:', updateError);
        return null;
      }
      
      return existingParticipant.id;
    }
    
    // Create new participant
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
        seller_id: participantData.seller_id
      })
      .select('id')
      .single();
    
    if (createError) {
      console.error('Error creating participant:', createError);
      return null;
    }
    
    return newParticipant.id;
  } catch (error) {
    console.error('Exception in createParticipant:', error);
    return null;
  }
};
