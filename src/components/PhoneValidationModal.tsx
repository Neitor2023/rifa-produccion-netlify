
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
import { usePhoneValidator } from '@/hooks/usePhoneValidator';

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
  const { 
    isValidating, 
    errorMessage, 
    validatePhone, 
    setErrorMessage 
  } = usePhoneValidator({
    raffleId,
    raffleSellerId,
    raffleNumbers,
    debugMode
  });

  const handleValidation = async () => {
    try {
      const [validatedNumber, participantId] = await validatePhone(phoneNumber, selectedNumber);
      onValidate(validatedNumber, participantId);
    } catch (error) {
      // Error is already handled in the hook
    }
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
