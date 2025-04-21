
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useParticipantManager = ({ raffleId, debugMode = false, raffleSeller }) => {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ParticipantManager - ${context}]:`, data);
    }
  };

  const findExistingParticipant = async (phone: string) => {
    const { data, error } = await supabase
      .from('participants')
      .select('id, name, phone, cedula')
      .eq('phone', phone)
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

  const handleExistingParticipant = async (participant: { id: string, name: string }, newName?: string): Promise<string> => {
    if (newName && newName !== participant.name) {
      const { error } = await supabase
        .from('participants')
        .update({ name: newName })
        .eq('id', participant.id);
      if (error) {
        console.error('Error participante actualizando name:', error);
      }
    }
    return participant.id;
  };

  const createNewParticipant = async (phone: string, name?: string): Promise<string | null> => {
    if (!name) return null;
    debugLog('Creando nuevo participante', { name, phone, raffle_id: raffleId, seller_id: raffleSeller?.seller_id });
    const { data, error } = await supabase
      .from('participants')
      .insert({
        name,
        phone,
        email: '',
        raffle_id: raffleId,
        seller_id: raffleSeller?.seller_id
      })
      .select('id')
      .single();
    if (error) {
      toast.error('Error al crear participante: ' + error.message);
      return null;
    }
    debugLog('Nuevo participante creado con ID', data?.id);
    return data?.id || null;
  };

  const findOrCreateParticipant = async (phone: string, name?: string) => {
    try {
      debugLog('findOrCreateParticipant input', { phone, name, raffle_id: raffleId });
      const existingParticipant = await findExistingParticipant(phone);
      if (existingParticipant) {
        return handleExistingParticipant(existingParticipant, name);
      }
      return createNewParticipant(phone, name);
    } catch (error) {
      console.error('Error in findOrCreateParticipant:', error);
      toast.error('Error al buscar o crear participante: ' + (error.message || 'Error desconocido'));
      return null;
    }
  };

  return { findOrCreateParticipant, findExistingParticipant, createNewParticipant };
};

