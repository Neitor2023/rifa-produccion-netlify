
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
      // Verifique si estamos procesando un número reservado con un participant_id existente
      const reservedNumbers = numbers.filter(numStr => {
        const existingNumber = raffleNumbers?.find(n => n.number === numStr);
        return existingNumber && existingNumber.status === 'reserved' && existingNumber.participant_id;
      });
      
      if (reservedNumbers.length > 0) {
        await fetchParticipantForReservedNumber(reservedNumbers[0]);
      } else {
        // Restablecer los datos del comprador validado si no hay números reservados
        setValidatedBuyerData(null);
      }
    } catch (error) {
      console.error('Error checking participant for reserved numbers:', error);
      // No lo tires aquí, ya que queremos proceder con el pago incluso si esto falla
    }
  };
  
  /**
   * Fetches participant data for a reserved number
   * @param numStr The reserved number string
   */
  const fetchParticipantForReservedNumber = async (numStr: string) => {
    const existingNumber = raffleNumbers?.find(n => n.number === numStr);
    
    if (existingNumber && existingNumber.participant_id) {
      // Obtener información del participante
      const { data: participant, error } = await supabase
        .from('participants')
        .select('name, phone, cedula')
        .eq('id', existingNumber.participant_id)
        .single();
      
      if (error) throw error;
      
      if (participant) {
        // Establecer datos de comprador validados
        setValidatedBuyerData({
          name: participant.name,
          phone: participant.phone,
          cedula: participant.cedula,
        });
        
        debugLog('Set validated buyer data', participant);
      }
    }
  };

  return {
    checkNumbersAvailability,
    checkReservedNumbersParticipant
  };
}
