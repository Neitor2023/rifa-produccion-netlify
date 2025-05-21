
import { toast } from 'sonner';

interface UseReservedNumbersHandlingProps {
  numbers: any[];
  highlightReserved: boolean;
  setHighlightReserved: (value: boolean) => void;
  setShowReservedMessage: (value: boolean) => void;
  setClickedPaymentButton: (value: string | undefined) => void;
}

export const useReservedNumbersHandling = ({
  numbers,
  highlightReserved,
  setHighlightReserved,
  setShowReservedMessage,
  setClickedPaymentButton
}: UseReservedNumbersHandlingProps) => {
  
  const handleReservedPayment = () => {
    console.log('NumberGrid: handlePayReserved called');
    
    setClickedPaymentButton("Pagar Apartados");
    
    if (highlightReserved) {
      return;
    }
    
    const reservedNumbers = numbers.filter(n => n.status === 'reserved');
    if (reservedNumbers.length === 0) {
      toast.warning('No hay números reservados para pagar');
      setShowReservedMessage(false);
      return;
    }
    
    setHighlightReserved(true);
    setShowReservedMessage(true);
    toast.info(`Hay ${reservedNumbers.length} numero reservado(s). Seleccione uno para proceder con el pago.`);
  };
  
  const handleCloseReservedMessage = () => {
    setShowReservedMessage(false);
  };
  
  return {
    handleReservedPayment,
    handleCloseReservedMessage
  };
};
