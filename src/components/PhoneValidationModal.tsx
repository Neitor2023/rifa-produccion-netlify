// 💡 Forzar recompilación: ajuste menor
// Modificación mínima para forzar recompilación

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

interface PhoneValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate: (validatedNumber: string, participantId?: string) => void;
  selectedNumber: string | null;
  raffleNumbers: any[];
  raffleSellerId: string;
  raffleId: string;
  debugMode?: boolean;
}

const PhoneValidationModal: React.FC<PhoneValidationModalProps> = ({
  isOpen,
  onClose,
  onValidate,
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
      debugLog('Validando número con:', {
        phoneNumber,
        selectedNumber
      });

      const participantId = await validateByPhoneNumber(phoneNumber);

      if (participantId) {
        debugLog('Participante encontrado:', participantId);
        onValidate(selectedNumber || '', participantId); // ✅ 2 argumentos
      } else if (selectedNumber) {
        debugLog('Buscando coincidencia con número reservado...');
        const valid = await validateSelectedNumber(selectedNumber, phoneNumber);
        if (valid) {
          onValidate(selectedNumber, undefined); // ✅ 2 argumentos
        }
      } else {
        setErrorMessage('No se pudo validar el número');
      }
    } catch (error: any) {
      debugLog('Error durante validación:', error);
      setErrorMessage(error.message || 'Error al validar el número');
    } finally {
      setIsValidating(false);
    }
  };

  const validateByPhoneNumber = async (phone: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('participants')
      .select('id')
      .eq('phone', phone)
      .eq('raffle_id', raffleId)
      .maybeSingle();

    if (error) throw new Error('Error al buscar participante');

    return data?.id || null;
  };

  const validateSelectedNumber = async (number: string, phone: string): Promise<boolean> => {
    const numberData = raffleNumbers.find(
      n => n.number === number && n.status === 'reserved' && n.seller_id === raffleSellerId
    );

    if (!numberData) {
      throw new Error('Número no encontrado o no reservado');
    }

    if (!numberData.participant_id) {
      throw new Error('El número no tiene participante asociado');
    }

    const { data: participant, error } = await supabase
      .from('participants')
      .select('phone')
      .eq('id', numberData.participant_id)
      .single();

    if (error) throw new Error('Error al buscar participante');

    if (participant.phone !== phone) {
      throw new Error('El número de teléfono no coincide con el registrado');
    }

    toast.success('Validación exitosa');
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValidation();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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

        <DialogFooter>
          <Button
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
