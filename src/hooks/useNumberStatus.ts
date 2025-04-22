
import { supabase } from '@/integrations/supabase/client';

export const useNumberStatus = ({ raffleSeller, raffleId, raffleNumbers, debugMode = false }) => {
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
        updateData.reservation_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
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
