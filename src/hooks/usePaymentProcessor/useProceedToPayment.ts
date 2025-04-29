
import { toast } from 'sonner';

export function useProceedToPayment({
  validateSellerMaxNumbers,
  checkNumbersAvailability,
  setSelectedNumbers,
  setIsPaymentModalOpen,
  debugMode = false
}) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ProceedToPayment - ${context}]:`, data);
    }
  };

  return async (numbers: string[]) => {
    console.log("💰 usePaymentProcessor: handleProceedToPayment llamado con números:", numbers);

    if (!numbers || numbers.length === 0) {
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
      
      debugLog("ProceedToPayment - Payment modal opened", { numbers });
      
    } catch (error) {
      console.error('usePaymentProcessor: ❌ Error al proceder al pago:', error);
      toast.error('Error al procesar el pago');
    }
  };
}
