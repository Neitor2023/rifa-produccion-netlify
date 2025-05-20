
import { toast } from 'sonner';
import { RaffleNumber } from '@/lib/constants/types';

export function useSellerValidation(raffleSeller: any, raffleNumbers: RaffleNumber[], debugMode = false) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - SellerValidation - ${context}]:`, data);
    }
  };

  /**
  * Valida que el vendedor no haya excedido su número máximo de ventas.
  * @param newNumbersCount Número de números nuevos a vender o reservar.
  * @returns Booleano que indica si la operación puede continuar.
  */
  const validateSellerMaxNumbers = async (newNumbersCount: number): Promise<boolean> => {
    if (!raffleSeller) {
      toast.error('Información del vendedor no disponible');
      return false;
    }

    const soldCount = getSoldNumbersCount(raffleSeller.seller_id);
    const maxAllowed = raffleSeller.cant_max;
    
    debugLog('Validación de números máximos de vendedores', { 
      soldCount, 
      newNumbersCount, 
      maxAllowed, 
      total: soldCount + newNumbersCount
    });
    
    if (soldCount + newNumbersCount > maxAllowed) {
      toast.error(`No puede vender más de ${maxAllowed} números en total. Ya ha vendido ${soldCount}.`);
      return false;
    }
    
    return true;
  };

  /**
  * Obtiene el recuento de números vendidos por un vendedor específico
  * @param sellerId El ID del vendedor
  * @returns Número de boletos vendidos
  */
  const getSoldNumbersCount = (sellerId: string): number => {
    if (!raffleNumbers || !sellerId) return 0;
    
    return raffleNumbers.filter(number => 
      number.seller_id === sellerId && 
      number.status === 'sold'
    ).length;
  };

  return {
    validateSellerMaxNumbers,
    getSoldNumbersCount
  };
}
