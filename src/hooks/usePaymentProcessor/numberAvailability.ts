
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';

interface UseNumberAvailabilityProps {
  raffleNumbers: any[];
  raffleSeller: any;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo | null) => void;
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
   * Check if the provided numbers are available for selection
   */
  const checkNumbersAvailability = async (numbers: string[]): Promise<string[]> => {
    debugLog('checkNumbersAvailability', { numbers });
    
    try {
      const unavailableNumbers: string[] = [];

      // Convert input strings to integers for proper comparison
      const numbersAsInts = numbers.map(num => parseInt(num, 10));
      
      debugLog('checkNumbersAvailability - converted numbers', { numbersAsInts });
      
      // Check availability against the database (latest status)
      const { data: dbNumbers, error } = await supabase
        .from('raffle_numbers')
        .select('number, status')
        .eq('raffle_id', raffleSeller.raffle_id)
        .in('number', numbersAsInts);
      
      if (error) {
        debugLog('checkNumbersAvailability - database error', { error });
        throw error;
      }
      
      debugLog('checkNumbersAvailability - database results', { dbNumbers });
      
      if (dbNumbers && dbNumbers.length > 0) {
        // Check each number in our input against database records
        for (const numStr of numbers) {
          const numInt = parseInt(numStr, 10);
          
          // Find if this number exists in the database
          const dbNumRecord = dbNumbers.find(n => n.number === numInt);
          
          // If the number exists in DB and its status is not available
          if (dbNumRecord && dbNumRecord.status !== 'available' && dbNumRecord.status !== 'reserved') {
            debugLog('checkNumbersAvailability - found unavailable number', { 
              number: numStr, 
              status: dbNumRecord.status 
            });
            unavailableNumbers.push(numStr);
          }
        }
      }

      // Also check against the local raffle numbers state
      if (raffleNumbers && raffleNumbers.length > 0) {
        for (const numStr of numbers) {
          const numInt = parseInt(numStr, 10);
          
          // If this number wasn't already found unavailable in DB check
          if (!unavailableNumbers.includes(numStr)) {
            const localNumber = raffleNumbers.find(n => {
              const currNumInt = typeof n.number === 'string' ? parseInt(n.number, 10) : n.number;
              return currNumInt === numInt;
            });
            
            if (localNumber && 
                localNumber.status !== 'available' && 
                localNumber.status !== 'reserved') {
              debugLog('checkNumbersAvailability - found locally unavailable number', { 
                number: numStr, 
                status: localNumber.status 
              });
              
              // Avoid adding duplicates
              if (!unavailableNumbers.includes(numStr)) {
                unavailableNumbers.push(numStr);
              }
            }
          }
        }
      }

      debugLog('checkNumbersAvailability - result', { unavailableNumbers });
      return unavailableNumbers;
    } catch (error) {
      console.error('Error checking numbers availability:', error);
      throw error;
    }
  };

  return {
    checkNumbersAvailability,
  };
}
