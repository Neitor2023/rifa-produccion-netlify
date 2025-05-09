
import { findExistingParticipant } from './findExistingParticipant';
import { handleExistingParticipant } from './handleExistingParticipant';
import { createNewParticipant } from './createNewParticipant';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { toast } from 'sonner';

export const useParticipantManager = ({ 
  raffleId, 
  debugMode = false, 
  raffleSeller, 
  setValidatedBuyerData 
}: { 
  raffleId: string;
  debugMode?: boolean;
  raffleSeller: any;
  setValidatedBuyerData?: (data: any) => void;
}) => {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ParticipantManager - ${context}]:`, data);
    }
  };

  const findOrCreateParticipant = async (phone: string, name?: string, cedula?: string) => {
    try {
      debugLog('findOrCreateParticipant input', { phone, name, cedula, raffle_id: raffleId });
      console.log("🔄 findOrCreateParticipant called with:", { phone, name, cedula });
      
      const existingParticipant = await findExistingParticipant({
        phone,
        raffleId,
        setValidatedBuyerData,
        debugLog
      });
      
      if (existingParticipant) {
        console.log("🔄 Using existing participant:", existingParticipant);
        return handleExistingParticipant({
          participant: existingParticipant, 
          newName: name, 
          newCedula: cedula, 
          newPhone: phone,
          setValidatedBuyerData
        });
      }
      
      console.log("🔄 No existing participant found, creating new one");
      return createNewParticipant({
        phone,
        name,
        cedula,
        raffleId,
        raffleSeller,
        setValidatedBuyerData,
        debugLog
      });
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
    createNewParticipant: (phone: string, name?: string, cedula?: string) => createNewParticipant({
      phone,
      name,
      cedula,
      raffleId,
      raffleSeller,
      setValidatedBuyerData,
      debugLog
    }),
    formatPhoneNumber 
  };
};
