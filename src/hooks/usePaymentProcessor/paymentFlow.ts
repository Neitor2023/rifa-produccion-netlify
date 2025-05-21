
import { supabase } from '@/integrations/supabase/client';

export interface ConflictResult {
  success: boolean;
  conflictingNumbers?: string[];
  message?: string;
}

export function usePaymentFlow(
  raffleId: string,
  debugMode: boolean = false
) {
  // Function to verify numbers are not sold by others
  const verifyNumbersNotSoldByOthers = async (numbers: string[]): Promise<ConflictResult> => {
    try {
      if (debugMode) {
        console.log('[DEBUG - verifyNumbersNotSoldByOthers] Checking numbers:', numbers);
      }
      
      const { data, error } = await supabase
        .from('raffle_numbers')
        .select('number, status, seller_id')
        .eq('raffle_id', raffleId)
        .in('number', numbers.map(n => parseInt(n)))
        .not('status', 'eq', 'available');
      
      if (error) throw error;
      
      // Filter out numbers belonging to this seller and with status "reserved"
      const conflictingNumbers = data
        .filter(n => {
          const isReservedByThisSeller = n.status === 'reserved' && 
                                       n.seller_id === n.seller_id;
          return !isReservedByThisSeller;
        })
        .map(n => n.number.toString());
      
      if (conflictingNumbers.length > 0) {
        if (debugMode) {
          console.log('[DEBUG - verifyNumbersNotSoldByOthers] Found conflicts:', conflictingNumbers);
        }
        return { 
          success: false, 
          conflictingNumbers,
          message: 'Algunos números ya no están disponibles'
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error verifying numbers availability:', error);
      return { 
        success: false,
        message: 'Error verificando disponibilidad de números'
      };
    }
  };

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ${context}]:`, data);
    }
  };

  return {
    verifyNumbersNotSoldByOthers,
    debugLog
  };
}
