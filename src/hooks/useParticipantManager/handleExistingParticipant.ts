
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';

interface HandleExistingParticipantProps {
  participant: { 
    id: string; 
    name: string; 
    phone?: string;
    email?: string;
    cedula?: string;
    direccion?: string;
    sugerencia_producto?: string;
  };
  newName?: string;
  newCedula?: string;
  newPhone?: string;
  newEmail?: string;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo) => void;
}

export const handleExistingParticipant = async ({
  participant,
  newName,
  newCedula,
  newPhone,
  newEmail,
  setValidatedBuyerData
}: HandleExistingParticipantProps): Promise<string> => {
  console.log("🔄 handleExistingParticipant: Entry point with participant:", participant.id);
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
  
  // Important: Handle email updates
  if (newEmail && newEmail !== participant.email) {
    updateData.email = newEmail;
    console.log("📧 handleExistingParticipant: Updating email to:", newEmail);
  }
  
  if (Object.keys(updateData).length > 0) {
    console.log("📝 handleExistingParticipant: Updating participant data:", updateData);
    const { error } = await supabase
      .from('participants')
      .update(updateData)
      .eq('id', participant.id);
    if (error) {
      console.error('Error updating participant:', error);
    } else {
      console.log("✅ handleExistingParticipant: Participant updated successfully");
      
      // Update the global validatedBuyerData state with the updated participant info
      if (setValidatedBuyerData) {
        const buyerInfo: ValidatedBuyerInfo = {
          id: participant.id,
          name: newName || participant.name,
          phone: newPhone ? formatPhoneNumber(newPhone) : participant.phone || '',
          email: newEmail || participant.email || '', // Important: Include email
          cedula: newCedula || participant.cedula,
          direccion: participant.direccion,
          sugerencia_producto: participant.sugerencia_producto
        };
        
        console.log("🔄 handleExistingParticipant: Setting validatedBuyerData:", buyerInfo);
        setValidatedBuyerData(buyerInfo);
      }
    }
  }
  
  console.log("✅ handleExistingParticipant: Exit with ID:", participant.id);
  return participant.id;
};
