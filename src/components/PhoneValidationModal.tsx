
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ValidationMessage from './phone-validation/ValidationMessage';
import PhoneInputField from './phone-validation/PhoneInputField';
import ModalFooter from './phone-validation/ModalFooter';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';

function usePhoneValidation(phone: string) {
  const [validation, setValidation] = useState({
    isValid: false,
    message: '',
    formattedNumber: ''
  });

  useEffect(() => {
    if (phone.length > 0) {
      try {
        if (phone.length >= 5 && /^\d+$/.test(phone)) {
          setValidation({
            isValid: true,
            message: 'Cédula válida',
            formattedNumber: phone
          });
          return;
        }

        let formattedPhone = formatPhoneNumber(phone);
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
  return validation;
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
  const validation = usePhoneValidation(phone);

  const handleNumberSubmit = async () => {
    console.log("PhoneValidationModal.tsx:94 - Validando número/cédula:", phone);
    if (validation.isValid) {
      const isNumericOnly = /^\d+$/.test(phone);
      const cleanedPhone = formatPhoneNumber(phone);
      console.log("PhoneValidationModal.tsx:97 - Teléfono formateado para búsqueda:", cleanedPhone);
      
      let participant: ValidatedBuyerInfo | null = null;
      let foundBy = '';

      try {
        // BUSCA por teléfono (y la rifa!)
        console.log("PhoneValidationModal.tsx:103 - Buscando por teléfono:", cleanedPhone);
        const { data: byPhone } = await supabase
          .from('participants')
          .select('id, name, phone, cedula, direccion, sugerencia_producto, email')
          .eq('phone', cleanedPhone)
          .eq('raffle_id', raffleId)
          .maybeSingle();

        if (byPhone) {
          participant = byPhone;
          foundBy = 'phone';
          console.log("PhoneValidationModal.tsx:113 - Participante encontrado por teléfono:", participant);
        } else if (isNumericOnly) {
          // BUSCA por cédula (y la rifa!)
          console.log("PhoneValidationModal.tsx:116 - Buscando por cédula:", phone);
          const { data: byCedula } = await supabase
            .from('participants')
            .select('id, name, phone, cedula, direccion, sugerencia_producto, email')
            .eq('cedula', phone)
            .eq('raffle_id', raffleId)
            .maybeSingle();

          if (byCedula) {
            participant = byCedula;
            foundBy = 'cedula';
            console.log("PhoneValidationModal.tsx:126 - Participante encontrado por cédula:", participant);
          }
        }

        if (!participant) {
          console.log("PhoneValidationModal.tsx:131 - Participante no encontrado.");
          toast.error(`❌ Participante no encontrado con el dato ingresado: ${cleanedPhone}`);
          return;
        }

        // Retorna SIEMPRE UN OBJETO COMPLETO para el flujo posterior
        console.log("PhoneValidationModal.tsx:137 - Validación exitosa, devolviendo datos del participante:", participant);
        onPhoneValidationSuccess(
          participant.phone || cleanedPhone,
          participant.id,
          {
            id: participant.id,
            name: participant.name,
            phone: participant.phone || cleanedPhone,
            cedula: participant.cedula,
            direccion: participant.direccion,
            sugerencia_producto: participant.sugerencia_producto,
            email: participant.email
          }
        );
        onClose();
      } catch (error) {
        console.error("PhoneValidationModal.tsx:152 - Error durante la validación:", error);
        toast.error("Error durante la validación. Por favor intente nuevamente.");
      }
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
