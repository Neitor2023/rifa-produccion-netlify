
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PhoneValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate: (number: string) => void;
  selectedNumber: string | null;
  raffleNumbers: any[];
  raffleSellerId?: string;
  raffleId?: string;
}

const PhoneValidationModal: React.FC<PhoneValidationModalProps> = ({
  isOpen,
  onClose,
  onValidate,
  selectedNumber,
  raffleNumbers,
  raffleSellerId,
  raffleId
}) => {
  const [phone, setPhone] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Check if we're in developer mode
  useEffect(() => {
    const checkDeveloperMode = async () => {
      try {
        const { data } = await supabase
          .from('organization')
          .select('modal')
          .limit(1)
          .single();
        
        setDebugMode(data?.modal === 'programador');
      } catch (error) {
        console.error('Error checking developer mode:', error);
      }
    };
    
    if (isOpen) {
      checkDeveloperMode();
    }
  }, [isOpen]);
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
  };
  
  const handleValidate = async () => {
    if (!phone) {
      toast.error('Por favor, introduzca su número de celular');
      return;
    }
    
    if (!selectedNumber) {
      toast.error('No hay número seleccionado para validar');
      return;
    }
    
    setIsValidating(true);
    setDebugInfo(null);
    
    try {
      // Prepare debug info
      const debugData: any = {
        vSellerId: raffleSellerId,
        vRaffleId: raffleId,
        inputPhone: phone,
        selectedNumber,
        vParticipantId: null,
        raffleNumberStatus: null
      };
      
      // Get the raffle number data
      const raffleNumber = raffleNumbers.find(n => n.number === selectedNumber && n.status === 'reserved');
      
      if (!raffleNumber) {
        const errorMsg = 'Error: El número seleccionado no está reservado';
        if (debugMode) {
          setDebugInfo({
            ...debugData,
            error: errorMsg,
            raffleNumberStatus: 'not found or not reserved'
          });
        } else {
          toast.error(errorMsg);
        }
        setIsValidating(false);
        return;
      }
      
      debugData.raffleNumberStatus = raffleNumber.status;
      
      // Buscar participante por teléfono directamente
      const { data: matchedParticipant, error: phoneError } = await supabase
        .from('participants')
        .select('id, phone, name')
        .eq('phone', phone)
        .maybeSingle();

      debugData.matchedParticipant = matchedParticipant;
      
      if (phoneError || !matchedParticipant) {
        const errorMsg = '❗ Participante no encontrado con ese número de celular.';
        if (debugMode) {
          setDebugInfo({
            ...debugData,
            error: errorMsg,
            phoneError: phoneError
          });
        } else {
          toast.error(errorMsg);
        }
        setIsValidating(false);
        return;
      }
      
      debugData.vParticipantId = matchedParticipant.id;
      
      // Verifica si el participante coincide con el asociado (si existe)
      if (raffleNumber.participant_id && raffleNumber.participant_id !== matchedParticipant.id) {
        const errorMsg = '⚠️ Este número reservado ya está vinculado a otro participante.';
        if (debugMode) {
          setDebugInfo({
            ...debugData,
            error: errorMsg,
            existingParticipantId: raffleNumber.participant_id
          });
        } else {
          toast.error(errorMsg);
        }
        setIsValidating(false);
        return;
      }
      
      // ✅ Si todo está correcto
      toast.success('Teléfono verificado correctamente');
      onValidate(selectedNumber);
      
    } catch (error) {
      console.error('Error validating phone:', error);
      const errorMsg = '❗ Error interno del sistema. Contacte al administrador.';
      if (debugMode) {
        setDebugInfo({
          error: errorMsg,
          systemError: error
        });
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsValidating(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-gray-800 dark:text-gray-100">
            Validar número apartado
          </DialogTitle>
          {debugMode && debugInfo && (
            <DialogDescription className="text-amber-600 font-semibold">
              Modo desarrollador: Depuración activa
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Para proceder al pago del número <strong>{selectedNumber}</strong>, por favor verifique su identidad.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Introduce tu número de celular</Label>
              <Input
                id="phone"
                placeholder="Ej: 6123456789"
                value={phone}
                onChange={handlePhoneChange}
                type="tel"
              />
            </div>
          </div>
          
          {debugMode && debugInfo && (
            <Alert className="mt-4 bg-amber-50 border-amber-300 text-amber-800">
              <AlertDescription className="text-xs overflow-auto max-h-32">
                <div className="font-bold mb-1">Información de depuración:</div>
                <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleValidate}
            className="w-full sm:w-auto bg-rifa-purple hover:bg-rifa-darkPurple"
            disabled={isValidating}
          >
            {isValidating ? 'Validando...' : 'Validar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneValidationModal;
