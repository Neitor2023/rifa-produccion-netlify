
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';

export async function validateExistingBuyer(
  phone: string,
  raffleId: string
): Promise<ValidatedBuyerInfo | null> {
  const formattedPhone = formatPhoneNumber(phone);
  
  console.log("🔍 Validating buyer with phone:", formattedPhone);
  
  const { data, error } = await supabase
    .from('participants')
    .select('id, name, phone, cedula, direccion, sugerencia_producto')
    .eq('phone', formattedPhone)
    .eq('raffle_id', raffleId)
    .maybeSingle();
    
  if (error) {
    console.error('Error validating buyer:', error);
    return null;
  }
  
  if (data) {
    console.log("✅ Found existing buyer:", data);
    return data as ValidatedBuyerInfo;
  }
  
  return null;
}
