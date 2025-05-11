
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ValidationMessage from './phone-validation/ValidationMessage';
import PhoneInputField from './phone-validation/PhoneInputField';
import ModalFooter from './phone-validation/ModalFooter';
import LoadingModal from './payment/LoadingModal';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from 'lucide-react';
import PromotionalImage from '@/components/raffle/PromotionalImage';
import { Organization } from '@/lib/constants/types';

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
  organization?: Organization | null;
}

const PhoneValidationModal: React.FC<PhoneValidationModalProps> = ({
  isOpen,
  onClose,
  onPhoneValidationSuccess,
  selectedNumber,
  raffleNumbers,
  raffleSellerId,
  raffleId,
  debugMode = false,
  organization
}) => {
  const [phone, setPhone] = useState('');
  const validation = usePhoneValidation(phone);
  const [isSearching, setIsSearching] = useState(false);

  const handleNumberSubmit = async () => {
    if (validation.isValid) {
      // Show loading modal
      setIsSearching(true);
      
      const isNumericOnly = /^\d+$/.test(phone);
      const cleanedPhone = formatPhoneNumber(phone);
      let participant: ValidatedBuyerInfo | null = null;
      let foundBy = '';

      try {
        // BUSCA por teléfono (y la rifa!)
        const { data: byPhone } = await supabase
          .from('participants')
          .select('id, name, phone, cedula, direccion, sugerencia_producto')
          .eq('phone', cleanedPhone)
          .eq('raffle_id', raffleId)
          .maybeSingle();

        if (byPhone) {
          participant = byPhone;
          foundBy = 'phone';
        } else if (isNumericOnly) {
          // BUSCA por cédula (y la rifa!)
          const { data: byCedula } = await supabase
            .from('participants')
            .select('id, name, phone, cedula, direccion, sugerencia_producto')
            .eq('cedula', phone)
            .eq('raffle_id', raffleId)
            .maybeSingle();

          if (byCedula) {
            participant = byCedula;
            foundBy = 'cedula';
          }
        }

        // Hide loading modal
        setIsSearching(false);

        if (!participant) {
          toast.error(`❌ Participante no encontrado con el dato ingresado: ${cleanedPhone}`);
          return;
        }

        // Retorna SIEMPRE UN OBJETO COMPLETO para el flujo posterior
        onPhoneValidationSuccess(
          participant.phone || cleanedPhone,
          participant.id,
          {
            id: participant.id,
            name: participant.name,
            phone: participant.phone || cleanedPhone,
            cedula: participant.cedula,
            direccion: participant.direccion,
            sugerencia_producto: participant.sugerencia_producto
          }
        );
        onClose();
      } catch (error) {
        // Hide loading modal on error
        setIsSearching(false);
        toast.error("Error durante la validación. Por favor intente nuevamente.");
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] flex flex-col bg-background dark:bg-gray-900 rounded-xl border-0 shadow-xl">          
          <Card className="bg-background dark:bg-gray-900 border-0 shadow-none">
            <DialogHeader className="pt-1 pb-1">
              <Card className="bg-[#9b87f5] dark:bg-[#7E69AB] shadow-md border-0">
                <CardHeader className="py-3 px-4">
                  <DialogTitle onClick={handleNumberSubmit} className="text-lg text-white font-bold text-center">
                    Validación de ( teléfono o cédula )X
                  </DialogTitle>
                  <DialogClose className="absolute right-10 center bg-[#3d3d3d] hover:bg-[#1a1a1a] rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-white">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </DialogClose>                  
                </CardHeader>
              </Card>
              <DialogDescription className="mt-4 px-2">
                Ingrese su número de ( teléfono o cédula )
              </DialogDescription>
            </DialogHeader>

            <Card className="border-0 shadow-sm mt-4 bg-transparent">
              <CardContent className="p-0">
                <ScrollArea className="max-h-[50vh] overflow-y-auto px-1 bg-gray-400 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
                  <div className="p-4">
                    <PhoneInputField
                      value={phone}
                      onChange={setPhone}
                    />
                    <ValidationMessage
                      message={validation.message}
                      isValid={validation.isValid}
                      formattedNumber={validation.formattedNumber}
                    />
                    
                    {/* Mostrar imagen promocional al final si está disponible*/}
                    {organization?.imagen_publicitaria && (
                      <PromotionalImage imageUrl={organization.imagen_publicitaria} />
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <ModalFooter
              onCancel={onClose}
              onValidate={handleNumberSubmit}
              isValid={validation.isValid}
            />
          </Card>
        </DialogContent>
      </Dialog>

      {/* Loading Modal */}
      <LoadingModal 
        isOpen={isSearching} 
        message="Buscando datos del participante, por favor espere..."
      />
    </>
  );
};

export default PhoneValidationModal;
