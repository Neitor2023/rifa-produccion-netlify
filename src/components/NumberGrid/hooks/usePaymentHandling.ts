
import { toast } from 'sonner';
import { ValidatedBuyerInfo } from '@/types/participant';

interface UsePaymentHandlingProps {
  selectedNumbers: string[];
  raffleSeller: {
    id: string;
    raffle_id: string;
    seller_id: string;
    active: boolean;
    cant_max: number;
  };
  onProceedToPayment: (selectedNumbers: string[], participantData?: ValidatedBuyerInfo, clickedButton?: string) => Promise<void>;
  setClickedPaymentButton: (value: string | undefined) => void;
  debugMode?: boolean;
}

export const usePaymentHandling = ({
  selectedNumbers,
  raffleSeller,
  onProceedToPayment,
  setClickedPaymentButton,
  debugMode = false
}: UsePaymentHandlingProps) => {
  
  const handleProceedToPayment = async (buttonType: string) => {
    if (debugMode) {
      console.log(`NumberGrid: handleProceedToPayment llamado con tipo de botón: ${buttonType}`);
    }
    
    // Validar que raffle_id esté definido
    if (!raffleSeller.raffle_id) {
      console.error("❌ Error: raffle_id está undefined en raffleSeller. Abortando ejecución.");
      toast.error("Error en la identificación de la rifa. Por favor, intente de nuevo.");
      return;
    }
    
    setClickedPaymentButton(buttonType);
    
    if (selectedNumbers.length === 0) {
      toast.error('Seleccione al menos un número para pagar');
      return;
    }
    
    try {
      await onProceedToPayment(selectedNumbers, undefined, buttonType);
    } catch (error) {
      console.error("❌ Error al proceder al pago:", error);
      toast.error("Error al procesar el pago. Por favor, intente de nuevo.");
    }
  };
  
  return { handleProceedToPayment };
};
