import { supabase } from '@/integrations/supabase/client';

export const useNumberStatus = ({ raffleSeller, raffleId, raffleNumbers, debugMode = false, reservationDays = 5, lotteryDate }) => {
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
  };

  return { updateRaffleNumbersStatus };
};
