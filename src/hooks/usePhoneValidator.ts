
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UsePhoneValidatorProps {
  raffleId: string;
  raffleSellerId: string;
  raffleNumbers: any[];
  debugMode?: boolean;
}

export const usePhoneValidator = ({
  raffleId,
  raffleSellerId,
  raffleNumbers,
  debugMode = false
}: UsePhoneValidatorProps) => {
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[PhoneValidation - ${context}]:`, data);
    }
  };

  const validateByPhoneNumber = async (phone: string): Promise<string | null> => {
    const { data: participant, error } = await supabase
      .from('participants')
      .select('id')
      .eq('phone', phone)
      .eq('raffle_id', raffleId)
      .maybeSingle();

    if (error) {
      debugLog('Participant lookup error', error);
      throw new Error('Error al buscar participante');
    }

    return participant?.id || null;
  };

  const validateSelectedNumber = async (number: string, phone: string) => {
    const raffleNumber = raffleNumbers.find(n => 
      n.number === number && 
      n.status === 'reserved' && 
      n.seller_id === raffleSellerId
    );

    if (!raffleNumber) {
      debugLog('Number not found or not reserved by this seller', number);
      throw new Error('Número no encontrado o no reservado por este vendedor');
    }

    if (!raffleNumber.participant_id) {
      debugLog('Number has no participant_id', raffleNumber);
      throw new Error('Este número no tiene un participante asociado');
    }

    const { data: participant, error } = await supabase
      .from('participants')
      .select('phone')
      .eq('id', raffleNumber.participant_id)
      .single();

    if (error) {
      debugLog('Participant lookup error', error);
      throw new Error('Error al buscar participante');
    }

    if (participant.phone !== phone) {
      debugLog('Phone mismatch', { providedPhone: phone, participantPhone: participant.phone });
      throw new Error('El número de teléfono no coincide con el registrado');
    }

    debugLog('Number validation successful');
    toast.success('Validación exitosa');
    return true;
  };

  const validatePhone = async (phoneNumber: string, selectedNumber: string | null): Promise<[string, string | undefined]> => {
    if (!phoneNumber.trim()) {
      setErrorMessage('Ingrese su número de teléfono');
      throw new Error('Ingrese su número de teléfono');
    }

    setIsValidating(true);
    setErrorMessage(null);

    try {
      debugLog('Validation starting with parameters', {
        phoneNumber,
        selectedNumber,
        raffleId,
        raffleSellerId
      });

      const validatedParticipantId = await validateByPhoneNumber(phoneNumber);
      
      if (validatedParticipantId) {
        debugLog('Validation successful, found participant', validatedParticipantId);
        return [selectedNumber || '', validatedParticipantId];
      } else if (selectedNumber) {
        debugLog('No participant found, checking selected number ownership');
        const isValid = await validateSelectedNumber(selectedNumber, phoneNumber);
        if (isValid) {
          return [selectedNumber, undefined];
        }
      }
      
      setErrorMessage('No se pudo validar el número');
      throw new Error('No se pudo validar el número');
    } catch (error: any) {
      debugLog('Validation error', error);
      setErrorMessage(error.message || 'Error al validar el número');
      throw error;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    isValidating,
    errorMessage,
    validatePhone,
    setErrorMessage,
  };
};
