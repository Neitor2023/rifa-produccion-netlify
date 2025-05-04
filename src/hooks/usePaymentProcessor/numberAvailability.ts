
import { supabase } from '@/integrations/supabase/client';

// Valid UUID regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Helper to validate and provide fallback for UUIDs
const ensureValidUUID = (id: string | null | undefined, fallback: string): string => {
  if (id && UUID_PATTERN.test(id)) {
    return id;
  }
  console.warn(`Invalid UUID detected in numberAvailability: "${id}", using fallback value instead`);
  return fallback;
};

export function useCheckNumberAvailability({
  raffleId,
  sellerId,
  debugMode = false
}) {
  // Ensure we have valid UUIDs or use defaults
  const effectiveRaffleId = ensureValidUUID(
    raffleId,
    "fd6bd3bc-d81f-48a9-be58-8880293a0472"
  );
  
  const effectiveSellerId = ensureValidUUID(
    sellerId,
    "76c5b100-1530-458b-84d6-29fae68cd5d2"
  );
  
  const checkNumbersAvailability = async (numbers: string[]): Promise<string[]> => {
    console.log("🔍 useCheckNumberAvailability: Checking availability of numbers:", numbers);
    console.log("🔍 useCheckNumberAvailability: Using validated IDs:", {
      raffleId: effectiveRaffleId, 
      sellerId: effectiveSellerId
    });
    
    try {
      const { data, error } = await supabase
        .from('raffle_numbers')
        .select('number, status')
        .eq('raffle_id', effectiveRaffleId)
        .in('number', numbers.map(n => parseInt(n)))
        .not('status', 'eq', 'available');
      
      if (error) {
        console.error('❌ useCheckNumberAvailability: Error checking availability:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // These numbers are not available
        const unavailableNumbers = data.map(item => item.number.toString().padStart(2, '0'));
        
        if (debugMode) {
          console.log('🔍 useCheckNumberAvailability: Unavailable numbers:', unavailableNumbers);
        }
        
        return unavailableNumbers;
      }
      
      return []; // All numbers are available
    } catch (error) {
      console.error('❌ useCheckNumberAvailability: Error checking number availability:', error);
      return [];
    }
  };
  
  return { checkNumbersAvailability };
}
