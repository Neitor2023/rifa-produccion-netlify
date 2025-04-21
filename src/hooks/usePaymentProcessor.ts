
import { useSelection } from './usePaymentProcessor/selection';
import { useModalState } from './usePaymentProcessor/modalState';
import { usePayment } from './usePaymentProcessor/payment';
import { useBuyerData } from './usePaymentProcessor/buyerData';
import { useSellerValidation } from './usePaymentProcessor/sellerValidation';
import { useNumberAvailability } from './usePaymentProcessor/numberAvailability';
import { usePaymentCompletion } from './usePaymentProcessor/paymentCompletion';
import { useRaffleReservation } from './usePaymentProcessor/reservation';
import { usePaymentProceed } from './usePaymentProcessor/proceed';
import { usePaymentComplete } from './usePaymentProcessor/complete';

export function usePaymentProcessor({
  raffleSeller,
  raffleId,
  raffleNumbers,
  refetchRaffleNumbers,
  debugMode = false
}) {
  const { selectedNumbers, setSelectedNumbers } = useSelection();
  const { isPaymentModalOpen, setIsPaymentModalOpen, isVoucherOpen, setIsVoucherOpen } = useModalState();
  const { paymentData, setPaymentData } = usePayment();
  const { validatedBuyerData, setValidatedBuyerData } = useBuyerData();
  const { validateSellerMaxNumbers, getSoldNumbersCount } = useSellerValidation(raffleSeller, raffleNumbers, debugMode);
  const { checkNumbersAvailability, checkReservedNumbersParticipant } = useNumberAvailability({ 
    raffleNumbers, 
    raffleSeller, 
    setValidatedBuyerData,
    debugMode 
  });
  const { uploadPaymentProof, processParticipant, updateNumbersToSold } = usePaymentCompletion({
    raffleSeller,
    raffleId,
    debugMode
  });

  const { handleReserveNumbers } = useRaffleReservation({
    raffleId, raffleSeller, raffleNumbers,
    refetchRaffleNumbers, setSelectedNumbers, debugMode, validateSellerMaxNumbers
  });

  const { handleProceedToPayment } = usePaymentProceed({
    validateSellerMaxNumbers, checkNumbersAvailability, checkReservedNumbersParticipant,
    setSelectedNumbers, setIsPaymentModalOpen, debugMode
  });

  const { handleCompletePayment } = usePaymentComplete({
    raffleSeller, selectedNumbers, validateSellerMaxNumbers,
    uploadPaymentProof, processParticipant, updateNumbersToSold,
    refetchRaffleNumbers, setPaymentData, setIsPaymentModalOpen, setIsVoucherOpen,
    debugMode, raffleNumbers
  });

  // Only export what is needed
  return {
    selectedNumbers,
    setSelectedNumbers,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData,
    setPaymentData,
    validatedBuyerData,
    setValidatedBuyerData,
    debugMode,
    handleReserveNumbers,
    handleProceedToPayment,
    handleCompletePayment,
    getSoldNumbersCount
  };
}
