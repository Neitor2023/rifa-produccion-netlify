
import { useState } from 'react';
import { PaymentFormData } from '@/components/PaymentModal';
import { toast } from 'sonner';
import { useParticipantManager } from './useParticipantManager';
import { useNumberStatus } from './useNumberStatus';
import { useSelection } from './usePaymentProcessor/selection';
import { useModalState } from './usePaymentProcessor/modalState';
import { usePayment } from './usePaymentProcessor/payment';
import { useSellerValidation } from './usePaymentProcessor/sellerValidation';
import { useNumberAvailability } from './usePaymentProcessor/numberAvailability';
import { usePaymentCompletionHandler } from './usePaymentProcessor/paymentCompletionHandler';
import { useReservationHandler } from './usePaymentProcessor/reservationHandler';
import { usePaymentHandler } from './usePaymentProcessor/paymentHandler';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';

interface UsePaymentProcessorProps {
  raffleSeller: {
    id: string;
    seller_id: string;
    cant_max: number;
    active: boolean;
  } | null;
  raffleId: string;
  raffleNumbers: any[];
  refetchRaffleNumbers: () => Promise<any>;
  debugMode?: boolean;
  allowVoucherPrint?: boolean;
}

export function usePaymentProcessor({
  raffleSeller,
  raffleId,
  raffleNumbers,
  refetchRaffleNumbers,
  debugMode = false,
  allowVoucherPrint = true
}: UsePaymentProcessorProps) {
  const { selectedNumbers, setSelectedNumbers } = useSelection();
  const { isPaymentModalOpen, setIsPaymentModalOpen, isVoucherOpen, setIsVoucherOpen } = useModalState();
  const { paymentData, setPaymentData, handleProofCheck } = usePayment();
  const { validateSellerMaxNumbers, getSoldNumbersCount } = useSellerValidation(raffleSeller, raffleNumbers, debugMode);
  
  // Use the context instead of local state
  const { buyerInfo, setBuyerInfo } = useBuyerInfo();
  
  const { checkNumbersAvailability } = useNumberAvailability({ 
    raffleNumbers, 
    raffleSeller, 
    setValidatedBuyerData: setBuyerInfo,
    debugMode 
  });
  
  const { updateRaffleNumbersStatus } = useNumberStatus({ 
    raffleSeller, 
    raffleId, 
    raffleNumbers, 
    debugMode 
  });
  
  const { findOrCreateParticipant } = useParticipantManager({ 
    raffleId, 
    debugMode, 
    raffleSeller, 
    setValidatedBuyerData: setBuyerInfo
  });

  // Payment handlers
  const { handleCompletePayment: completePayment } = usePaymentCompletionHandler({
    raffleSeller,
    raffleId,
    refetchRaffleNumbers,
    allowVoucherPrint,
    debugMode
  });

  // Payment handlers
  const { handleProceedToPayment, handlePayReservedNumbers } = usePaymentHandler({
    validateSellerMaxNumbers,
    checkNumbersAvailability,
    setSelectedNumbers,
    setIsPaymentModalOpen,
    setBuyerInfo,
    debugMode
  });
  
  // Reservation handlers
  const { handleReserveNumbers } = useReservationHandler({
    raffleSeller,
    validateSellerMaxNumbers,
    findOrCreateParticipant,
    updateRaffleNumbersStatus,
    refetchRaffleNumbers,
    debugMode
  });

  const handleCompletePayment = async (data: PaymentFormData) => {
    await completePayment({
      selectedNumbers,
      paymentData: data,
      buyerInfo,
      setIsPaymentModalOpen,
      setIsVoucherOpen,
      setPaymentData,
    });
  };

  return {
    selectedNumbers,
    setSelectedNumbers,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData,
    setPaymentData,
    debugMode,
    handleReserveNumbers,
    handleProceedToPayment,
    handlePayReservedNumbers,
    handleCompletePayment,
    findOrCreateParticipant,
    getSoldNumbersCount,
    allowVoucherPrint
  };
}
