
import { toast } from "sonner";

export function usePaymentProceed({ 
  validateSellerMaxNumbers,
  checkNumbersAvailability,
  checkReservedNumbersParticipant,
  setSelectedNumbers,
  setIsPaymentModalOpen,
  debugMode
}) {
  const handleProceedToPayment = async (numbers: string[]) => {
    if (numbers.length === 0) {
      toast.error('Seleccione al menos un número para comprar');
      return;
    }
    if (!(await validateSellerMaxNumbers(numbers.length))) return;
    const unavailableNumbers = await checkNumbersAvailability(numbers);
    if (unavailableNumbers.length > 0) {
      toast.error(`Números ${unavailableNumbers.join(', ')} no están disponibles`);
      return;
    }
    await checkReservedNumbersParticipant(numbers);
    setSelectedNumbers(numbers);
    setIsPaymentModalOpen(true);
  };
  return { handleProceedToPayment };
}
