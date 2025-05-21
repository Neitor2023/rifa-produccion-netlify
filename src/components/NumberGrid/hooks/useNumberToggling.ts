
import { toast } from 'sonner';

interface UseNumberTogglingProps {
  numbers: any[];
  raffleSeller: {
    id: string;
    raffle_id: string;
    seller_id: string;
    active: boolean;
    cant_max: number;
  };
  highlightReserved: boolean;
  setIsPhoneModalOpen: (isOpen: boolean) => void;
  setSelectedNumbers: (updater: ((prev: string[]) => string[]) | string[]) => void;
  setSelectedReservedNumber: (number: string) => void;
  totalNumbers?: number;
  soldNumbersCount?: number;
  debugMode?: boolean;
}

export const useNumberToggling = ({
  numbers,
  raffleSeller,
  highlightReserved,
  setIsPhoneModalOpen,
  setSelectedNumbers,
  setSelectedReservedNumber,
  totalNumbers,
  soldNumbersCount = 0,
  debugMode = false
}: UseNumberTogglingProps) => {
  
  const handleToggleNumber = (number: string, status: string) => {
    if (debugMode) {
      console.log(`NumberGrid: Alternar número llamado con número=${number}, status=${status}`);
    }
    
    if (highlightReserved && status === 'reserved') {
      const selectedNumber = numbers.find(n => n.number === number);
      if (selectedNumber) {
        const allReservedNumbers = numbers
          .filter(n => 
            n.status === 'reserved' && 
            n.participant_id === selectedNumber.participant_id
          )
          .map(n => n.number);
          
        setSelectedNumbers(allReservedNumbers);
        setSelectedReservedNumber(number);
        setIsPhoneModalOpen(true);
      }
      return;
    }
    
    if (status !== 'available') return;
    
    // Calcular el número máximo disponible
    const maxAvailableNumbers = raffleSeller.cant_max;
    
    // Calcule los números restantes disponibles según los números totales (si se proporcionan) o el máximo del vendedor
    let remainingAvailable: number;
    
    // Si se proporciona totalNumbers, calcule cuántos números están realmente disponibles
    if (totalNumbers && typeof totalNumbers === 'number') {
      // Calcula cuántos números quedan todavía disponibles para la venta
      const availableNumbers = Math.max(0, totalNumbers - soldNumbersCount + 1);      
      // Tome el mínimo entre los números disponibles y el número máximo de vendedores
      remainingAvailable = Math.min((maxAvailableNumbers - soldNumbersCount + 1), availableNumbers);           
    } else {
      // Recurre a utilizar únicamente el máximo del vendedor
      remainingAvailable = maxAvailableNumbers;
    }
      
    if (debugMode) {
      console.log('NumberGrid: Cálculo de números disponibles:', {
        totalNumbers,
        soldNumbersCount,
        maxAvailableNumbers,
        remainingAvailable
      });
    }
    
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        // Marcar si añadir este número excedería el máximo permitido
        if (prev.length >= remainingAvailable) {
          toast.error(`Se ha superado la cantidad de números permitidos del vendedor, por favor finalice su selección de números.`);
          return prev;
        }
        return [...prev, number];
      }
    });
  };
  
  return { handleToggleNumber };
};
