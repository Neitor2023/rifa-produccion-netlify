
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';

interface FindExistingParticipantProps {
  phone: string;
  raffleId: string;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo) => void;
  debugLog: (context: string, data: any) => void;
}

export const findExistingParticipant = async ({
  phone,
  raffleId,
  setValidatedBuyerData,
  debugLog
}: FindExistingParticipantProps): Promise<ValidatedBuyerInfo & { id: string } | null> => {
  const formattedPhone = formatPhoneNumber(phone);
  debugLog('Finding participant with formatted phone', formattedPhone);
  console.log("🔍 Looking for participant with formatted phone:", formattedPhone);
  
  const { data, error } = await supabase
    .from('participants')
    .select('id, name, phone, cedula, direccion, sugerencia_producto')
    .eq('phone', formattedPhone)
    .eq('raffle_id', raffleId)
    .maybeSingle();
    
  if (error) {
    console.error('Error searching for participant:', error);
    return null;
  }
  
  if (data) {
    debugLog('Found existing participant', data);
    console.log("✅ Found existing participant:", data);
    
    // Update the global validatedBuyerData state if the setter is provided
    if (setValidatedBuyerData) {
      const buyerInfo: ValidatedBuyerInfo = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        cedula: data.cedula,
        direccion: data.direccion,
        sugerencia_producto: data.sugerencia_producto
      };
      
      console.log("🔄 Setting validatedBuyerData in findExistingParticipant:", buyerInfo);
      setValidatedBuyerData(buyerInfo);
    }
    
    return data as ValidatedBuyerInfo & { id: string };
  }
  
  console.log("❌ No participant found with phone:", formattedPhone);
  return null;
};
