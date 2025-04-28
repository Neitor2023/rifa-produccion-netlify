
import { useState } from 'react';
import { PaymentFormData } from '@/components/PaymentModal';
import { ValidatedBuyerInfo } from '@/types/participant';
import { toast } from 'sonner';
import { useParticipantManager } from '../useParticipantManager';
import { useNumberStatus } from '../useNumberStatus';
import { useSelection } from './selection';
import { useModalState } from './modalState';
import { usePayment } from './payment';
import { useBuyerData } from './buyerData';
import { useSellerValidation } from './sellerValidation';
import { useNumberAvailability } from './numberAvailability';
import { usePaymentCompletion } from './paymentCompletion';
import { useReserveNumbers } from './useReserveNumbers';
import { useProceedToPayment } from './useProceedToPayment';
import { usePayReservedNumbers } from './usePayReservedNumbers';
import { useCompletePayment } from './useCompletePayment';

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
    setValidatedBuyerData,
    debugMode
  });
  
  const { updateRaffleNumbersStatus } = useNumberStatus({ 
    raffleSeller, 
    raffleId, 
    raffleNumbers, 
    debugMode 
  });
  
  const participantManager = useParticipantManager();

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ${context}]:`, data);
    }
  };

  // Use extracted handlers
  const handleReserveNumbers = useReserveNumbers({
    raffleSeller,
    raffleId,
    validateSellerMaxNumbers,
    participantManager,
    updateRaffleNumbersStatus,
    refetchRaffleNumbers,
    setSelectedNumbers,
    debugMode
  });

  const handleProceedToPayment = useProceedToPayment({
    validateSellerMaxNumbers,
    checkNumbersAvailability,
    setSelectedNumbers,
    setIsPaymentModalOpen,
    debugMode
  });

  const handlePayReservedNumbers = usePayReservedNumbers({
    setValidatedBuyerData,
    setSelectedNumbers,
    setIsPaymentModalOpen,
    debugMode
  });

  const handleCompletePayment = useCompletePayment({
    raffleSeller,
    raffleId,
    selectedNumbers,
    validatedBuyerData,
    validateSellerMaxNumbers,
    uploadPaymentProof,
    processParticipant,
    updateNumbersToSold,
    raffleNumbers,
    refetchRaffleNumbers,
    setPaymentData,
    setIsPaymentModalOpen,
    setIsVoucherOpen,
    allowVoucherPrint,
    debugMode
  });

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
    handlePayReservedNumbers,
    handleCompletePayment,
    getSoldNumbersCount,
    allowVoucherPrint
  };
}

// Re-export the hook as the default export
export default usePaymentProcessor;
