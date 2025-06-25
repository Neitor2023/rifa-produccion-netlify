
import { supabase } from '@/integrations/supabase/client';
import { calculateExpirationDate } from './expirationCalculator';
import { RaffleNumber } from '@/lib/constants/types';

interface UpdateRaffleNumbersStatusProps {
  numbers: string[];
  status: string;
  participantId: string | null;
  participantData: any;
  raffleSeller: any;
  raffleId: string;
  raffleNumbers: RaffleNumber[];
  debugLog: (context: string, data: any) => void;
  reservationDays?: number;
  lotteryDate?: Date;
  rafflePrice?: number;
}

export async function updateRaffleNumbersStatus({
  numbers,
  status,
  participantId,
  participantData,
  raffleSeller,
  raffleId,
  raffleNumbers,
  debugLog,
  reservationDays = 5,
  lotteryDate,
  rafflePrice = 0
}: UpdateRaffleNumbersStatusProps) {
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
      if (participantData.participant_name || participantData.buyerName) 
        updateData.participant_name = participantData.participant_name || participantData.buyerName;
      
      if (participantData.participant_phone || participantData.buyerPhone) 
        updateData.participant_phone = participantData.participant_phone || participantData.buyerPhone;
      
      if (participantData.participant_cedula || participantData.buyerCedula) 
        updateData.participant_cedula = participantData.participant_cedula || participantData.buyerCedula;
    }
    
    if (status === 'reserved') {
      debugLog('Calculating reservation expiration date', { 
        reservationDays, 
        lotteryDate 
      });
      
      const reservationExpiresAt = calculateExpirationDate(reservationDays, lotteryDate);
      debugLog('Calculated expiration date', reservationExpiresAt.toISOString());
      
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
        const reservationExpiresAt = calculateExpirationDate(reservationDays, lotteryDate);
        
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
          console.error("[updateRaffleNumbersStatus.ts] ❌ Error al insertar en raffle_number_reservations:", reservationError);
        } else {
          console.log("[updateRaffleNumbersStatus.ts] ✅ Reserva registrada en raffle_number_reservations para número:", numStr);
        }
      } catch (reservationErr) {
        console.error("[updateRaffleNumbersStatus.ts] ❌ Error inesperado al procesar reserva para número", numStr, ":", reservationErr);
      }
    }
  });
  
  await Promise.all(updatePromises);
}
