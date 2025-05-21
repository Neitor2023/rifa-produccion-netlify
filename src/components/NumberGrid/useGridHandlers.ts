
import { useState } from 'react';
import { toast } from 'sonner';
import { ValidatedBuyerInfo } from '@/types/participant';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';
import { useReservationHandling } from './hooks/useReservationHandling';
import { useNumberToggling } from './hooks/useNumberToggling';
import { useReservedNumbersHandling } from './hooks/useReservedNumbersHandling';
import { useValidationHandling } from './hooks/useValidationHandling';
import { usePaymentHandling } from './hooks/usePaymentHandling';

interface UseGridHandlersProps {
  numbers: any[];
  raffleSeller: {
    id: string;
    raffle_id: string;
    seller_id: string;
    active: boolean;
    cant_max: number;
  };
  onReserve: (selectedNumbers: string[], buyerPhone?: string, buyerName?: string, buyerCedula?: string) => Promise<void>;
  onProceedToPayment: (selectedNumbers: string[], participantData?: ValidatedBuyerInfo, clickedButton?: string) => Promise<void>;
  debugMode?: boolean;
  reservationDays?: number;
  lotteryDate?: Date;
  totalNumbers?: number;
  soldNumbersCount?: number;
}

export const useGridHandlers = ({
  numbers,
  raffleSeller,
  onReserve,
  onProceedToPayment,
  debugMode = true,
  reservationDays,
  lotteryDate,
  totalNumbers,
  soldNumbersCount = 0
}: UseGridHandlersProps) => {
  // States for modals
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [clickedPaymentButton, setClickedPaymentButton] = useState<string | undefined>(undefined);
  
  // Context hooks
  const { setBuyerInfo } = useBuyerInfo();
  const {
    selectedNumbers,
    setSelectedNumbers,
    highlightReserved,
    setHighlightReserved,
    showReservedMessage,
    setShowReservedMessage,
    selectedReservedNumber,
    setSelectedReservedNumber,
    clearSelectionState
  } = useNumberSelection();
  
  // Custom hooks for specific functionality
  const { handleToggleNumber } = useNumberToggling({
    numbers,
    raffleSeller,
    highlightReserved,
    setIsPhoneModalOpen,
    setSelectedNumbers,
    setSelectedReservedNumber,
    totalNumbers,
    soldNumbersCount,
    debugMode
  });
  
  const { handleReservedPayment, handleCloseReservedMessage } = useReservedNumbersHandling({
    numbers,
    highlightReserved,
    setHighlightReserved,
    setShowReservedMessage,
    setClickedPaymentButton
  });
  
  const { handleReserve, handleConfirmReservation } = useReservationHandling({
    selectedNumbers,
    onReserve,
    setIsReservationModalOpen,
    setSelectedNumbers,
    reservationDays,
    lotteryDate,
    debugMode
  });
  
  const { handleProceedToPayment } = usePaymentHandling({
    selectedNumbers,
    raffleSeller,
    onProceedToPayment,
    setClickedPaymentButton,
    debugMode
  });
  
  const { handleValidationSuccess } = useValidationHandling({
    selectedNumbers,
    onProceedToPayment,
    setBuyerInfo,
    setIsPhoneModalOpen,
    setShowReservedMessage,
    clickedPaymentButton,
    debugMode
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
    toggleNumber: handleToggleNumber,
    handlePayReserved: handleReservedPayment,
    handleCloseReservedMessage,
    clearSelectionState,
    handleReserve,
    handleConfirmReservation,
    handleProceedToPayment,
    handleValidationSuccess
  };
};
