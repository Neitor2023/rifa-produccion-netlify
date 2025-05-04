import { useState } from 'react';
import { PaymentFormData } from '@/components/PaymentModal';
import { ValidatedBuyerInfo } from '@/types/participant';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useParticipantManager } from './useParticipantManager';
import { useSelection } from './usePaymentProcessor/selection';
import { useModalState } from './usePaymentProcessor/modalState';
import { usePayment } from './usePaymentProcessor/payment';
import { useSellerValidation } from './usePaymentProcessor/sellerValidation';
import { useNumberAvailability } from './usePaymentProcessor/numberAvailability';
import { usePaymentCompletion } from './usePaymentProcessor/paymentCompletion';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';
import { useReservationHandling } from './usePaymentProcessor/reservationHandling';
import { useCompletePayment } from './usePaymentProcessor/completePayment';

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
  reservationDays?: number;
  lotteryDate?: Date;
}

export function usePaymentProcessor({
  raffleSeller,
  raffleId,
  raffleNumbers,
  refetchRaffleNumbers,
  debugMode = false,
  allowVoucherPrint = true,
  reservationDays,
  lotteryDate
}: UsePaymentProcessorProps) {
  const { selectedNumbers, setSelectedNumbers } = useSelection();
  const { isPaymentModalOpen, setIsPaymentModalOpen, isVoucherOpen, setIsVoucherOpen } = useModalState();
  const { paymentData, setPaymentData } = usePayment();
  const { validateSellerMaxNumbers, getSoldNumbersCount } = useSellerValidation(raffleSeller, raffleNumbers, debugMode);
  
  // Use the context instead of local state
  const { buyerInfo, setBuyerInfo } = useBuyerInfo();
  
  const { checkNumbersAvailability } = useNumberAvailability({ 
    raffleNumbers, 
    raffleSeller, 
    setValidatedBuyerData: setBuyerInfo, 
    debugMode 
  });
  
  const { uploadPaymentProof, processParticipant } = usePaymentCompletion({
    raffleSeller,
    raffleId,
    setValidatedBuyerData: setBuyerInfo,
    debugMode
  });
  
  const { handleReserveNumbers } = useReservationHandling({
    raffleSeller,
    raffleId,
    raffleNumbers,
    refetchRaffleNumbers,
    debugMode,
    reservationDays,
    lotteryDate,
    validateSellerMaxNumbers
  });
  
  const { findOrCreateParticipant } = useParticipantManager({ 
    raffleId, 
    debugMode, 
    raffleSeller,
    setValidatedBuyerData: setBuyerInfo
  });

  const { handleCompletePayment } = useCompletePayment({
    raffleSeller,
    raffleId,
    selectedNumbers,
    refetchRaffleNumbers,
    setPaymentData,
    setIsPaymentModalOpen,
    setIsVoucherOpen,
    allowVoucherPrint,
    uploadPaymentProof,
    processParticipant,
    supabase,
    debugMode
  });

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ${context}]:`, data);
    }
  };

  const handleProceedToPayment = async (numbers: string[]) => {
    console.log("💰 usePaymentProcessor: handleProceedToPayment called with numbers:", numbers);

    if (numbers.length === 0) {
      toast.error('Select at least one number to buy');
      return;
    }

    try {
      if (!(await validateSellerMaxNumbers(numbers.length))) {
        return;
      }

      const unavailableNumbers = await checkNumbersAvailability(numbers);
      if (unavailableNumbers.length > 0) {
        toast.error(`Numbers ${unavailableNumbers.join(', ')} are not available`);
        return;
      }
      
      setSelectedNumbers(numbers);
      setIsPaymentModalOpen(true);
      
    } catch (error) {
      console.error('usePaymentProcessor: ❌ Error proceeding to payment:', error);
      toast.error('Error processing payment');
    }
  };

  const handlePayReservedNumbers = async (numbers: string[], participantData: ValidatedBuyerInfo) => {
    console.log("💰 usePaymentProcessor: handlePayReservedNumbers called with:", {
      numbers,
      participantData
    });
    
    console.log("📧 usePaymentProcessor.ts:146 - Email recibido en handlePayReservedNumbers:", participantData?.email);

    if (numbers.length === 0) {
      toast.error('No numbers selected to pay');
      return;
    }

    try {
      setBuyerInfo(participantData);
      setSelectedNumbers(numbers);
      
      setIsPaymentModalOpen(true);
      
      debugLog("usePaymentProcessor: Payment modal opened with validated data:", participantData);
    } catch (error) {
      console.error('usePaymentProcessor: ❌ Error proceeding to payment of reserved numbers:', error);
      toast.error('Error processing payment of reserved numbers');
    }
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
