
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
        .insert(dataToInsert)
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

      // Process each number individually to handle the update or insert logic
      const promises = numbers.map(async (num) => {
        // First check if the number exists for this raffle
        const { data: existingNumber, error: checkError } = await supabase
          .from('raffle_numbers')
          .select('id, status')
          .eq('raffle_id', raffleId)
          .eq('number', parseInt(num))
          .maybeSingle();
        
        if (checkError) {
          console.error(`useParticipantManager.ts: Error al verificar número ${num}:`, checkError);
          throw checkError;
        }
        
        const updateData = {
          status: 'sold',
          participant_id: participantId,
          seller_id: sellerId,
          payment_approved: true,
          payment_proof: paymentProof || null,
          participant_name: participantData.name,
          participant_phone: participantData.phone,
          participant_cedula: participantData.cedula || null,
          reservation_expires_at: null
        };
        
        if (existingNumber) {
          console.log(`useParticipantManager.ts: Actualizando número existente ${num}`);
          
          const { error: updateError } = await supabase
            .from('raffle_numbers')
            .update(updateData)
            .eq('id', existingNumber.id);
          
          if (updateError) {
            console.error(`useParticipantManager.ts: Error al actualizar número ${num}:`, updateError);
            throw updateError;
          }
        } else {
          console.log(`useParticipantManager.ts: Insertando nuevo número ${num}`);
          
          const { error: insertError } = await supabase
            .from('raffle_numbers')
            .insert({
              raffle_id: raffleId,
              number: parseInt(num),
              ...updateData
            });
          
          if (insertError) {
            console.error(`useParticipantManager.ts: Error al insertar número ${num}:`, insertError);
            throw insertError;
          }
        }
        
        return true;
      });
      
      await Promise.all(promises);
      
      console.log(`useParticipantManager.ts: Todos los números marcados como vendidos exitosamente`);
      return true;
    } catch (err) {
      console.error(`useParticipantManager.ts: Error inesperado:`, err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    findParticipant,
    createParticipant,
    updateParticipant,
    markNumbersAsSold
  };
}
