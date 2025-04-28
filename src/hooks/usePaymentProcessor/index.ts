
import { useState } from 'react';
import { useReserveNumbers } from './useReserveNumbers';
import { usePayReservedNumbers } from './usePayReservedNumbers';
import { useCompletePayment } from './useCompletePayment';
import { useBuyerData } from './buyerData';
import { useProceedToPayment } from './useProceedToPayment'; 
import { useSelectionState } from './selection';
import { useCheckNumberAvailability } from './numberAvailability';
import { useSellerValidation } from './sellerValidation';
import { usePayment } from './payment';
import { useModalState } from './modalState';
import { ValidatedBuyerInfo } from '@/types/participant';

// Main hook that combines all functionality
export function usePaymentProcessor({
  raffleId = '',
  raffleSeller = null,
  onSaleComplete,
  maxNumbersAllowed = 33,
  debugMode = false
}) {
  // Ensure we always have a valid raffleId and sellerId
  const effectiveRaffleId = raffleId || "fd6bd3bc-d81f-48a9-be58-8880293a0472";
  const effectiveSellerId = raffleSeller?.seller_id || "0102030405";
  
  console.log("usePaymentProcessor: Using raffleId:", effectiveRaffleId, "sellerId:", effectiveSellerId);
  
  // Shared state
  const [validatedBuyerInfo, setValidatedBuyerInfo] = useState<ValidatedBuyerInfo | null>(null);
  
  // Use sub-hooks with validated parameters
  const { selectedNumbers, setSelectedNumbers, resetSelection } = useSelectionState();
  const { isPaymentModalOpen, setIsPaymentModalOpen, isVoucherModalOpen, setIsVoucherModalOpen } = useModalState();
  const { paymentData, setPaymentData, handleProofCheck } = usePayment();
  
  // Import sub-hooks with consistent parameters
  const { validateSellerMaxNumbers } = useSellerValidation({ 
    maxNumbersAllowed, 
    debugMode 
  });
  
  const { checkNumbersAvailability } = useCheckNumberAvailability({
    raffleId: effectiveRaffleId,
    sellerId: effectiveSellerId,
    debugMode
  });
  
  const handleProceedToPayment = useProceedToPayment({
    validateSellerMaxNumbers,
    checkNumbersAvailability,
    setSelectedNumbers,
    setIsPaymentModalOpen,
    debugMode
  });
  
  const { reserveNumbers, isReserving } = useReserveNumbers({
    raffleId: effectiveRaffleId,
    sellerId: effectiveSellerId,
    debugMode
  });
  
  const { payReservedNumbers } = usePayReservedNumbers({
    raffleId: effectiveRaffleId,
    raffleSeller,
    debugMode
  });
  
  const { completePayment, isCompletingPayment } = useCompletePayment({ 
    raffleId: effectiveRaffleId, 
    sellerId: effectiveSellerId,
    selectedNumbers,
    validatedBuyerInfo,
    setIsPaymentModalOpen,
    setIsVoucherModalOpen,
    setPaymentData,
    resetSelection,
    onSaleComplete,
    handleProofCheck,
    debugMode
  });
  
  const { 
    validateBuyerInfo,
    setBuyerInfo,
    validateBuyerByCedula,
    validateBuyerByPhone 
  } = useBuyerData({ 
    raffleId: effectiveRaffleId, 
    debugMode,
    setValidatedBuyerInfo
  });
  
  return {
    // Expose state
    selectedNumbers,
    setSelectedNumbers,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoucherModalOpen,
    setIsVoucherModalOpen,
    paymentData,
    setPaymentData,
    validatedBuyerInfo,
    setValidatedBuyerInfo,
    
    // Expose actions
    handleProceedToPayment,
    reserveNumbers,
    isReserving,
    payReservedNumbers,
    completePayment,
    isCompletingPayment,
    validateBuyerInfo,
    setBuyerInfo,
    validateBuyerByCedula,
    validateBuyerByPhone,
    
    // Utilities
    resetSelection
  };
}
