import React, { useState, useEffect } from 'react';
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
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

interface PhoneValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneValidationSuccess: (phone: string, formattedPhone: string) => void;
}

const PhoneValidationModal: React.FC<PhoneValidationModalProps> = ({
  isOpen,
  onClose,
  onPhoneValidationSuccess
}) => {
  const [phone, setPhone] = useState('');
  const [validation, setValidation] = useState({
    isValid: false,
    message: '',
    formattedNumber: ''
  });

  useEffect(() => {
    if (phone.length > 0) {
      try {
        // Assume Mexican phone number if no country code is provided
        const phoneWithCountry = phone.startsWith('+') ? phone : `+52${phone}`;
        const isValid = isValidPhoneNumber(phoneWithCountry);
        
        if (isValid) {
          const parsedPhone = parsePhoneNumber(phoneWithCountry);
          setValidation({
            isValid: true,
            message: 'Número válido',
            formattedNumber: parsedPhone.formatInternational()
          });
        } else {
          setValidation({
            isValid: false,
            message: 'Número inválido',
            formattedNumber: ''
          });
        }
      } catch (error) {
        setValidation({
          isValid: false,
          message: 'Formato incorrecto',
          formattedNumber: ''
        });
      }
    } else {
      setValidation({
        isValid: false,
        message: '',
        formattedNumber: ''
      });
    }
  }, [phone]);

  const handleNumberSubmit = () => {
    if (validation.isValid) {
      onPhoneValidationSuccess(formattedPhone, validation.formattedNumber);
      onClose();
    } else {
      setValidation({
        isValid: false,
        message: "Por favor ingrese un número válido",
        formattedNumber: ""
      });
    }
  };

  // Format the phone for display
  const formattedPhone = phone.startsWith('+') ? phone : `+52${phone}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Validar número de teléfono</DialogTitle>
          <DialogDescription>
            Ingrese su número de teléfono para continuar
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Número de teléfono
            </label>
            <Input
              id="phone"
              placeholder="+52 123 456 7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {validation.message && (
              <p className={`text-sm ${validation.isValid ? 'text-green-600' : 'text-red-500'}`}>
                {validation.message}
              </p>
            )}
            {validation.isValid && (
              <p className="text-sm text-gray-500">
                Formato internacional: {validation.formattedNumber}
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleNumberSubmit}
            disabled={!validation.isValid}
          >
            Validar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneValidationModal;
