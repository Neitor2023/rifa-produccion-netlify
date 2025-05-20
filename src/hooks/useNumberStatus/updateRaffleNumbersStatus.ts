
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
  lotteryDate
}: UpdateRaffleNumbersStatusProps) {
  if (!raffleSeller?.seller_id) {
    throw new Error('Seller ID not available');
  }

  debugLog('Updating raffle numbers with participant data', { 
    numbers, 
    status, 
    participantId, 
    participantData 
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
    
    if (existingNumber) {
      debugLog(`Updating number ${numStr}`, updateData);
      const { error } = await supabase
        .from('raffle_numbers')
        .update(updateData)
        .eq('id', existingNumber.id);
      if (error) throw error;
    } else {
      const insertData = { ...updateData, raffle_id: raffleId, number: num };
      debugLog(`Inserting new number ${numStr}`, insertData);
      const { error } = await supabase
        .from('raffle_numbers')
        .insert(insertData);
      if (error) throw error;
    }
  });
  
  await Promise.all(updatePromises);
}
