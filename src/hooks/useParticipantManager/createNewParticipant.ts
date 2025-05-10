
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { toast } from 'sonner';

interface CreateNewParticipantProps {
  phone: string;
  name?: string;
  cedula?: string;
  email?: string;
  raffleId: string;
  raffleSeller: any;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo) => void;
  debugLog: (context: string, data: any) => void;
}

export const createNewParticipant = async ({
  phone,
  name,
  cedula,
  email,
  raffleId,
  raffleSeller,
  setValidatedBuyerData,
  debugLog
}: CreateNewParticipantProps): Promise<string | null> => {
  console.log("🆕 createNewParticipant: Entry point", { phone, name, cedula, email });
  if (!name) return null;
  
  const formattedPhone = formatPhoneNumber(phone);
  debugLog('Creating new participant', { 
    name, 
    formattedPhone, 
    cedula,
    email,
    raffle_id: raffleId, 
    seller_id: raffleSeller?.seller_id 
  });
  
  const participantData = {
    name,
    phone: formattedPhone,
    email: email || '', // Important: Ensure email is stored
    cedula: cedula || null,
    raffle_id: raffleId,
    seller_id: raffleSeller?.seller_id
  };
  
  console.log("📋 createNewParticipant: Inserting new participant:", participantData);
  
  const { data, error } = await supabase
    .from('participants')
    .insert(participantData)
    .select('id, name, phone, email, cedula')
    .single();
    
  if (error) {
    toast.error('Error al crear participante: ' + error.message);
    console.error("❌ createNewParticipant: Error creating participant:", error);
    return null;
  }
  
  debugLog('New participant created with ID', data?.id);
  console.log("✅ createNewParticipant: New participant created with ID:", data?.id);
  
  // Update the global validatedBuyerData state with the new participant
  if (data && setValidatedBuyerData) {
    const buyerInfo: ValidatedBuyerInfo = {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email, // Important: Include email
      cedula: data.cedula
    };
    
    console.log("🔄 createNewParticipant: Setting validatedBuyerData:", buyerInfo);
    setValidatedBuyerData(buyerInfo);
  }
  
  console.log("✅ createNewParticipant: Exit with ID:", data?.id);
  return data?.id || null;
};
