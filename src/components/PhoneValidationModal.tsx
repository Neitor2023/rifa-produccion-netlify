
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ValidationMessage from './phone-validation/ValidationMessage';
import PhoneInputField from './phone-validation/PhoneInputField';
import ModalFooter from './phone-validation/ModalFooter';

interface PhoneValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneValidationSuccess: (phone: string, formattedPhone: string) => void;
  selectedNumber?: string;
  raffleNumbers?: any[];
  raffleSellerId?: string;
  raffleId?: string;
  debugMode?: boolean;
}

const PhoneValidationModal: React.FC<PhoneValidationModalProps> = ({
  isOpen,
  onClose,
  onPhoneValidationSuccess,
  debugMode = false
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
        let cleanedPhone = phone;
        if (cleanedPhone.startsWith('0')) {
          cleanedPhone = cleanedPhone.slice(1);
        }
        
        const phoneWithCountry = phone.startsWith('+') ? phone : `+593${cleanedPhone}`;
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

  const handleNumberSubmit = async () => {
    if (validation.isValid) {
      let cleanedPhone2 = phone;
      if (cleanedPhone2.startsWith('0')) {
        cleanedPhone2 = cleanedPhone2.slice(1);
      }      
      const phoneWithCountry = phone.startsWith('+') ? phone : `+593${cleanedPhone2}`;
      const cleanedPhone = phoneWithCountry.trim();
      
      const { data, error } = await supabase
        .from('participants')
        .select('id')
        .eq('phone', cleanedPhone)
        .single();
  
      if (error || !data) {
        toast.error("❌ Participante no encontrado con ese número.");
        return;
      }
  
      const participantId = data.id;
      onPhoneValidationSuccess(phoneWithCountry, participantId);
      onClose();
    } else {
      setValidation({
        isValid: false,
        message: "Por favor ingrese un número válido",
        formattedNumber: ""
      });
    }
  };

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
          <PhoneInputField 
            value={phone}
            onChange={setPhone}
          />
          <ValidationMessage 
            message={validation.message}
            isValid={validation.isValid}
            formattedNumber={validation.formattedNumber}
          />
        </div>
        
        <ModalFooter 
          onCancel={onClose}
          onValidate={handleNumberSubmit}
          isValid={validation.isValid}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PhoneValidationModal;
