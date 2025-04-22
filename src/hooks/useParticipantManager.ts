
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useParticipantManager = ({ raffleId, debugMode = false, raffleSeller }) => {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ParticipantManager - ${context}]:`, data);
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    let cleanedPhone = phone.trim();
    
    // If it starts with "+5930", replace with "+593"
    if (cleanedPhone.startsWith('+5930')) {
      cleanedPhone = '+593' + cleanedPhone.substring(5);
    }
    // If it starts with "0", remove it and add "+593"
    else if (cleanedPhone.startsWith('0')) {
      cleanedPhone = '+593' + cleanedPhone.substring(1);
    }
    // If it doesn't have any prefix, add "+593"
    else if (!cleanedPhone.startsWith('+')) {
      cleanedPhone = '+593' + cleanedPhone;
    }
    
    return cleanedPhone;
  };

  const findExistingParticipant = async (phone: string) => {
    const formattedPhone = formatPhoneNumber(phone);
    
    const { data, error } = await supabase
      .from('participants')
      .select('id, name, phone, cedula, direccion, sugerencia_producto')
      .eq('phone', formattedPhone)
      .eq('raffle_id', raffleId)
      .maybeSingle();
      
    if (error) {
      console.error('Error searching for participant:', error);
      return null;
    }
    
    if (data) {
      debugLog('Found existing participant', data);
      return data;
    }
    return null;
  };

  const handleExistingParticipant = async (
    participant: { 
      id: string; 
      name: string; 
      phone?: string;
      cedula?: string;
      direccion?: string;
      sugerencia_producto?: string;
    }, 
    newName?: string, 
    newCedula?: string,
    newPhone?: string
  ): Promise<string> => {
    const updateData: any = {};
    
    if (newName && newName !== participant.name) {
      updateData.name = newName;
    }
    
    if (newCedula && newCedula !== participant.cedula) {
      updateData.cedula = newCedula;
    }

    if (newPhone) {
      const formattedPhone = formatPhoneNumber(newPhone);
      if (formattedPhone !== participant.phone) {
        updateData.phone = formattedPhone;
      }
    }
    
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('participants')
        .update(updateData)
        .eq('id', participant.id);
      if (error) {
        console.error('Error updating participant:', error);
      }
    }
    
    return participant.id;
  };

  const createNewParticipant = async (phone: string, name?: string, cedula?: string): Promise<string | null> => {
    if (!name) return null;
    
    const formattedPhone = formatPhoneNumber(phone);
    debugLog('Creating new participant', { 
      name, 
      formattedPhone, 
      cedula, 
      raffle_id: raffleId, 
      seller_id: raffleSeller?.seller_id 
    });
    
    const { data, error } = await supabase
      .from('participants')
      .insert({
        name,
        phone: formattedPhone,
        email: '',
        cedula: cedula || null,
        raffle_id: raffleId,
        seller_id: raffleSeller?.seller_id
      })
      .select('id')
      .single();
      
    if (error) {
      toast.error('Error al crear participante: ' + error.message);
      return null;
    }
    
    debugLog('New participant created with ID', data?.id);
    return data?.id || null;
  };

  const findOrCreateParticipant = async (phone: string, name?: string, cedula?: string) => {
    try {
      debugLog('findOrCreateParticipant input', { phone, name, cedula, raffle_id: raffleId });
      const existingParticipant = await findExistingParticipant(phone);
      
      if (existingParticipant) {
        return handleExistingParticipant(
          existingParticipant, 
          name, 
          cedula, 
          phone
        );
      }
      
      return createNewParticipant(phone, name, cedula);
    } catch (error) {
      console.error('Error in findOrCreateParticipant:', error);
      toast.error('Error al buscar o crear participante: ' + (error.message || 'Error desconocido'));
      return null;
    }
  };

  return { 
    findOrCreateParticipant, 
    findExistingParticipant, 
    createNewParticipant,
    formatPhoneNumber 
  };
};
