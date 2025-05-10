
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';

interface HandleExistingParticipantProps {
  participant: { 
    id: string; 
    name: string; 
    phone?: string;
    cedula?: string;
    direccion?: string;
    sugerencia_producto?: string;
  };
  newName?: string;
  newCedula?: string;
  newPhone?: string;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo) => void;
}

export const handleExistingParticipant = async ({
  participant,
  newName,
  newCedula,
  newPhone,
  setValidatedBuyerData
}: HandleExistingParticipantProps): Promise<string> => {
  const updateData: any = {};
  
  if (newName && newName !== participant.name) {
    updateData.name = newName;
  }
  
  if (newCedula && newCedula !== participant.cedula) {
    updateData.cedula = newCedula;
  }

  if (newPhone) {
    const formattedPhone = formatPhoneNumber(newPhone);
    if (formattedPhone !== participant.phone) {
      updateData.phone = formattedPhone;
    }
  }
  
  if (Object.keys(updateData).length > 0) {
    console.log("📝 Updating participant data:", updateData);
    const { error } = await supabase
      .from('participants')
      .update(updateData)
      .eq('id', participant.id);
    if (error) {
      console.error('Error updating participant:', error);
    } else {
      console.log("✅ Participant updated successfully");
      
      // Update the global validatedBuyerData state with the updated participant info
      if (setValidatedBuyerData) {
        const buyerInfo: ValidatedBuyerInfo = {
          id: participant.id,
          name: newName || participant.name,
          phone: newPhone ? formatPhoneNumber(newPhone) : participant.phone,
          cedula: newCedula || participant.cedula,
          direccion: participant.direccion,
          sugerencia_producto: participant.sugerencia_producto
        };
        
        console.log("🔄 Setting validatedBuyerData in handleExistingParticipant:", buyerInfo);
        setValidatedBuyerData(buyerInfo);
      }
    }
  }
  
  return participant.id;
};
