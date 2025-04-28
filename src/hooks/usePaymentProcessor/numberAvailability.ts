
import { supabase } from '@/integrations/supabase/client';

export function useCheckNumberAvailability({
  raffleId,
  sellerId,
  debugMode = false
}) {
  // Ensure we have valid IDs or use defaults
  const effectiveRaffleId = raffleId || "fd6bd3bc-d81f-48a9-be58-8880293a0472";
  const effectiveSellerId = sellerId || "0102030405";
  
  const checkNumbersAvailability = async (numbers: string[]): Promise<string[]> => {
    console.log("usePaymentProcessor: Checking availability of numbers:", numbers);
    console.log("usePaymentProcessor: Using raffleId:", effectiveRaffleId, "sellerId:", effectiveSellerId);
    
    try {
      const { data, error } = await supabase
        .from('raffle_numbers')
        .select('number, status')
        .eq('raffle_id', effectiveRaffleId)
        .in('number', numbers.map(n => parseInt(n)))
        .not('status', 'eq', 'available');
      
      if (error) {
        console.error('usePaymentProcessor: Error checking availability:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // These numbers are not available
        const unavailableNumbers = data.map(item => item.number.toString());
        
        if (debugMode) {
          console.log('usePaymentProcessor: Unavailable numbers:', unavailableNumbers);
        }
        
        return unavailableNumbers;
      }
      
      return []; // All numbers are available
    } catch (error) {
      console.error('usePaymentProcessor: Error checking number availability:', error);
      return [];
    }
  };
  
  return { checkNumbersAvailability };
}
