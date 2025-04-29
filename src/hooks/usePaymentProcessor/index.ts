
import { useState } from 'react';
import { useReserveNumbers } from './useReserveNumbers';
import { usePayReservedNumbers } from './usePayReservedNumbers';
import { useCompletePayment } from './useCompletePayment';
import { useBuyerData } from './buyerData';
import { useProceedToPayment } from './useProceedToPayment'; 
import { useSelection } from './selection';
import { useCheckNumberAvailability } from './numberAvailability';
import { useSellerValidation } from './sellerValidation';
import { usePayment } from './payment';
import { useModalState } from './modalState';
import { ValidatedBuyerInfo } from '@/types/participant';
import { usePaymentCompletion } from './paymentCompletion';
import { useParticipantManager } from '@/hooks/useParticipantManager';

// Valid UUID regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Helper to validate and provide fallback for UUIDs
const ensureValidUUID = (id: string | null | undefined, fallback: string): string => {
  if (id && UUID_PATTERN.test(id)) {
    return id;
  }
  console.warn(`Invalid UUID detected: "${id}", using fallback value instead`);
  return fallback;
};

// Main hook that combines all functionality
export function usePaymentProcessor({
  raffleId = '',
  raffleSeller = null,
  onSaleComplete,
  maxNumbersAllowed = 33,
  debugMode = false
}) {
  // Ensure we always have valid UUIDs
  const effectiveRaffleId = ensureValidUUID(
    raffleId, 
    "fd6bd3bc-d81f-48a9-be58-8880293a0472"
  );
  
  const effectiveSellerId = ensureValidUUID(
    raffleSeller?.seller_id,
    "76c5b100-1530-458b-84d6-29fae68cd5d2"
  );
  
  console.log("🔍 usePaymentProcessor: Using validated IDs:", {
    raffleId: effectiveRaffleId, 
    sellerId: effectiveSellerId, 
    originalRaffleId: raffleId,
    originalSellerId: raffleSeller?.seller_id
  });
  
  // Shared state
  const [validatedBuyerInfo, setValidatedBuyerInfo] = useState<ValidatedBuyerInfo | null>(null);
  
  // Use sub-hooks with validated parameters
  const { selectedNumbers, setSelectedNumbers, resetSelection } = useSelection();
  const { isPaymentModalOpen, setIsPaymentModalOpen, isVoucherOpen, setIsVoucherOpen } = useModalState();
  const { paymentData, setPaymentData, handleProofCheck } = usePayment();
  
  // Import sub-hooks with consistent parameters
  const { validateSellerMaxNumbers } = useSellerValidation({ 
    raffleSeller: {
      ...raffleSeller,
      seller_id: effectiveSellerId,
      cant_max: raffleSeller?.cant_max || 33
    }, 
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
  
  const reserveNumbersHook = useReserveNumbers({
    raffleId: effectiveRaffleId,
    sellerId: effectiveSellerId,
    debugMode
  });
  
  const payReservedNumbersHook = usePayReservedNumbers({
    setValidatedBuyerData: setValidatedBuyerInfo,
    setSelectedNumbers,
    setIsPaymentModalOpen,
    debugMode
  });
  
  const participantManager = useParticipantManager();
  
  // Get payment completion utilities
  const paymentCompletion = usePaymentCompletion({
    raffleSeller: {
      ...raffleSeller,
      seller_id: effectiveSellerId
    },
    raffleId: effectiveRaffleId,
    debugMode
  });
  
  const { uploadPaymentProof, processParticipant, updateNumbersToSold } = paymentCompletion;
  
  const buyerDataHook = useBuyerData({ 
    raffleId: effectiveRaffleId, 
    debugMode
  });
  
  // Setup complete payment handler
  const completePaymentHandler = useCompletePayment({
    raffleSeller: {
      ...raffleSeller,
      seller_id: effectiveSellerId
    },
    raffleId: effectiveRaffleId,
    selectedNumbers,
    validatedBuyerData: validatedBuyerInfo,
    validateSellerMaxNumbers,
    setIsPaymentModalOpen,
    setIsVoucherOpen,
    setPaymentData,
    resetSelection,
    handleProofCheck,
    uploadPaymentProof,
    processParticipant,
    updateNumbersToSold,
    debugMode
  });
  
  return {
    // Expose state
    selectedNumbers,
    setSelectedNumbers,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoucherOpen, 
    setIsVoucherOpen,
    paymentData,
    setPaymentData,
    validatedBuyerInfo,
    setValidatedBuyerInfo,
    
    // Expose actions
    handleProceedToPayment,
    reserveNumbers: reserveNumbersHook.reserveNumbers,
    isReserving: reserveNumbersHook.isReserving,
    payReservedNumbers: payReservedNumbersHook,
    completePayment: completePaymentHandler,
    isCompletingPayment: false,
    
    // Buyer data operations
    validateBuyerInfo: buyerDataHook.validateBuyerInfo,
    setBuyerInfo: buyerDataHook.setBuyerInfo,
    validateBuyerByCedula: buyerDataHook.validateBuyerByCedula,
    validateBuyerByPhone: buyerDataHook.validateBuyerByPhone,
    
    // Utilities
    resetSelection
  };
}
