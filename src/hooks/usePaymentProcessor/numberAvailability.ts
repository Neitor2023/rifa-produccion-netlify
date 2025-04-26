
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ValidatedBuyerInfo } from '@/types/participant';

interface UseNumberAvailabilityProps {
  raffleNumbers: any[];
  raffleSeller: any;
  setValidatedBuyerData: (data: ValidatedBuyerInfo) => void;
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
  
  const checkNumbersAvailability = async (numbers: string[]) => {
    if (!raffleNumbers || !numbers.length) return true;
    
    const unavailableNumbers = numbers.filter(num => {
      const raffleNumber = raffleNumbers.find(n => n.number === num);
      return raffleNumber && ['sold', 'reserved'].includes(raffleNumber.status);
    });
    
    if (unavailableNumbers.length > 0) {
      toast.error(`Los números ${unavailableNumbers.join(', ')} ya no están disponibles`);
      return false;
    }
    
    return true;
  };

  // Update function signature to only expect one argument
  const checkReservedNumbersParticipant = async (numbers: string[]) => {
    if (!numbers || !numbers.length) return;
    
    // First, get all the participant IDs for these reserved numbers
    const participantIds = new Set<string>();
    
    for (const num of numbers) {
      const raffleNumber = raffleNumbers.find(n => 
        n.number === num && 
        n.status === 'reserved'
      );
      
      if (raffleNumber?.participant_id) {
        participantIds.add(raffleNumber.participant_id);
      }
    }
    
    debugLog('checkReservedNumbersParticipant - participants found', Array.from(participantIds));
    
    if (participantIds.size !== 1) {
      toast.error('Error: Los números seleccionados pertenecen a diferentes participantes');
      throw new Error('Numbers belong to different participants');
    }
    
    // Get the participant data
    const participantId = Array.from(participantIds)[0];
    
    const { data: participantData, error } = await supabase
      .from('participants')
      .select('id, name, phone, cedula, direccion, sugerencia_producto')
      .eq('id', participantId)
      .single();
    
    if (error) {
      debugLog('checkReservedNumbersParticipant - error fetching participant', error);
      throw error;
    }
    
    if (participantData) {
      debugLog('checkReservedNumbersParticipant - participant data', participantData);
      
      setValidatedBuyerData({
        id: participantData.id,
        name: participantData.name,
        phone: participantData.phone,
        cedula: participantData.cedula,
        direccion: participantData.direccion,
        sugerencia_producto: participantData.sugerencia_producto
      });
      
      return participantData;
    }
    
    return null;
  };

  return { 
    checkNumbersAvailability,
    checkReservedNumbersParticipant
  };
}
