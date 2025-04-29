
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
  const effectiveSellerId = raffleSeller?.seller_id || "76c5b100-1530-458b-84d6-29fae68cd5d2"; // Valid UUID
  
  console.log("usePaymentProcessor: Using raffleId:", effectiveRaffleId, "sellerId:", effectiveSellerId);
  
  // Shared state
  const [validatedBuyerInfo, setValidatedBuyerInfo] = useState<ValidatedBuyerInfo | null>(null);
  
  // Use sub-hooks with validated parameters
  const { selectedNumbers, setSelectedNumbers, resetSelection } = useSelection();
  const { isPaymentModalOpen, setIsPaymentModalOpen, isVoucherOpen, setIsVoucherOpen } = useModalState();
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
    completePayment: async (data) => {
      try {
        console.log("🔄 handleCompletePayment called with data:", data);
        
        if (!validatedBuyerInfo) {
          console.error("Missing validated buyer info in completePayment");
        }
        
        const paymentProofUrl = await uploadPaymentProof(data.paymentProof);
        
        let participantId: string | null;
        
        if (validatedBuyerInfo?.id) {
          participantId = validatedBuyerInfo.id;
          console.log("Using existing participant ID:", participantId);
        } else {
          participantId = await processParticipant(data);
        }
        
        if (!participantId) {
          throw new Error('Error al procesar la información del participante');
        }
        
        await updateNumbersToSold(selectedNumbers, participantId, paymentProofUrl);
        
        setPaymentData({
          ...data,
          paymentProof: paymentProofUrl
        });
        
        setIsPaymentModalOpen(false);
        setIsVoucherOpen(true);
        
        // Reset selection after successful payment
        resetSelection();
        
        return true;
      } catch (error) {
        console.error('Error al completar el pago:', error);
        throw error;
      }
    },
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
