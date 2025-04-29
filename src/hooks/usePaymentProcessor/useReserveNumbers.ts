
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function useReserveNumbers({
  raffleId,
  sellerId,
  debugMode = false
}) {
  const [isReserving, setIsReserving] = useState(false);
  
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ReserveNumbers - ${context}]:`, data);
    }
  };

  const reserveNumbers = async (numbers: string[], buyerPhone?: string, buyerName?: string, buyerCedula?: string) => {
    if (!numbers || numbers.length === 0) {
      toast.error('Seleccione al menos un número para apartar');
      return;
    }
    
    if (!buyerPhone || !buyerName) {
      toast.error('Ingrese nombre y teléfono del comprador');
      return;
    }
    
    setIsReserving(true);
    
    try {
      debugLog('Reserving numbers', { numbers, buyerPhone, buyerName, buyerCedula });
      
      // Find or create participant
      let participantId: string | null = null;
      
      const { data: existingParticipant, error: participantError } = await supabase
        .from('participants')
        .select('id')
        .eq('phone', buyerPhone)
        .maybeSingle();
      
      if (participantError) {
        console.error('Error checking for existing participant:', participantError);
      }
      
      if (existingParticipant) {
        participantId = existingParticipant.id;
        
        // Update participant info
        const { error: updateError } = await supabase
          .from('participants')
          .update({
            name: buyerName,
            cedula: buyerCedula,
            raffle_id: raffleId
          })
          .eq('id', participantId);
        
        if (updateError) {
          console.error('Error updating participant:', updateError);
        }
      } else {
        // Create new participant
        const { data: newParticipant, error: createError } = await supabase
          .from('participants')
          .insert({
            name: buyerName,
            phone: buyerPhone,
            cedula: buyerCedula,
            raffle_id: raffleId,
            seller_id: sellerId,
            email: 'default@example.com' // Required field
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error('Error creating participant:', createError);
          throw createError;
        }
        
        participantId = newParticipant.id;
      }
      
      // Update numbers to reserved status
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 1); // Expire in 24 hours
      
      const updatePromises = numbers.map(async (numStr) => {
        const num = parseInt(numStr, 10);
        
        // Check if number already exists
        const { data: existingNumbers, error: checkError } = await supabase
          .from('raffle_numbers')
          .select('id')
          .eq('raffle_id', raffleId)
          .eq('number', num)
          .maybeSingle();
        
        if (checkError) {
          console.error(`Error checking number ${num}:`, checkError);
          throw checkError;
        }
        
        const reservationData = {
          status: 'reserved',
          seller_id: sellerId,
          participant_id: participantId,
          reservation_expires_at: expirationDate.toISOString(),
          participant_name: buyerName,
          participant_phone: buyerPhone,
          participant_cedula: buyerCedula
        };
        
        if (existingNumbers) {
          // Update existing number
          const { error: updateError } = await supabase
            .from('raffle_numbers')
            .update(reservationData)
            .eq('id', existingNumbers.id);
          
          if (updateError) {
            console.error(`Error updating number ${num}:`, updateError);
            throw updateError;
          }
        } else {
          // Insert new number
          const { error: insertError } = await supabase
            .from('raffle_numbers')
            .insert({
              raffle_id: raffleId,
              number: num,
              ...reservationData
            });
          
          if (insertError) {
            console.error(`Error inserting number ${num}:`, insertError);
            throw insertError;
          }
        }
      });
      
      await Promise.all(updatePromises);
      
      toast.success(`${numbers.length} número(s) apartados exitosamente`);
      return true;
    } catch (error) {
      console.error('Error reserving numbers:', error);
      toast.error('Error al apartar los números');
      return false;
    } finally {
      setIsReserving(false);
    }
  };
  
  return {
    reserveNumbers,
    isReserving
  };
}
