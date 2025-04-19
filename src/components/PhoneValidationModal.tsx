
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Update the interface to include the optional selectedNumber
interface PhoneValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneValidationSuccess: (phone: string, formattedPhone: string) => void;
  selectedNumber?: string;  // Add the optional parameter here
  raffleNumbers?: any[];
  raffleSellerId?: string;
  raffleId?: string;
  debugMode?: boolean;
}

const PhoneValidationModal: React.FC<PhoneValidationModalProps> = ({
  isOpen,
  onClose,
  onPhoneValidationSuccess,
  selectedNumber,  // Now correctly declared as an optional parameter
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
        // Assume Mexican phone number if no country code is provided
        let cleanedPhone = phone;
        
        // Eliminar el 0 inicial si existe
        if (cleanedPhone.startsWith('0')) {
          cleanedPhone = cleanedPhone.slice(1);
        }
        
        const phoneWithCountry = phone.startsWith('+') ? phone : `+593${cleanedPhone}`;
      console.log('telefonito 000',phoneWithCountry);
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
      const phoneWithCountry = phone.startsWith('+') ? phone : `+593${phone}`;
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


  // Limpiar número antes de usar
  const cleanedPhone = phone.startsWith('0') ? phone.slice(1) : phone;
  const formattedPhone = phone.startsWith('+') ? phone : `+593${cleanedPhone}`;

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

