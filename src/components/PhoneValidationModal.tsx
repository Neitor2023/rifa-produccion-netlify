
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
import { Toaster, toast } from 'sonner';
import ValidationMessage from './phone-validation/ValidationMessage';
import PhoneInputField from './phone-validation/PhoneInputField';
import ModalFooter from './phone-validation/ModalFooter';

interface ValidatedBuyerInfo {
  name: string;
  phone: string;
  cedula?: string;
  direccion?: string;
  sugerencia_producto?: string;
}

interface PhoneValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneValidationSuccess: (
    phone: string, 
    participantId: string,
    buyerInfo?: ValidatedBuyerInfo
  ) => void;
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
  selectedNumber,
  raffleNumbers,
  raffleSellerId,
  raffleId,
  debugMode = false
}) => {
  const [phone, setPhone] = useState('');
  const [validation, setValidation] = useState({
    isValid: false,
    message: '',
    formattedNumber: ''
  });

  const formatPhoneNumber = (inputPhone: string): string => {
    let cleanedPhone = inputPhone.trim();
    
    // Check if it's a cedula first (only digits, at least 5 characters)
    if (cleanedPhone.length >= 5 && /^\d+$/.test(cleanedPhone)) {
      return cleanedPhone; // Return cedula as is if it's only digits
    }
    
    // Remove Ecuador's prefix if it starts with +5930
    if (cleanedPhone.startsWith('+5930')) {
      cleanedPhone = '+593' + cleanedPhone.substring(5);
    }
    // If it starts with 0, remove it and add +593
    else if (cleanedPhone.startsWith('0')) {
      cleanedPhone = '+593' + cleanedPhone.substring(1);
    }
    // If it doesn't have any prefix, add +593
    else if (!cleanedPhone.startsWith('+')) {
      cleanedPhone = '+593' + cleanedPhone;
    }
    
    return cleanedPhone;
  };

  useEffect(() => {
    if (phone.length > 0) {
      try {
        // Handle possible cedula input
        if (phone.length >= 5 && /^\d+$/.test(phone)) {
          setValidation({
            isValid: true,
            message: 'Cédula válida',
            formattedNumber: phone
          });
          return;
        }
        
        let formattedPhone = formatPhoneNumber(phone);
        
        // Validate as phone number
        const isValid = isValidPhoneNumber(formattedPhone);
        
        if (isValid) {
          const parsedPhone = parsePhoneNumber(formattedPhone);
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
      const cleanedPhone = formatPhoneNumber(phone);
      console.log("🔍 Searching for participant with:", cleanedPhone);

      let participant = null;
      let foundBy = '';

      // First try to find by phone number
      const { data: byPhone, error: errPhone } = await supabase
        .from('participants')
        .select('id, name, phone, cedula, direccion, sugerencia_producto')
        .eq('phone', cleanedPhone)
        .maybeSingle();

      if (byPhone) {
        participant = byPhone;
        foundBy = 'phone';
        console.log("✅ Found participant by phone:", participant);
      } else if (/^\d+$/.test(phone)) {
        // If it's a numeric string, try to find by cedula
        const { data: byCedula, error: errCedula } = await supabase
          .from('participants')
          .select('id, name, phone, cedula, direccion, sugerencia_producto')
          .eq('cedula', phone)
          .maybeSingle();

        if (byCedula) {
          participant = byCedula;
          foundBy = 'cedula';
          console.log("✅ Found participant by cedula:", participant);
        }
      }

      if (!participant) {
        console.log("❌ No participant found");
        toast.error(`❌ Participante no encontrado con el dato ingresado: ${cleanedPhone}`);
        return;
      }

      const { id, name, phone: foundPhone, cedula, direccion, sugerencia_producto } = participant;

      onPhoneValidationSuccess(
        foundPhone || cleanedPhone,
        id,
        {
          name,
          phone: foundPhone || cleanedPhone,
          cedula,
          direccion,
          sugerencia_producto
        }
      );

      onClose();
    } else {
      setValidation({
        isValid: false,
        message: "Por favor ingrese un número o cédula válida",
        formattedNumber: ""
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Validar número de ( teléfono o cédula )</DialogTitle>
          <DialogDescription>
            Ingrese su número de ( teléfono o cédula ) para continuar
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
