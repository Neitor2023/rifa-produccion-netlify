
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';

interface UseNumberAvailabilityProps {
  raffleNumbers: any[];
  raffleSeller: any;
  setValidatedBuyerData: (data: ValidatedBuyerInfo | null) => void;
  debugMode?: boolean;
}

export function useNumberAvailability({ 
  raffleNumbers, 
  raffleSeller, 
  setValidatedBuyerData,
  debugMode = false 
}: UseNumberAvailabilityProps) {
  
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - NumberAvailability - ${context}]:`, data);
    }
  };

  /**
   * Checks if numbers are available for purchase
   * @param numbers Array of number strings to check
   * @returns Array of unavailable numbers
   */
  const checkNumbersAvailability = async (numbers: string[]): Promise<string[]> => {
    return numbers.filter(numStr => {
      const existingNumber = raffleNumbers?.find(n => n.number === numStr);
      return existingNumber && 
             existingNumber.status !== 'available' && 
             (existingNumber.status !== 'reserved' || existingNumber.seller_id !== raffleSeller?.seller_id);
    });
  };
  
  /**
  * Comprueba si los números reservados tienen datos de participantes existentes
  * y establece los datos validados del comprador si están disponibles
  */
  const checkReservedNumbersParticipant = async (numbers: string[]) => {
    try {
      // First check for direct participant data in raffle_numbers
      const reservedNumbers = numbers.filter(numStr => {
        const existingNumber = raffleNumbers?.find(n => n.number === numStr);
        return existingNumber && existingNumber.status === 'reserved';
      });
      
      if (reservedNumbers.length > 0) {
        const numStr = reservedNumbers[0];
        const existingNumber = raffleNumbers?.find(n => n.number === numStr);
        
        if (existingNumber) {
          // Try to get data directly from raffle_numbers first
          if (existingNumber.participant_name && existingNumber.participant_phone) {
            setValidatedBuyerData({
              name: existingNumber.participant_name,
              phone: existingNumber.participant_phone,
              cedula: existingNumber.participant_cedula || "",
            });
            debugLog('Set buyer data from raffle_numbers', {
              name: existingNumber.participant_name,
              phone: existingNumber.participant_phone,
              cedula: existingNumber.participant_cedula
            });
            return;
          }
          
          // Fallback to getting data from participants table if participant_id exists
          if (existingNumber.participant_id) {
            await fetchParticipantForReservedNumber(numStr);
            return;
          }
        }
      }
      
      // If we get here, no participant data was found
      setValidatedBuyerData(null);
      
    } catch (error) {
      console.error('Error checking participant for reserved numbers:', error);
      // Don't throw here as we want to proceed with payment even if this fails
    }
  };
  
  /**
   * Fetches participant data for a reserved number
   * @param numStr The reserved number string
   */
  const fetchParticipantForReservedNumber = async (numStr: string) => {
    const existingNumber = raffleNumbers?.find(n => n.number === numStr);
    
    if (existingNumber && existingNumber.participant_id) {
      // Obtain participant information
      const { data: participant, error } = await supabase
        .from('participants')
        .select('name, phone, cedula, direccion, sugerencia_producto')
        .eq('id', existingNumber.participant_id)
        .single();
      
      if (error) throw error;
      
      if (participant) {
        // Set validated buyer data
        setValidatedBuyerData({
          name: participant.name,
          phone: participant.phone,
          cedula: participant.cedula || "",
          direccion: participant.direccion || "",
          sugerencia_producto: participant.sugerencia_producto || "",
        });
        
        debugLog('Set validated buyer data from participants table', participant);
      }
    }
  };

  return {
    checkNumbersAvailability,
    checkReservedNumbersParticipant
  };
}
