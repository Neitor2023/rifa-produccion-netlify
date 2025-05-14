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
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const { clearSelectionState, setSelectedNumbers } = useNumberSelection();
  const [isNoReservedNumbersDialogOpen, setIsNoReservedNumbersDialogOpen] = useState(false);
  const [isNumberNotInReservedDialogOpen, setIsNumberNotInReservedDialogOpen] = useState(false);
  const [reservedNumbers, setReservedNumbers] = useState<string[]>([]);
  const [participantFound, setParticipantFound] = useState<ValidatedBuyerInfo | null>(null);

  const handleNumberSubmit = async () => {
    if (validation.isValid) {
      // Mostrar modo de carga
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

        // Verificar si se encontró un participante
        if (!participant) {
          setIsSearching(false);
          toast.error(`❌ Participante no encontrado con el dato ingresado: ${cleanedPhone}`);
          return;
        }

        // Verificar si el participante tiene números reservados
        const { data: reservedNumbersData } = await supabase
          .from('raffle_numbers')
          .select('number')
          .eq('participant_id', participant.id)
          .eq('status', 'reserved')
          .eq('raffle_id', raffleId)
          .eq('seller_id', raffleSellerId);

        // Ocultar el modal de carga
        setIsSearching(false);

        // Si no tiene números reservados, mostrar mensaje y bloquear
        if (!reservedNumbersData || reservedNumbersData.length === 0) {
          setIsNoReservedNumbersDialogOpen(true);
          return;
        }

        // Convertir los números reservados a strings con formato padStart(2, '0')
        const formattedReservedNumbers = reservedNumbersData.map(item => 
          String(item.number).padStart(2, '0')
        );
        
        setReservedNumbers(formattedReservedNumbers);
        setParticipantFound(participant);

        // Verificar si el número seleccionado está entre los reservados
        if (selectedNumber && !formattedReservedNumbers.includes(selectedNumber)) {
          setIsNumberNotInReservedDialogOpen(true);
          return;
        }

        // Si todo está bien, continuar con el proceso normal
        proceedWithValidatedParticipant(participant);

      } catch (error) {
        // Ocultar el modal de carga en caso de error
        setIsSearching(false);
        toast.error("Error durante la validación. Por favor intente nuevamente.");
      }
    }
  };

  // Función para proceder con el participante validado
  const proceedWithValidatedParticipant = (participant: ValidatedBuyerInfo) => {
    onPhoneValidationSuccess(
      participant.phone || formatPhoneNumber(phone),
      participant.id,
      {
        id: participant.id,
        name: participant.name,
        phone: participant.phone || formatPhoneNumber(phone),
        cedula: participant.cedula,
        direccion: participant.direccion,
        sugerencia_producto: participant.sugerencia_producto
      }
    );
    handleModalClose();
  };

  // Función para continuar con los números reservados
  const continueWithReservedNumbers = () => {
    if (participantFound && reservedNumbers.length > 0) {
      setSelectedNumbers(reservedNumbers);
      setIsNumberNotInReservedDialogOpen(false);
      proceedWithValidatedParticipant(participantFound);
    }
  };

  // Controlador de cierre modal unificado
  const handleModalClose = (): void => {
    clearSelectionState(); // Borrar todas las selecciones de números
    console.log("PhoneValidationModal.tsx: Borrar el estado de selección cuando el modal está cerrado");
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
        <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] flex flex-col bg-white/20 backdrop-blur-md rounded-xl border-0 shadow-xl">          
          <Card className="bg-transparent border-0 shadow-none">
            <DialogHeader className="pt-1 pb-1">
              <Card className="bg-[#9b87f5] dark:bg-[#7E69AB] shadow-md border-0">
                <CardHeader className="py-3 px-4">
                  <DialogTitle
                    onClick={handleNumberSubmit}
                    tabIndex={0}                // lo hace focoable
                    role="button"                 // semántica de "botón"
                    className="cursor-pointer text-lg text-white font-bold text-center"
                    onKeyDown={(e) => {           // captura Enter y Barra espaciadora
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleNumberSubmit()
                      }
                    }}                    
                    >
                    Validación de ( teléfono o cédula )
                  </DialogTitle>
                  <DialogClose className="absolute right-10 center bg-[#3d3d3d] hover:bg-[#1a1a1a] rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-white">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </DialogClose>                  
                </CardHeader>
              </Card>
              <DialogDescription className="text-black dark:text-white mt-4 px-2">
                Ingrese su número de ( teléfono o cédula )
              </DialogDescription>
            </DialogHeader>

            <Card className="border-0 shadow-sm mt-4 bg-transparent">
              <CardContent className="p-0">
                <ScrollArea className="max-h-[50vh] overflow-y-auto px-1 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-300/50 dark:border-gray-700/50">
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
              onCancel={handleModalClose}
              onValidate={handleNumberSubmit}
              isValid={validation.isValid}
            />
          </Card>
        </DialogContent>
      </Dialog>

      {/* Dialog for no reserved numbers */}
      <AlertDialog 
        open={isNoReservedNumbersDialogOpen} 
        onOpenChange={setIsNoReservedNumbersDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No hay números reservados</AlertDialogTitle>
            <AlertDialogDescription>
              El participante no tiene números reservados. Intente con otro número.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => {
                setIsNoReservedNumbersDialogOpen(false);
                handleModalClose();
              }}
            >
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for number not in reserved list */}
      <AlertDialog 
        open={isNumberNotInReservedDialogOpen} 
        onOpenChange={setIsNumberNotInReservedDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Número no reservado</AlertDialogTitle>
            <AlertDialogDescription>
              Su número seleccionado no existe en sus números reservados en la base de datos. 
              ¿Desea seguir el pago con sus números reservados?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-between">
            <AlertDialogCancel 
              onClick={() => {
                setIsNumberNotInReservedDialogOpen(false);
                handleModalClose();
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={continueWithReservedNumbers}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loading Modal */}
      <LoadingModal 
        isOpen={isSearching} 
        message="Buscando datos del participante, por favor espere..."
      />
    </>
  );
};

export default PhoneValidationModal;
