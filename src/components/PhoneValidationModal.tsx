
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
import DebugModal from './DebugModal';

interface PhoneValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate: (number: string, participantId?: string) => void;
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
  // State management
  const [phone, setPhone] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  
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
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhone('');
      setDebugInfo(null);
    }
  }, [isOpen]);
  
  // Input handlers
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
  };
  
  // Validation flow
  const handleValidate = async () => {
    // Input validation
    if (!validateInputs()) return;
    
    setIsValidating(true);
    setDebugInfo(null);
    
    try {
      // Validate phone and find participant
      const result = await validatePhoneAndFindParticipant();
      
      // Process result
      if (result.success) {
        handleSuccessfulValidation(result);
      } else {
        handleFailedValidation(result);
      }
    } catch (error) {
      handleValidationError(error);
    } finally {
      setIsValidating(false);
    }
  };
  
  // Input validation
  const validateInputs = (): boolean => {
    if (!phone) {
      toast.error('Por favor, introduzca su número de celular');
      return false;
    }
    
    if (!selectedNumber) {
      toast.error('No hay número seleccionado para validar');
      return false;
    }
    
    return true;
  };
  
  // Main validation logic
  const validatePhoneAndFindParticipant = async () => {
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
      debugData.error = 'Error: El número seleccionado no está reservado';
      debugData.raffleNumberStatus = 'not found or not reserved';
      return { success: false, debugData };
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
      debugData.error = '❗ Participante no encontrado con ese número de celular.';
      debugData.phoneError = phoneError;
      return { success: false, debugData };
    }
    
    debugData.vParticipantId = matchedParticipant.id;
    
    // Verifica si el participante coincide con el asociado (si existe)
    if (raffleNumber.participant_id && raffleNumber.participant_id !== matchedParticipant.id) {
      debugData.error = '⚠️ Este número reservado ya está vinculado a otro participante.';
      debugData.existingParticipantId = raffleNumber.participant_id;
      return { success: false, debugData };
    }
    
    // ✅ Si todo está correcto
    debugData.success = true;
    debugData.message = 'Teléfono verificado correctamente';
    
    return { 
      success: true, 
      debugData, 
      matchedParticipant 
    };
  };
  
  // Handle successful validation
  const handleSuccessfulValidation = (result: any) => {
    setDebugInfo(result.debugData);
    toast.success('Teléfono verificado correctamente');
    
    // Only automatically proceed if not in debug mode
    if (!debugMode) {
      onValidate(selectedNumber!, result.matchedParticipant.id);
    }
  };
  
  // Handle failed validation
  const handleFailedValidation = (result: any) => {
    if (debugMode) {
      setDebugInfo(result.debugData);
    } else {
      toast.error(result.debugData.error);
    }
  };
  
  // Error handling
  const handleValidationError = (error: any) => {
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
  };
  
  // Handler for debug continue button
  const handleContinueFromDebug = () => {
    if (selectedNumber && debugInfo?.matchedParticipant?.id) {
      onValidate(selectedNumber, debugInfo.matchedParticipant.id);
    } else if (selectedNumber) {
      // Fallback if participant ID is not available
      onValidate(selectedNumber);
    }
  };

  // Debug modal handler
  const handleOpenDebugModal = () => {
    if (debugMode && debugInfo) {
      setIsDebugModalOpen(true);
    }
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-gray-800 dark:text-gray-100">
              Validar número apartado
            </DialogTitle>
            {debugMode && (
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
              <Alert 
                className="mt-4 bg-amber-50 border-amber-300 text-amber-800 cursor-pointer"
                onClick={handleOpenDebugModal}
              >
                <AlertDescription className="text-xs overflow-auto max-h-32">
                  <div className="font-bold mb-1">
                    Información de depuración: {debugInfo.success ? '✅ Éxito' : '❌ Error'}
                    {' '}<span className="text-xs italic">(click para expandir)</span>
                  </div>
                  <pre className="whitespace-pre-wrap line-clamp-3">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
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
            
            {debugMode && debugInfo && debugInfo.success && (
              <Button
                onClick={handleContinueFromDebug}
                className="w-full mt-2 sm:w-auto sm:mt-0 bg-amber-500 hover:bg-amber-600 text-white"
              >
                Continuar desde depuración
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Full debug modal */}
      {debugMode && (
        <DebugModal
          isOpen={isDebugModalOpen}
          onClose={() => setIsDebugModalOpen(false)}
          data={debugInfo}
          title="🔧 Validación de Teléfono - Depuración"
        />
      )}
    </>
  );
};

export default PhoneValidationModal;
