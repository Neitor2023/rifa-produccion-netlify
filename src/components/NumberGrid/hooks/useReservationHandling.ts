import { toast } from 'sonner';

interface UseReservationHandlingProps {
  selectedNumbers: string[];
  onReserve: (selectedNumbers: string[], buyerPhone?: string, buyerName?: string, buyerCedula?: string) => Promise<void>;
  setIsReservationModalOpen: (isOpen: boolean) => void;
  setSelectedNumbers: (numbers: string[]) => void;
  reservationDays?: number;
  lotteryDate?: Date;
  debugMode?: boolean;
}

export const useReservationHandling = ({
  selectedNumbers,
  onReserve,
  setIsReservationModalOpen,
  setSelectedNumbers,
  reservationDays,
  lotteryDate,
  debugMode = false
}: UseReservationHandlingProps) => {
  
  const handleReserve = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Seleccione al menos un número para reservar');
      return;
    }
    setIsReservationModalOpen(true);
  };
  
  const handleConfirmReservation = (data: { buyerName: string; buyerPhone: string; buyerCedula: string }) => {
    if (debugMode) {
      console.log('NumberGrid: Reservation data:', data);
      console.log('NumberGrid: Selected numbers:', selectedNumbers);
      console.log('NumberGrid: Reservation days:', reservationDays);
      console.log('NumberGrid: Lottery date:', lotteryDate);
    }
    
    if (!data.buyerName || !data.buyerPhone) {
      toast.error('Nombre y teléfono son requeridos');
      return;
    }
    
    // Calcular la fecha de vencimiento de la reserva según reservationDays y lotteryDate
    let reservationExpiresAt: Date;
    
    // Obtener la fecha actual
    const currentDate = new Date();
    
    // Calculate the date after adding the reservation days
    // Use the reservationDays if provided, otherwise default to a reasonable value
    const daysToAdd = typeof reservationDays === 'number' ? reservationDays : 5;
    
    if (debugMode) {
      console.log('NumberGrid: Using reservation days:', daysToAdd);
    }
    
    // Create a new date by adding the specified days
    const expirationDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    
    // Determine if we should use the lottery date if it comes before the calculated expiration
    if (lotteryDate && lotteryDate instanceof Date && !isNaN(lotteryDate.getTime())) {
      // Valid lottery date, compare with expiration date
      if (expirationDate.getTime() > lotteryDate.getTime()) {
        // If expiration would be after the lottery, use the lottery date instead
        reservationExpiresAt = new Date(lotteryDate);
        if (debugMode) {
          console.log('NumberGrid: Utilizando la fecha de lotería como fecha de vencimiento:', reservationExpiresAt.toISOString());
        }
      } else {
        // Otherwise use the calculated expiration date
        reservationExpiresAt = expirationDate;
        if (debugMode) {
          console.log('NumberGrid: Usando la fecha de vencimiento calculada:', reservationExpiresAt.toISOString());
        }
      }
    } else {
      // No valid lottery date, just use the calculated expiration date
      reservationExpiresAt = expirationDate;
      if (debugMode) {
        console.log('NumberGrid: No hay fecha de lotería válida, se utiliza el vencimiento calculado:', reservationExpiresAt.toISOString());
      }
    }
    
    // Pass the calculated reservation expiration date to onReserve
    onReserve(selectedNumbers, data.buyerPhone, data.buyerName, data.buyerCedula);
    setIsReservationModalOpen(false);
    setSelectedNumbers([]);
  };
  
  return {
    handleReserve,
    handleConfirmReservation
  };
};
