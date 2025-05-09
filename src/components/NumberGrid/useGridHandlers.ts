
import { useState } from 'react';
import { useNumberGridState } from './useNumberGridState';
import { useNumberValidation } from './useNumberValidation';
import { useReservationHandling } from './useReservationHandling';

interface UseGridHandlersProps {
  numbers: any[];
  raffleSeller: {
    id: string;
    raffle_id: string;
    seller_id: string;
    active: boolean;
    cant_max: number;
  };
  onReserve: (numbers: string[], buyerPhone?: string, buyerName?: string, buyerCedula?: string) => Promise<void>;
  onProceedToPayment: (numbers: string[], participantData?: any, clickedButton?: string) => Promise<void>;
  debugMode?: boolean;
  reservationDays?: number;
  lotteryDate?: Date;
}

// Main hook for grid handlers, delegating to specialized sub-hooks
export const useGridHandlers = (props: UseGridHandlersProps) => {
  const { 
    numbers, 
    raffleSeller,
    onReserve, 
    onProceedToPayment, 
    debugMode = false,
    reservationDays,
    lotteryDate
  } = props;

  console.log("🔄 useGridHandlers: Entry point with props", { 
    numberCount: numbers.length,
    raffleSellerId: raffleSeller.id,
    debugMode,
    reservationDays,
    lotteryDate: lotteryDate?.toISOString()
  });

  // States for modals
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [clickedPaymentButton, setClickedPaymentButton] = useState<string | undefined>(undefined);
  
  // Access other specialized hooks
  const {
    selectedNumbers,
    setSelectedNumbers,
    highlightReserved,
    setHighlightReserved,
    showReservedMessage,
    setShowReservedMessage,
    selectedReservedNumber,
    setSelectedReservedNumber,
    clearSelectionState,
    toggleNumber
  } = useNumberGridState({
    numbers,
    raffleSeller,
    debugMode
  });

  // Reservation handling
  const {
    handlePayReserved,
    handleCloseReservedMessage,
    handleReserve,
    handleConfirmReservation
  } = useReservationHandling({
    numbers,
    selectedNumbers,
    setSelectedNumbers,
    highlightReserved,
    setHighlightReserved,
    showReservedMessage,
    setShowReservedMessage,
    selectedReservedNumber,
    setSelectedReservedNumber,
    setIsPhoneModalOpen,
    setIsReservationModalOpen,
    onReserve,
    debugMode,
    reservationDays,
    lotteryDate,
    raffleSeller,
    setClickedPaymentButton
  });

  // Number validation and payment
  const {
    handleProceedToPayment,
    handleValidationSuccess,
    handleParticipantValidation,
    handleNumberValidation
  } = useNumberValidation({
    numbers, 
    selectedNumbers,
    raffleSeller,
    onProceedToPayment,
    debugMode,
    clickedPaymentButton,
    setClickedPaymentButton
  });

  console.log("✅ useGridHandlers: Exit with state", {
    selectedCount: selectedNumbers.length,
    highlightReserved,
    showReservedMessage
  });

  return {
    // State
    isPhoneModalOpen,
    setIsPhoneModalOpen,
    isReservationModalOpen,
    setIsReservationModalOpen,
    selectedNumbers,
    highlightReserved,
    showReservedMessage,
    selectedReservedNumber,
    clickedPaymentButton,
    
    // Handlers
    handlePayReserved,
    handleCloseReservedMessage,
    toggleNumber,
    clearSelectionState,
    handleReserve,
    handleConfirmReservation,
    handleProceedToPayment,
    handleValidationSuccess,
    handleParticipantValidation,
    handleNumberValidation
  };
};
