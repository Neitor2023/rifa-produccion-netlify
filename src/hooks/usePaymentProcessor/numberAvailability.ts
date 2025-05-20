
import { ValidatedBuyerInfo } from "@/types/participant";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RaffleNumber } from '@/lib/constants/types';

interface UseNumberAvailabilityProps {
  raffleNumbers?: RaffleNumber[];
  raffleSeller: {
    id?: string;
    seller_id?: string;
  } | null;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo | null) => void;
  debugMode?: boolean;
}

export function useNumberAvailability({
  raffleNumbers = [],
  raffleSeller,
  setValidatedBuyerData,
  debugMode = false,
}: UseNumberAvailabilityProps) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - NumberAvailability - ${context}]:`, data);
    }
  };

  // Enhanced function for checking number availability
  const checkNumbersAvailability = async (numbers: string[]): Promise<string[]> => {
    try {
      // Validar que raffleSeller y raffleNumbers estén definidos
      if (!raffleSeller) {
        console.error("❌ Error: raffleSeller está undefined en checkNumbersAvailability");
        throw new Error("Información del vendedor no disponible");
      }
      
      if (!raffleNumbers || raffleNumbers.length === 0) {
        console.error("❌ Error: raffleNumbers está vacío en checkNumbersAvailability");
        throw new Error("Información de números no disponible");
      }

      debugLog("checkNumbersAvailability-input", { numbers });

      // Convert string numbers to integers for proper comparison
      const numberInts = numbers.map(numStr => parseInt(numStr, 10));
      
      // Filter raffle numbers to find unavailable ones
      const unavailableNumbers: string[] = [];
      
      for (const numStr of numbers) {
        const numInt = parseInt(numStr, 10);
        
        // Find matching number in raffleNumbers
        const matchingNumber = raffleNumbers.find(n => 
          // Compare as integers to avoid string/number comparison issues
          (typeof n.number === 'number' && n.number === numInt) || 
          // Also check string representation (padded)
          (typeof n.number === 'string' && n.number === numStr) ||
          // Check if string representation of the integer matches
          String(n.number) === String(numInt)
        );
        
        // If number exists and status is not 'available'
        if (matchingNumber && matchingNumber.status !== 'available') {
          // If status is 'reserved', check if reserved by this seller
          if (matchingNumber.status === 'reserved') {
            // Only add to unavailable if reserved by different seller
            if (matchingNumber.seller_id !== raffleSeller?.seller_id) {
              unavailableNumbers.push(numStr);
            }
          } else {
            // If sold or any other status, it's unavailable
            unavailableNumbers.push(numStr);
          }
        }
      }
      
      debugLog("checkNumbersAvailability-result", { unavailableNumbers });
      return unavailableNumbers;
    } catch (error) {
      console.error("Error checking number availability:", error);
      toast.error("Error al verificar disponibilidad de números");
      return [];
    }
  };

  return {
    checkNumbersAvailability,
  };
}
