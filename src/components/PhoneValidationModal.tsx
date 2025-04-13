
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PhoneValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate: (number: string) => void;
  selectedNumber: string | null;
  raffleNumbers: any[];
}

const PhoneValidationModal: React.FC<PhoneValidationModalProps> = ({
  isOpen,
  onClose,
  onValidate,
  selectedNumber,
  raffleNumbers
}) => {
  const [phone, setPhone] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  
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
    
    try {
      // Get the raffle number data
      const raffleNumber = raffleNumbers.find(n => n.number === selectedNumber && n.status === 'reserved');
      
      if (!raffleNumber) {
        toast.error('Error: El número seleccionado no está reservado');
        setIsValidating(false);
        return;
      }
      
      if (!raffleNumber.participant_id) {
        toast.error('Error: Este número reservado no tiene un participante asociado');
        setIsValidating(false);
        return;
      }
      
      // Verify if the phone matches the participant's phone
      const { data: participant, error } = await supabase
        .from('participants')
        .select('phone')
        .eq('id', raffleNumber.participant_id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching participant:', error);
        toast.error('Error interno al verificar el teléfono. Contacte al administrador.');
        setIsValidating(false);
        return;
      }
      
      if (!participant) {
        toast.error('❗ Participante no encontrado con el ID asociado al número.');
        setIsValidating(false);
        return;
      }
      
      // Check if the phone matches
      if (participant.phone === phone) {
        toast.success('Teléfono verificado correctamente');
        onValidate(selectedNumber);
      } else {
        toast.error('❗ El número telefónico ingresado no coincide con el registrado para este boleto.');
      }
    } catch (error) {
      console.error('Error validating phone:', error);
      toast.error('❗ Error interno del sistema. Contacte al administrador.');
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
