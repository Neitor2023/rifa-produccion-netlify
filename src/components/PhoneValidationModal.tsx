
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { supabase } from '@/integrations/supabase/client';
import { Toaster, toast } from 'sonner';
import ValidationMessage from './phone-validation/ValidationMessage';
import PhoneInputField from './phone-validation/PhoneInputField';
import ModalFooter from './phone-validation/ModalFooter';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';

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
        
        console.log("📱 Validating phone:", phone);
        let formattedPhone = formatPhoneNumber(phone);
        console.log("📱 Formatted phone:", formattedPhone);
        
        // Validate as phone number
        const isValid = isValidPhoneNumber(formattedPhone);
        
        if (isValid) {
          const parsedPhone = parsePhoneNumber(formattedPhone);
          setValidation({
            isValid: true,
            message: 'Número válido',
            formattedNumber: parsedPhone.formatInternational()
          });
          console.log("✅ Valid phone:", parsedPhone.formatInternational());
        } else {
          setValidation({
            isValid: false,
            message: 'Número inválido',
            formattedNumber: ''
          });
          console.log("❌ Invalid phone");
        }
      } catch (error) {
        console.error("❌ Phone validation error:", error);
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
      // If it's a numeric string, it could be a cedula or a phone number
      const isNumericOnly = /^\d+$/.test(phone);
      const cleanedPhone = formatPhoneNumber(phone);
      console.log("🔍 Original input:", phone);
      console.log("🔍 Formatted for search:", cleanedPhone);

      let participant = null;
      let foundBy = '';

      // First try to find by phone number
      console.log("🔍 Searching by phone:", cleanedPhone);
      const { data: byPhone, error: errPhone } = await supabase
        .from('participants')
        .select('id, name, phone, cedula, direccion, sugerencia_producto')
        .eq('phone', cleanedPhone)
        .maybeSingle();

      if (byPhone) {
        participant = byPhone;
        foundBy = 'phone';
        console.log("✅ Found participant by phone:", participant);
      } else if (isNumericOnly) {
        // If it's a numeric string, try to find by cedula
        console.log("🔍 Searching by cedula:", phone);
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
        console.log("❌ No participant found by phone or cedula");
        toast.error(`❌ Participante no encontrado con el dato ingresado: ${cleanedPhone}`);
        return;
      }

      const { id, name, phone: foundPhone, cedula, direccion, sugerencia_producto } = participant;

      const validatedInfo: ValidatedBuyerInfo = {
        id,
        name,
        phone: foundPhone || cleanedPhone,
        cedula,
        direccion,
        sugerencia_producto
      };

      console.log("✅ Successfully validated participant:", validatedInfo);
      
      onPhoneValidationSuccess(
        foundPhone || cleanedPhone,
        id,
        validatedInfo
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
