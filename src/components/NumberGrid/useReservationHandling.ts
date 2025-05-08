import { toast } from 'sonner';

interface UseReservationHandlingProps {
  numbers: any[];
  selectedNumbers: string[];
  setSelectedNumbers: (numbers: string[]) => void;
  highlightReserved: boolean;
  setHighlightReserved: (highlight: boolean) => void;
  showReservedMessage: boolean;
  setShowReservedMessage: (show: boolean) => void;
  selectedReservedNumber: string | null;
  setSelectedReservedNumber: (number: string | null) => void;
  setIsPhoneModalOpen: (isOpen: boolean) => void;
  setIsReservationModalOpen: (isOpen: boolean) => void;
  onReserve: (numbers: string[], phone?: string, name?: string, cedula?: string) => Promise<void>;
  debugMode?: boolean;
  reservationDays?: number;
  lotteryDate?: Date;
  raffleSeller: any;
  setClickedPaymentButton: (button: string | undefined) => void;
}

export const useReservationHandling = ({
  numbers,
  selectedNumbers,
  setSelectedNumbers,
  highlightReserved,
  setHighlightReserved,
  showReservedMessage,
  setShowReservedMessage,
  setIsPhoneModalOpen,
  setIsReservationModalOpen,
  onReserve,
  debugMode = false,
  reservationDays,
  lotteryDate,
  raffleSeller,
  setClickedPaymentButton
}: UseReservationHandlingProps) => {
  console.log("🔄 useReservationHandling: Entry point");
  
  const handlePayReserved = () => {
    console.log('useReservationHandling: handlePayReserved called');
    
    setClickedPaymentButton("Pagar Apartados");
    
    if (highlightReserved) {
      return;
    }
    
    const reservedNumbers = numbers.filter(n => n.status === 'reserved');
    if (reservedNumbers.length === 0) {
      toast.warning('No reserved numbers to pay');
      setShowReservedMessage(false);
      return;
    }
    
    setHighlightReserved(true);
    setShowReservedMessage(true);
    toast.info(`There are ${reservedNumbers.length} reserved number(s). Select one to proceed with payment.`);
  };
  
  const handleCloseReservedMessage = () => {
    setShowReservedMessage(false);
  };
  
  const handleReserve = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Select at least one number to reserve');
      return;
    }
    setIsReservationModalOpen(true);
  };
  
  const handleConfirmReservation = async (data: { buyerName: string; buyerPhone: string; buyerCedula: string }) => {
    if (debugMode) {
      console.log('useReservationHandling: Reservation data:', data);
      console.log('useReservationHandling: Selected numbers:', selectedNumbers);
      console.log('useReservationHandling: Reservation days:', reservationDays);
      console.log('useReservationHandling: Lottery date:', lotteryDate);
    }
    
    if (!data.buyerName || !data.buyerPhone) {
      toast.error('Name and phone are required');
      return;
    }
    
    // Calculate the reservation expiration date based on reservationDays and lotteryDate
    let reservationExpiresAt: Date;
    
    // Get the current date
    const currentDate = new Date();
    
    // Calculate the date after adding the reservation days
    // Use the reservationDays if provided, otherwise default to a reasonable value
    const daysToAdd = typeof reservationDays === 'number' ? reservationDays : 5;
    
    if (debugMode) {
      console.log('useReservationHandling: Using reservation days:', daysToAdd);
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
          console.log('useReservationHandling: Using lottery date as expiration:', reservationExpiresAt.toISOString());
        }
      } else {
        // Otherwise use the calculated expiration date
        reservationExpiresAt = expirationDate;
        if (debugMode) {
          console.log('useReservationHandling: Using calculated expiration date:', reservationExpiresAt.toISOString());
        }
      }
    } else {
      // No valid lottery date, just use the calculated expiration date
      reservationExpiresAt = expirationDate;
      if (debugMode) {
        console.log('useReservationHandling: No valid lottery date, using calculated expiration:', reservationExpiresAt.toISOString());
      }
    }
    
    // Pass the calculated reservation expiration date to onReserve
    await onReserve(selectedNumbers, data.buyerPhone, data.buyerName, data.buyerCedula);
    setIsReservationModalOpen(false);
    setSelectedNumbers([]);
  };
  
  console.log("✅ useReservationHandling: Exit");
  
  return {
    handlePayReserved,
    handleCloseReservedMessage,
    handleReserve,
    handleConfirmReservation
  };
};
