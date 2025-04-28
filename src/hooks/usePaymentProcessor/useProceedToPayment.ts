
import { toast } from 'sonner';

export function useProceedToPayment({
  validateSellerMaxNumbers,
  checkNumbersAvailability,
  setSelectedNumbers,
  setIsPaymentModalOpen,
  debugMode
}) {
  return async (numbers: string[]) => {
    console.log("💰 usePaymentProcessor: handleProceedToPayment llamado con números:", numbers);

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
      console.error('usePaymentProcessor: ❌ Error al proceder al pago:', error);
      toast.error('Error al procesar el pago');
    }
  };
}
