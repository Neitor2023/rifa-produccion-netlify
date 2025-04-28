
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ValidatedBuyerInfo } from '@/types/participant';

export function useParticipantManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Finds a participant by phone or cedula in a specific raffle
   */
  const findParticipant = async (
    searchValue: string, 
    raffleId?: string,
    isPhone: boolean = true
  ): Promise<ValidatedBuyerInfo | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`useParticipantManager.ts: Buscando participante por ${isPhone ? 'teléfono' : 'cédula'} ${searchValue} en la rifa ${raffleId}`);
      
      const field = isPhone ? 'phone' : 'cedula';
      
      const { data, error } = await supabase
        .from('participants')
        .select('id, name, phone, cedula, direccion, sugerencia_producto')
        .eq(field, searchValue)
        .eq('raffle_id', raffleId)
        .maybeSingle();

      if (error) {
        console.error(`useParticipantManager.ts: Error al buscar participante:`, error);
        setError(error.message);
        return null;
      }

      if (data) {
        console.log(`useParticipantManager.ts: Participante encontrado:`, data);
        return data as ValidatedBuyerInfo;
      } else {
        console.log(`useParticipantManager.ts: No se encontró participante con ${field} ${searchValue}`);
        return null;
      }
    } catch (err) {
      console.error(`useParticipantManager.ts: Error inesperado:`, err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Creates a new participant
   */
  const createParticipant = async (
    participantData: {
      name: string;
      phone: string;
      cedula?: string;
      email?: string;
      raffle_id: string;
      seller_id: string;
      direccion?: string;
      sugerencia_producto?: string;
    }
  ): Promise<ValidatedBuyerInfo | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`useParticipantManager.ts: Creando nuevo participante:`, participantData);
      
      // Ensure email is always present, even if it's an empty string
      const dataToInsert = {
        ...participantData,
        email: participantData.email || ''
      };

      const { data, error } = await supabase
        .from('participants')
        .insert([dataToInsert]) // Make sure we're passing an array with the single object
        .select()
        .maybeSingle();

      if (error) {
        console.error(`useParticipantManager.ts: Error al crear participante:`, error);
        setError(error.message);
        return null;
      }

      console.log(`useParticipantManager.ts: Participante creado exitosamente:`, data);
      return data as ValidatedBuyerInfo;
    } catch (err) {
      console.error(`useParticipantManager.ts: Error inesperado:`, err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Updates an existing participant's information
   */
  const updateParticipant = async (
    participantId: string,
    updateData: {
      email?: string;
      direccion?: string;
      raffle_id?: string;
      seller_id?: string;
      nota?: string;
      sugerencia_producto?: string;
    }
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`useParticipantManager.ts: Actualizando participante ${participantId}:`, updateData);
      
      // Clean undefined values
      const cleanData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );
      
      if (Object.keys(cleanData).length === 0) {
        console.log(`useParticipantManager.ts: No hay datos para actualizar`);
        return true;
      }

      const { error } = await supabase
        .from('participants')
        .update(cleanData)
        .eq('id', participantId);

      if (error) {
        console.error(`useParticipantManager.ts: Error al actualizar participante:`, error);
        setError(error.message);
        return false;
      }

      console.log(`useParticipantManager.ts: Participante actualizado exitosamente`);
      return true;
    } catch (err) {
      console.error(`useParticipantManager.ts: Error inesperado:`, err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Updates raffle numbers to sold status
   */
  const markNumbersAsSold = async (
    numbers: string[],
    raffleId: string, 
    sellerId: string,
    participantId: string,
    participantData: {
      name: string;
      phone: string;
      cedula?: string;
    },
    paymentProof?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`useParticipantManager.ts: Marcando números como vendidos:`, {
        numbers,
        raffleId,
        sellerId,
        participantId
      });

      // First, check if these numbers exist and get their current status
      const { data: existingNumbers, error: fetchError } = await supabase
        .from('raffle_numbers')
        .select('id, number, status')
        .eq('raffle_id', raffleId)
        .eq('seller_id', sellerId)
        .in('number', numbers.map(n => parseInt(n)))
        .in('status', ['available', 'reserved']);

      if (fetchError) {
        console.error(`useParticipantManager.ts: Error al verificar números existentes:`, fetchError);
        setError(fetchError.message);
        return false;
      }

      console.log(`useParticipantManager.ts: Números existentes encontrados:`, existingNumbers);

      if (!existingNumbers || existingNumbers.length === 0) {
        console.log(`useParticipantManager.ts: No se encontraron números disponibles o reservados`);
        return false;
      }

      const updates = existingNumbers.map(num => ({
        id: num.id,
        raffle_id: raffleId,
        seller_id: sellerId,
        participant_id: participantId,
        number: num.number,
        status: 'sold',
        payment_proof: paymentProof,
        payment_approved: true,
        participant_name: participantData.name,
        participant_phone: participantData.phone,
        participant_cedula: participantData.cedula || ''
      }));

      const { error: updateError } = await supabase
        .from('raffle_numbers')
        .upsert(updates);

      if (updateError) {
        console.error(`useParticipantManager.ts: Error al actualizar números:`, updateError);
        setError(updateError.message);
        return false;
      }

      console.log(`useParticipantManager.ts: Números actualizados exitosamente a estado "sold"`);
      return true;
    } catch (err) {
      console.error(`useParticipantManager.ts: Error inesperado:`, err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Finds or creates a participant by phone number
   */
  const findOrCreateParticipant = async (
    phone: string,
    name: string,
    cedula?: string
  ): Promise<string | null> => {
    try {
      // First, try to find the participant by phone
      const participant = await findParticipant(phone);
      
      if (participant && participant.id) {
        console.log(`useParticipantManager.ts: Participante encontrado con ID ${participant.id}`);
        return participant.id;
      }
      
      // If not found, create a new participant
      // Note: This is a placeholder implementation as the complete implementation
      // would require raffleId and sellerId which we don't have in this context
      console.log(`useParticipantManager.ts: No se implementa la creación de participantes en este contexto`);
      return null;
    } catch (err) {
      console.error(`useParticipantManager.ts: Error en findOrCreateParticipant:`, err);
      return null;
    }
  };

  return {
    isLoading,
    error,
    findParticipant,
    createParticipant,
    updateParticipant,
    markNumbersAsSold,
    findOrCreateParticipant
  };
}
