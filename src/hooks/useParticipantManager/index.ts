
import { findExistingParticipant } from './findExistingParticipant';
import { handleExistingParticipant } from './handleExistingParticipant';
import { createNewParticipant } from './createNewParticipant';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { toast } from 'sonner';
import { ValidatedBuyerInfo } from '@/types/participant';

interface UseParticipantManagerProps {
  raffleId: string;
  debugMode?: boolean;
  raffleSeller: any;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo) => void;
}

export const useParticipantManager = ({ 
  raffleId, 
  debugMode = false, 
  raffleSeller, 
  setValidatedBuyerData 
}: UseParticipantManagerProps) => {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ParticipantManager - ${context}]:`, data);
    }
  };

  const findOrCreateParticipant = async (phone: string, name?: string, cedula?: string, email?: string) => {
    try {
      console.log("🔄 useParticipantManager: findOrCreateParticipant entry", { phone, name, cedula, email });
      debugLog('findOrCreateParticipant input', { phone, name, cedula, email, raffle_id: raffleId });
      
      const existingParticipant = await findExistingParticipant({
        phone,
        raffleId,
        setValidatedBuyerData,
        debugLog
      });
      
      if (existingParticipant) {
        console.log("🔄 useParticipantManager: Using existing participant:", existingParticipant);
        const participantId = await handleExistingParticipant({
          participant: existingParticipant, 
          newName: name, 
          newCedula: cedula, 
          newPhone: phone,
          newEmail: email,
          setValidatedBuyerData
        });
        console.log("✅ useParticipantManager: findOrCreateParticipant exit with existing participant ID:", participantId);
        return participantId;
      }
      
      console.log("🔄 useParticipantManager: No existing participant found, creating new one");
      const newParticipantId = await createNewParticipant({
        phone,
        name,
        cedula,
        email,
        raffleId,
        raffleSeller,
        setValidatedBuyerData,
        debugLog
      });
      
      console.log("✅ useParticipantManager: findOrCreateParticipant exit with new participant ID:", newParticipantId);
      return newParticipantId;
    } catch (error: any) {
      console.error('Error in findOrCreateParticipant:', error);
      toast.error('Error al buscar o crear participante: ' + (error.message || 'Error desconocido'));
      return null;
    }
  };

  return { 
    findOrCreateParticipant, 
    findExistingParticipant: (phone: string) => findExistingParticipant({
      phone,
      raffleId,
      setValidatedBuyerData,
      debugLog
    }), 
    createNewParticipant: (phone: string, name?: string, cedula?: string, email?: string) => createNewParticipant({
      phone,
      name,
      cedula,
      email,
      raffleId,
      raffleSeller,
      setValidatedBuyerData,
      debugLog
    }),
    formatPhoneNumber 
  };
};
