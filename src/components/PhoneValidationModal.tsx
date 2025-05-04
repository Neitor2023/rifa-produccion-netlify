
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';

interface PhoneValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidationSuccess: (validatedNumber: string, participantId: string, buyerInfo?: ValidatedBuyerInfo) => void;
  selectedNumber?: string | null;
  raffleNumbers?: any[];
  raffleSellerId: string;
  raffleId: string;
  debugMode?: boolean;
}

const PhoneValidationModal: React.FC<PhoneValidationModalProps> = ({
  isOpen,
  onClose,
  onValidationSuccess,
  selectedNumber,
  raffleNumbers,
  raffleSellerId,
  raffleId,
  debugMode = false
}) => {
  const [phone, setPhone] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhone('');
      setValidationError(null);
    }
  }, [isOpen]);

  const handleValidate = async () => {
    if (!phone) {
      setValidationError('Por favor ingrese un número de teléfono');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      if (debugMode) {
        console.log('PhoneValidationModal: Validating phone', formattedPhone);
        console.log('PhoneValidationModal: Selected number', selectedNumber);
        console.log('PhoneValidationModal: Raffle ID', raffleId);
      }

      // First, check if the phone number is associated with the selected number
      const { data: numberData, error: numberError } = await supabase
        .from('raffle_numbers')
        .select('participant_id, participant_phone')
        .eq('number', selectedNumber)
        .eq('raffle_id', raffleId)
        .eq('status', 'reserved')
        .maybeSingle();

      if (numberError) {
        console.error('Error validating number:', numberError);
        setValidationError('Error al validar el número');
        setIsValidating(false);
        return;
      }

      if (!numberData) {
        setValidationError('Número no encontrado o no está reservado');
        setIsValidating(false);
        return;
      }

      // Now get the participant data
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .select('id, name, phone, email, cedula, direccion, sugerencia_producto')
        .eq('id', numberData.participant_id)
        .single();

      if (participantError) {
        console.error('Error getting participant data:', participantError);
        setValidationError('Error al obtener datos del participante');
        setIsValidating(false);
        return;
      }

      const formattedParticipantPhone = formatPhoneNumber(participantData.phone);
      const formattedInputPhone = formatPhoneNumber(phone);

      if (formattedParticipantPhone !== formattedInputPhone) {
        setValidationError('El teléfono no coincide con el registrado para este número');
        setIsValidating(false);
        return;
      }

      // Phone matches, proceed with validation success
      const buyerInfo: ValidatedBuyerInfo = {
        id: participantData.id,
        name: participantData.name,
        phone: participantData.phone,
        email: participantData.email,
        cedula: participantData.cedula,
        direccion: participantData.direccion,
        sugerencia_producto: participantData.sugerencia_producto
      };

      if (debugMode) {
        console.log('PhoneValidationModal: Validation successful', {
          selectedNumber,
          participantId: participantData.id,
          buyerInfo
        });
      }

      onValidationSuccess(selectedNumber || '', participantData.id, buyerInfo);
      toast.success('Validación exitosa');
    } catch (error) {
      console.error('Error in phone validation:', error);
      setValidationError('Error en la validación');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Validar Número Reservado</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Teléfono
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ingrese el teléfono"
              className="col-span-3"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {validationError && (
            <div className="text-red-500 text-sm mt-1">{validationError}</div>
          )}
          <div className="text-sm text-gray-500">
            Ingrese el número de teléfono asociado con la reserva para validar.
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleValidate} disabled={isValidating}>
            {isValidating ? 'Validando...' : 'Validar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneValidationModal;
