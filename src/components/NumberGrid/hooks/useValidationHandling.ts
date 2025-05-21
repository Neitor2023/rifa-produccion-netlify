
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';
import { getSellerUuidFromCedula } from '@/hooks/useRaffleData/useSellerIdMapping';

interface UseValidationHandlingProps {
  selectedNumbers: string[];
  onProceedToPayment: (selectedNumbers: string[], participantData?: ValidatedBuyerInfo, clickedButton?: string) => Promise<void>;
  setBuyerInfo: (data: ValidatedBuyerInfo | null) => void;
  setIsPhoneModalOpen: (isOpen: boolean) => void;
  setShowReservedMessage: (show: boolean) => void;
  clickedPaymentButton?: string;
  debugMode?: boolean;
}

export const useValidationHandling = ({
  selectedNumbers,
  onProceedToPayment,
  setBuyerInfo,
  setIsPhoneModalOpen,
  setShowReservedMessage,
  clickedPaymentButton,
  debugMode = false
}: UseValidationHandlingProps) => {
  
  const handleValidationSuccess = async (
    validatedNumber: string,
    participantId: string,
    buyerInfo?: ValidatedBuyerInfo
  ) => {
    // Validar que participantId esté definido
    if (!participantId) {
      console.error("❌ Error: participantId está undefined. Abortando ejecución.");
      toast.error("Error en la validación. Por favor, intente de nuevo.");
      return;
    }
    
    if (buyerInfo) {
      if (debugMode) {
        console.log("NumberGrid: Se recibió información validada del comprador:", {
          name: buyerInfo.name,
          phone: buyerInfo.phone,
          cedula: buyerInfo.cedula,
          id: buyerInfo.id
        });
      }
      
      // Update context state
      setBuyerInfo(buyerInfo);
    }
    
    setIsPhoneModalOpen(false);
    
    // After validation success, automatically close the reserved message
    setShowReservedMessage(false);
    
    try {
      if (participantId && buyerInfo) {
        await onProceedToPayment(selectedNumbers, buyerInfo, clickedPaymentButton);
      } else {
        await handleNumberValidation(validatedNumber);
      }
    } catch (error) {
      console.error("❌ Error al proceder después de la validación:", error);
      toast.error("Error al procesar después de la validación. Por favor, intente de nuevo.");
    }
  };
  
  const handleNumberValidation = async (validatedNumber: string) => {
    // This function would need access to the numbers array
    // For now, just show an error message
    toast.error('Necesita validar el número primero');
    console.error("❌ handleNumberValidation requires access to numbers array");
    return;
  };
  
  const handleParticipantValidation = async (
    participantId: string,
    raffleSeller: { raffle_id?: string; seller_id?: string }
  ) => {
    // Validar que raffle_id y seller_id estén definidos
    if (!raffleSeller.raffle_id) {
      console.error("❌ Error: raffle_id está undefined en raffleSeller. Abortando ejecución.");
      toast.error("Error en la identificación de la rifa. Por favor, intente de nuevo.");
      return;
    }
    
    // Get the seller UUID from the cedula if necessary
    let sellerUuid = raffleSeller.seller_id;
    
    if (!raffleSeller.seller_id) {
      console.error("❌ Error: seller_id está undefined en raffleSeller. Abortando ejecución.");
      toast.error("Error en la identificación del vendedor. Por favor, intente de nuevo.");
      return;
    }
    
    // Check if seller_id is a UUID or cedula
    if (sellerUuid && !sellerUuid.includes('-')) {
      // This looks like a cedula, not a UUID - get the UUID
      console.log("🔄 NumberGrid: Converting seller cedula to UUID:", sellerUuid);
      const uuid = await getSellerUuidFromCedula(sellerUuid);
      if (uuid) {
        sellerUuid = uuid;
        console.log("✅ NumberGrid: Found seller UUID:", sellerUuid);
      } else {
        console.error("❌ NumberGrid: Could not find seller UUID for cedula:", sellerUuid);
        toast.error("Error: No se pudo encontrar el ID del vendedor");
        return;
      }
    }
    
    if (debugMode) {
      console.log('NumberGrid: Querying Supabase for reserved numbers with participant ID:', participantId);
    }
    
    try {
      const { data: reservedNumbers, error } = await supabase
        .from('raffle_numbers')
        .select('number')
        .eq('participant_id', participantId)
        .eq('status', 'reserved')
        .eq('raffle_id', raffleSeller.raffle_id)
        .eq('seller_id', sellerUuid);
      
      if (error) {
        console.error('NumberGrid: Error al obtener números reservados:', error);
        toast.error('Error al buscar números reservados');
        return;
      }
      
      if (reservedNumbers && reservedNumbers.length > 0) {
        const allReservedNumbers = reservedNumbers.map(n => 
          n.number.toString().padStart(2, '0')
        );
        
        if (debugMode) {
          console.log('NumberGrid: Números reservados encontrados:', allReservedNumbers);
        }
        
        toast.success(`${allReservedNumbers.length} número(s) encontrado(s)`);
        await onProceedToPayment(allReservedNumbers);
      } else {
        if (debugMode) {
          console.log('NumberGrid: No se encontraron números reservados con consulta directa');
        }
        
        toast.error('❗ No se encontraron números reservados para este participante.');
      }
    } catch (error) {
      console.error("❌ Error al validar participante:", error);
      toast.error("Error al buscar números reservados. Por favor, intente de nuevo.");
    }
  };
  
  return {
    handleValidationSuccess,
    handleNumberValidation,
    handleParticipantValidation
  };
};
