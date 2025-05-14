
import { supabase } from '@/integrations/supabase/client';

export const useNumberAvailability = ({ 
  raffleNumbers, 
  raffleSeller,
  setValidatedBuyerData,
  debugMode 
}) => {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - NumberAvailability - ${context}]:`, data);
    }
  };

  /**
   * Checks if selected numbers are available for purchase
   * @param numbers Array of numbers to check
   * @returns Array of unavailable numbers
   */
  const checkNumbersAvailability = async (numbers: string[]): Promise<string[]> => {
    debugLog('Checking numbers availability', numbers);
    
    const unavailableNumbers: string[] = [];
    
    for (const numStr of numbers) {
      const numberAsInt = parseInt(numStr, 10); // Convert string to integer for comparison
      const existingNumber = raffleNumbers?.find(n => n.number === numberAsInt);
      
      if (existingNumber) {
        debugLog('Found existing number', {
          number: numStr,
          status: existingNumber.status,
          sellerId: existingNumber.seller_id,
          currentSellerId: raffleSeller?.seller_id
        });
        
        // Check if status is not available or reserved by this seller
        if (existingNumber.status === 'sold' || 
            (existingNumber.status === 'reserved' && existingNumber.seller_id !== raffleSeller?.seller_id)) {
          unavailableNumbers.push(numStr);
        }
      }
    }
    
    debugLog('Unavailable numbers', unavailableNumbers);
    return unavailableNumbers;
  };
  
  /**
   * Checks if any of the selected numbers already have a participant
   * If so, uses that participant's data for the transaction
   * @param numbers Array of numbers to check
   */
  const checkReservedNumbersParticipant = async (numbers: string[]) => {
    debugLog('Checking reserved numbers for participant', numbers);
    
    let participant = null;
    let participantNumbers = null;
    
    // Look for numbers that are reserved by this seller
    const reservedNumbers = raffleNumbers?.filter(n => 
      numbers.includes(n.number.toString()) && 
      n.status === 'reserved' && 
      n.seller_id === raffleSeller?.seller_id &&
      n.participant_id
    );
    
    if (reservedNumbers && reservedNumbers.length > 0) {
      debugLog('Found reserved numbers with participant', reservedNumbers);
      
      // Get the first number's participant
      const participantId = reservedNumbers[0].participant_id;
      
      // Load participant data
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .select('id, name, phone, cedula, direccion, sugerencia_producto')
        .eq('id', participantId)
        .maybeSingle();
      
      if (participantError) {
        console.error('Error fetching participant:', participantError);
      } else if (participantData) {
        participant = participantData;
        participantNumbers = reservedNumbers;
        
        // Set buyer data if participant exists
        setValidatedBuyerData({
          name: participant.name,
          phone: participant.phone,
          cedula: participant.cedula,
          direccion: participant.direccion,
          sugerencia_producto: participant.sugerencia_producto
        });
        
        debugLog('Set validated buyer data from participant', participant);
      }
    } else {
      // If not found in reservation, check if any of these numbers are already sold
      // (shouldn't happen, but just in case)
      const soldNumbers = raffleNumbers?.filter(n => 
        numbers.includes(n.number.toString()) && 
        n.status === 'sold' && 
        n.participant_id
      );
      
      if (soldNumbers && soldNumbers.length > 0) {
        debugLog('Warning: Some of the selected numbers are already sold', soldNumbers);
      }
    }
    
    return { participant, participantNumbers };
  };

  return {
    checkNumbersAvailability,
    checkReservedNumbersParticipant
  };
};
