
import { supabase } from '@/integrations/supabase/client';
import { RaffleNumber } from '@/lib/constants/types';

export const useNumberStatus = ({ 
  raffleSeller, 
  raffleId, 
  raffleNumbers, 
  debugMode = false, 
  reservationDays = 5, 
  lotteryDate,
  rafflePrice = 0
}) => {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - NumberStatus - ${context}]:`, data);
    }
  };

  const updateRaffleNumbersStatus = async (
    numbers: string[], 
    status: string, 
    participantId: string | null = null,
    participantData = null
  ) => {
    if (!raffleSeller?.seller_id) {
      throw new Error('Seller ID not available');
    }

    debugLog('Updating raffle numbers with participant data', { 
      numbers, 
      status, 
      participantId, 
      participantData,
      rafflePrice
    });

    const updatePromises = numbers.map(async (numStr) => {
      const num = parseInt(numStr);
      const existingNumber = raffleNumbers?.find(n => n.number === numStr);
      
      const updateData: any = { 
        status, 
        seller_id: raffleSeller.seller_id
      };
      
      if (participantId) updateData.participant_id = participantId;
      
      // Add participant details if provided
      if (participantData) {
        if (participantData.buyerName) updateData.participant_name = participantData.buyerName;
        if (participantData.buyerPhone) updateData.participant_phone = participantData.buyerPhone;
        if (participantData.buyerCedula) updateData.participant_cedula = participantData.buyerCedula;
      }
      
      if (status === 'reserved') {
        // Calculate the reservation expiration date based on reservationDays and lotteryDate
        const currentDate = new Date();
        const daysToAdd = typeof reservationDays === 'number' ? reservationDays : 5;
        
        debugLog('Calculating reservation expiration date', { 
          currentDate, 
          daysToAdd, 
          reservationDays, 
          lotteryDate 
        });
        
        // Create a new date by adding the specified days
        const expirationDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        
        // Determine if we should use the lottery date if it comes before the calculated expiration
        let reservationExpiresAt: Date;
        if (lotteryDate && lotteryDate instanceof Date && !isNaN(lotteryDate.getTime())) {
          // Valid lottery date, compare with expiration date
          if (expirationDate.getTime() > lotteryDate.getTime()) {
            // If expiration would be after the lottery, use the lottery date instead
            reservationExpiresAt = new Date(lotteryDate);
            debugLog('Using lottery date as expiration', reservationExpiresAt.toISOString());
          } else {
            // Otherwise use the calculated expiration date
            reservationExpiresAt = expirationDate;
            debugLog('Using calculated expiration date', reservationExpiresAt.toISOString());
          }
        } else {
          // No valid lottery date, just use the calculated expiration date
          reservationExpiresAt = expirationDate;
          debugLog('No valid lottery date, using calculated expiration', reservationExpiresAt.toISOString());
        }
        
        updateData.reservation_expires_at = reservationExpiresAt.toISOString();
      } else if (status === 'sold') {
        updateData.reservation_expires_at = null;
      }
      
      let raffleNumberResult: any = null;
      
      if (existingNumber) {
        debugLog(`Updating number ${numStr}`, updateData);
        const { data, error } = await supabase
          .from('raffle_numbers')
          .update(updateData)
          .eq('id', existingNumber.id)
          .select()
          .single();
        if (error) throw error;
        raffleNumberResult = data;
      } else {
        const insertData = { ...updateData, raffle_id: raffleId, number: num };
        debugLog(`Inserting new number ${numStr}`, insertData);
        const { data, error } = await supabase
          .from('raffle_numbers')
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        raffleNumberResult = data;
      }

      // NUEVA LÓGICA: Insertar en raffle_number_reservations cuando el status sea 'reserved'
      if (status === 'reserved' && raffleNumberResult?.id) {
        try {
          // Calculate the reservation expiration date
          const currentDate = new Date();
          const daysToAdd = typeof reservationDays === 'number' ? reservationDays : 5;
          const expirationDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
          
          let reservationExpiresAt: Date;
          if (lotteryDate && lotteryDate instanceof Date && !isNaN(lotteryDate.getTime())) {
            if (expirationDate.getTime() > lotteryDate.getTime()) {
              reservationExpiresAt = new Date(lotteryDate);
            } else {
              reservationExpiresAt = expirationDate;
            }
          } else {
            reservationExpiresAt = expirationDate;
          }
          
          const reservationData = {
            raffle_number_id: raffleNumberResult.id,
            reserved_by_seller_id: raffleSeller.seller_id,
            reserved_by_participant_id: participantId,
            reservation_created_at: new Date().toISOString(),
            reservation_expires_at: reservationExpiresAt.toISOString(),
            reservation_status: 'active',
            price_at_reservation: rafflePrice,
            notes: null
          };

          debugLog(`Insertando reserva en raffle_number_reservations para número ${numStr}`, reservationData);
          
          const { data: reservationInsert, error: reservationError } = await supabase
            .from('raffle_number_reservations')
            .insert(reservationData);

          if (reservationError) {
            console.error("[useNumberStatus.ts] ❌ Error al insertar en raffle_number_reservations:", reservationError);
          } else {
            console.log("[useNumberStatus.ts] ✅ Reserva registrada en raffle_number_reservations para número:", numStr);
          }
        } catch (reservationErr) {
          console.error("[useNumberStatus.ts] ❌ Error inesperado al procesar reserva para número", numStr, ":", reservationErr);
        }
      }
    });
    
    await Promise.all(updatePromises);
  };

  return { updateRaffleNumbersStatus };
};
