
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';

export const useParticipantManager = ({ 
  raffleId, 
  debugMode = false, 
  raffleSeller, 
  setValidatedBuyerData 
}: { 
  raffleId: string;
  debugMode?: boolean;
  raffleSeller: any;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo) => void;
}) => {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ParticipantManager - ${context}]:`, data);
    }
  };

  const findExistingParticipant = async (phone: string): Promise<ValidatedBuyerInfo & { id: string } | null> => {
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

  const handleExistingParticipant = async (
    participant: { 
      id: string; 
      name: string; 
      phone?: string;
      cedula?: string;
      direccion?: string;
      sugerencia_producto?: string;
    }, 
    newName?: string, 
    newCedula?: string,
    newPhone?: string
  ): Promise<string> => {
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

  const createNewParticipant = async (phone: string, name?: string, cedula?: string): Promise<string | null> => {
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

  const findOrCreateParticipant = async (phone: string, name?: string, cedula?: string) => {
    try {
      debugLog('findOrCreateParticipant input', { phone, name, cedula, raffle_id: raffleId });
      console.log("🔄 findOrCreateParticipant called with:", { phone, name, cedula });
      
      const existingParticipant = await findExistingParticipant(phone);
      
      if (existingParticipant) {
        console.log("🔄 Using existing participant:", existingParticipant);
        return handleExistingParticipant(
          existingParticipant, 
          name, 
          cedula, 
          phone
        );
      }
      
      console.log("🔄 No existing participant found, creating new one");
      return createNewParticipant(phone, name, cedula);
    } catch (error) {
      console.error('Error in findOrCreateParticipant:', error);
      toast.error('Error al buscar o crear participante: ' + (error.message || 'Error desconocido'));
      return null;
    }
  };

  return { 
    findOrCreateParticipant, 
    findExistingParticipant, 
    createNewParticipant,
    formatPhoneNumber 
  };
};
