
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
  console.log("🔍 findExistingParticipant: Entry point with phone", phone);
  const formattedPhone = formatPhoneNumber(phone);
  debugLog('Finding participant with formatted phone', formattedPhone);
  
  const { data, error } = await supabase
    .from('participants')
    .select('id, name, phone, email, cedula, direccion, sugerencia_producto')
    .eq('phone', formattedPhone)
    .eq('raffle_id', raffleId)
    .maybeSingle();
    
  if (error) {
    console.error('Error searching for participant:', error);
    return null;
  }
  
  if (data) {
    debugLog('Found existing participant', data);
    console.log("✅ findExistingParticipant: Found existing participant:", data);
    
    // Update the global validatedBuyerData state if the setter is provided
    if (setValidatedBuyerData) {
      const buyerInfo: ValidatedBuyerInfo = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email, // Important: Include email
        cedula: data.cedula,
        direccion: data.direccion,
        sugerencia_producto: data.sugerencia_producto
      };
      
      console.log("🔄 findExistingParticipant: Setting validatedBuyerData:", buyerInfo);
      setValidatedBuyerData(buyerInfo);
    }
    
    return data as ValidatedBuyerInfo & { id: string };
  }
  
  console.log("❌ findExistingParticipant: No participant found with phone:", formattedPhone);
  return null;
};
