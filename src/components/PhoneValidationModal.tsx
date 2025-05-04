
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoaderCircle, PhoneCall, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';

interface PhoneValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneValidationSuccess: (
    validatedNumber: string,
    participantId: string,
    buyerInfo?: ValidatedBuyerInfo
  ) => void;
  selectedNumber: string | null;
  raffleNumbers: any[];
  raffleSellerId: string;
  raffleId: string;
  debugMode?: boolean;
}

const PhoneValidationModal: React.FC<PhoneValidationModalProps> = ({
  isOpen,
  onClose,
  onPhoneValidationSuccess,
  selectedNumber,
  raffleNumbers,
  raffleSellerId,
  raffleId,
  debugMode = false
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[PhoneValidation - ${context}]:`, data);
    }
  };

  const handleValidation = async () => {
    if (!phoneNumber.trim()) {
      setErrorMessage('Ingrese su número de teléfono');
      return;
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

      // Query Supabase to find a participant with the provided phone number
      const { data: participants, error } = await supabase
        .from('participants')
        .select('*')
        .eq('phone', phoneNumber)
        .eq('raffle_id', raffleId);

      if (error) {
        debugLog('Participant lookup error', error);
        throw new Error('Error al buscar participante');
      }

      if (participants && participants.length > 0) {
        // If a participant is found, extract the participant ID and buyer information
        const participant = participants[0];
        const participantId = participant.id;

        // Construct the buyer information object
        const buyerInfo: ValidatedBuyerInfo = {
          id: participant.id,
          name: participant.name,
          phone: participant.phone,
          cedula: participant.cedula || '',
          direccion: participant.direccion || '',
          sugerencia_producto: participant.sugerencia_producto || '',
          email: participant.email || ''
        };

        debugLog('Participant found', {
          participantId,
          buyerInfo
        });

        toast.success('Validación exitosa');
        onPhoneValidationSuccess(selectedNumber || '', participantId, buyerInfo);
      } else {
        // If no participant is found with the phone number, check if there's a specific selected number
        if (selectedNumber) {
          await validateSelectedNumber(selectedNumber, phoneNumber);
        } else {
          setErrorMessage('No se encontró ningún participante con este número de teléfono');
        }
      }
    } catch (error: any) {
      debugLog('Validation error', error);
      setErrorMessage(error.message || 'Error al validar el número');
    } finally {
      setIsValidating(false);
    }
  };

  const validateSelectedNumber = async (number: string, phone: string) => {
    // Get the raffle number to check its participant
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

    // Check if the phone matches the participant
    const { data: participant, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', raffleNumber.participant_id)
      .single();

    if (error) {
      debugLog('Participant lookup error', error);
      throw new Error('Error al buscar participante');
    }

    if (participant.phone !== phone) {
      debugLog('Phone mismatch', { 
        providedPhone: phone, 
        participantPhone: participant.phone 
      });
      throw new Error('El número de teléfono no coincide con el registrado');
    }

    // Construct the buyer information object
    const buyerInfo: ValidatedBuyerInfo = {
      id: participant.id,
      name: participant.name,
      phone: participant.phone,
      cedula: participant.cedula || '',
      direccion: participant.direccion || '',
      sugerencia_producto: participant.sugerencia_producto || '',
      email: participant.email || ''
    };

    // If we reach here, validation was successful
    debugLog('Number validation successful');
    toast.success('Validación exitosa');
    onPhoneValidationSuccess(number, participant.id, buyerInfo);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValidation();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Validación de Número
          </DialogTitle>
          <DialogDescription className="text-center">
            Ingrese el número de teléfono usado para reservar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Número de teléfono"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isValidating}
              className="text-center"
            />

            {errorMessage && (
              <div className="flex items-center text-red-500 text-sm mt-2">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isValidating}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          
          <Button 
            onClick={handleValidation}
            disabled={isValidating}
            className="bg-rifa-purple hover:bg-rifa-darkPurple w-full sm:w-auto"
          >
            {isValidating ? (
              <>
                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <PhoneCall className="h-4 w-4 mr-2" />
                Validar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneValidationModal;
