
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { toast } from 'sonner';

interface CreateNewParticipantProps {
  phone: string;
  name?: string;
  cedula?: string;
  raffleId: string;
  raffleSeller: any;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo) => void;
  debugLog: (context: string, data: any) => void;
}

export const createNewParticipant = async ({
  phone,
  name,
  cedula,
  raffleId,
  raffleSeller,
  setValidatedBuyerData,
  debugLog
}: CreateNewParticipantProps): Promise<string | null> => {
  if (!name) return null;
  
  const formattedPhone = formatPhoneNumber(phone);
  debugLog('Creating new participant', { 
    name, 
    formattedPhone, 
    cedula, 
    raffle_id: raffleId, 
    seller_id: raffleSeller?.seller_id 
  });
  
  console.log("🆕 Creating new participant:", { 
    name, 
    formattedPhone, 
    cedula, 
    raffle_id: raffleId
  });
  
  const { data, error } = await supabase
    .from('participants')
    .insert({
      name,
      phone: formattedPhone,
      email: '',
      cedula: cedula || null,
      raffle_id: raffleId,
      seller_id: raffleSeller?.seller_id
      // nota field is removed as per requirements
    })
    .select('id, name, phone, cedula')
    .single();
    
  if (error) {
    toast.error('Error al crear participante: ' + error.message);
    console.error("❌ Error creating participant:", error);
    return null;
  }
  
  debugLog('New participant created with ID', data?.id);
  console.log("✅ New participant created with ID:", data?.id);
  
  // Update the global validatedBuyerData state with the new participant
  if (data && setValidatedBuyerData) {
    const buyerInfo: ValidatedBuyerInfo = {
      id: data.id,
      name: data.name,
      phone: data.phone,
      cedula: data.cedula
    };
    
    console.log("🔄 Setting validatedBuyerData in createNewParticipant:", buyerInfo);
    setValidatedBuyerData(buyerInfo);
  }
  
  return data?.id || null;
};
