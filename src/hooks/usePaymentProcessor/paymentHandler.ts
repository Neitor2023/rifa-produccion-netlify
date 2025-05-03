
import { toast } from 'sonner';
import { ValidatedBuyerInfo } from '@/types/participant';

export function usePaymentHandler({ 
  validateSellerMaxNumbers,
  checkNumbersAvailability,
  setSelectedNumbers,
  setIsPaymentModalOpen,
  setBuyerInfo,
  debugMode = false
}) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PaymentHandler - ${context}]:`, data);
    }
  };

  const handleProceedToPayment = async (numbers: string[]) => {
    console.log("💰 usePaymentHandler: handleProceedToPayment llamado con números:", numbers);

    if (numbers.length === 0) {
      toast.error('Seleccione al menos un número para comprar');
      return;
    }

    try {
      if (!(await validateSellerMaxNumbers(numbers.length))) {
        return;
      }

      const unavailableNumbers = await checkNumbersAvailability(numbers);
      if (unavailableNumbers.length > 0) {
        toast.error(`Números ${unavailableNumbers.join(', ')} no están disponibles`);
        return;
      }
      
      setSelectedNumbers(numbers);
      setIsPaymentModalOpen(true);
      
    } catch (error) {
      console.error('usePaymentHandler: ❌ Error al proceder al pago:', error);
      toast.error('Error al procesar el pago');
    }
  };

  const handlePayReservedNumbers = async (numbers: string[], participantData: ValidatedBuyerInfo) => {
    console.log("💰 usePaymentHandler: handlePayReservedNumbers llamado con:", {
      numbers,
      participantData
    });

    if (numbers.length === 0) {
      toast.error('No hay números seleccionados para pagar');
      return;
    }

    try {
      setBuyerInfo(participantData);
      setSelectedNumbers(numbers);
      setIsPaymentModalOpen(true);
      
      debugLog("usePaymentHandler: Modal de pago abierto con datos validados:", participantData);
    } catch (error) {
      console.error('usePaymentHandler: ❌ Error al proceder al pago de números reservados:', error);
      toast.error('Error al procesar el pago de números reservados');
    }
  };

  return {
    handleProceedToPayment,
    handlePayReservedNumbers
  };
}
