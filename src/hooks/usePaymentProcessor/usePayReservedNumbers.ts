
import { ValidatedBuyerInfo } from '@/types/participant';
import { toast } from 'sonner';

export function usePayReservedNumbers({
  setValidatedBuyerData,
  setSelectedNumbers,
  setIsPaymentModalOpen,
  debugMode = false
}) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PayReservedNumbers - ${context}]:`, data);
    }
  };

  return async (numbers: string[], participantData: ValidatedBuyerInfo) => {
    console.log("💰 usePaymentProcessor: handlePayReservedNumbers llamado con:", {
      numbers,
      participantData
    });

    if (numbers.length === 0) {
      toast.error('No hay números seleccionados para pagar');
      return;
    }

    try {
      setValidatedBuyerData(participantData);
      setSelectedNumbers(numbers);
      
      setIsPaymentModalOpen(true);
      
      debugLog("usePaymentProcessor: Modal de pago abierto con datos validados:", participantData);
    } catch (error) {
      console.error('usePaymentProcessor: ❌ Error al proceder al pago de números reservados:', error);
      toast.error('Error al procesar el pago de números reservados');
    }
  };
}
