
import { useState, useEffect } from 'react';
import { PaymentFormData } from '@/components/PaymentModal';
import { toast } from 'sonner';
import { useParticipantManager } from './useParticipantManager';
import { useNumberStatus } from './useNumberStatus';
import { useSelection } from './usePaymentProcessor/selection';
import { useModalState } from './usePaymentProcessor/modalState';
import { usePayment } from './usePaymentProcessor/payment';
import { useBuyerData } from './usePaymentProcessor/buyerData';
import { useSellerValidation } from './usePaymentProcessor/sellerValidation';
import { useNumberAvailability } from './usePaymentProcessor/numberAvailability';
import { usePaymentCompletion } from './usePaymentProcessor/paymentCompletion';

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
}

export function usePaymentProcessor({
  raffleSeller,
  raffleId,
  raffleNumbers,
  refetchRaffleNumbers,
  debugMode = false
}: UsePaymentProcessorProps) {
  // Split out state logic
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
    debugMode
  });

  // Utilidad de registro de depuración
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ${context}]:`, data);
    }
  };

  const { findOrCreateParticipant } = useParticipantManager({ raffleId, debugMode, raffleSeller });
  const { updateRaffleNumbersStatus } = useNumberStatus({ raffleSeller, raffleId, raffleNumbers, debugMode });

  // Log the validated buyer data whenever it changes
  useEffect(() => {
    if (validatedBuyerData) {
      console.log("🔁 usePaymentProcessor validatedBuyerData:", 
        validatedBuyerData.name, 
        validatedBuyerData.phone, 
        validatedBuyerData.cedula
      );
    } else {
      console.log("🔁 usePaymentProcessor validatedBuyerData is undefined");
    }
  }, [validatedBuyerData]);

  // -----------------
  // RAFFLE NUMBER OPERATIONS
  // -----------------

  /**
   * Handles the reservation of multiple raffle numbers
   * @param numbers Array of number strings to reserve
   * @param buyerPhone Buyer's phone number
   * @param buyerName Buyer's name
   */
  const handleReserveNumbers = async (numbers: string[], buyerPhone?: string, buyerName?: string) => {
    if (!raffleSeller?.seller_id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    
    if (!buyerPhone || !buyerName) {
      toast.error('Nombre y teléfono son obligatorios para apartar números');
      return;
    }
    
    // Validate against seller's maximum allowed numbers
    if (!(await validateSellerMaxNumbers(numbers.length))) {
      return;
    }
    
    try {
      debugLog('Reserve numbers called with', { numbers, buyerPhone, buyerName });
      
      // Find or create participant
      const participantId = await findOrCreateParticipant(buyerPhone, buyerName);
      debugLog('Participant ID for reservation', participantId);
      
      if (!participantId) {
        toast.error('No se pudo crear o encontrar al participante');
        return;
      }
      
      // Update or insert raffle numbers
      await updateRaffleNumbersStatus(numbers, 'reserved', participantId);
      
      // Refresh data and reset selection
      await refetchRaffleNumbers();
      setSelectedNumbers([]);
      
      toast.success(`${numbers.length} número(s) apartados exitosamente`);
    } catch (error) {
      console.error('Error reserving numbers:', error);
      toast.error('Error al apartar números');
    }
  };
  
  // -----------------
  // PAYMENT PROCESSING
  // -----------------
  
  /**
   * Initiates the payment process for selected numbers
   * @param numbers Array of number strings to purchase
   */
  const handleProceedToPayment = async (numbers: string[]) => {
    if (numbers.length === 0) {
      toast.error('Seleccione al menos un número para comprar');
      return;
    }
    
    try {
      // Validate against seller's maximum allowed numbers
      if (!(await validateSellerMaxNumbers(numbers.length))) {
        return;
      }
      
      // Check number availability
      const unavailableNumbers = await checkNumbersAvailability(numbers);
      
      if (unavailableNumbers.length > 0) {
        toast.error(`Números ${unavailableNumbers.join(', ')} no están disponibles`);
        return;
      }
      
      // Check for existing participant on reserved numbers
      await checkReservedNumbersParticipant(numbers);
      
      // Proceed with payment
      setSelectedNumbers(numbers);
      setIsPaymentModalOpen(true);
    } catch (error) {
      console.error('Error proceeding to payment:', error);
      toast.error('Error al procesar el pago');
    }
  };
  
  // -----------------
  // PAYMENT COMPLETION
  // -----------------
  
  /**
   * Completes the payment process for selected numbers
   * @param data Payment form data from PaymentModal
   */
  const handleCompletePayment = async (data: PaymentFormData) => {
    if (!raffleSeller?.seller_id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    
    try {
      debugLog('Complete Payment - starting', {
        selectedNumbers,
        data,
        sellerId: raffleSeller.seller_id
      });
      
      // Validate against seller's maximum allowed numbers
      if (!(await validateSellerMaxNumbers(selectedNumbers.length))) {
        return;
      }
      
      // Upload payment proof if available
      const paymentProofUrl = await uploadPaymentProof(data.paymentProof);
      debugLog('Payment proof upload result', { paymentProofUrl });
      
      // Find or create participant
      const participantId = await processParticipant(data);
      debugLog('Participant processing result', { participantId });
      
      if (!participantId) {
        toast.error('Error al procesar la información del participante');
        return;
      }
      
      // Update numbers to sold status
      await updateNumbersToSold(selectedNumbers, participantId, paymentProofUrl, raffleNumbers);
      debugLog('Numbers updated to sold', { 
        count: selectedNumbers.length, 
        numbers: selectedNumbers 
      });
      
      // Refresh data
      await refetchRaffleNumbers();
      
      // Set payment data and show voucher
      setPaymentData({
        ...data,
        paymentProof: paymentProofUrl
      });
      
      setIsPaymentModalOpen(false);
      setIsVoucherOpen(true);
      
      toast.success('Pago completado exitosamente');
      debugLog('Payment completed successfully', null);
    } catch (error) {
      console.error('Error completing payment:', error);
      debugLog('Payment completion error', error);
      toast.error('Error al completar el pago');
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
    validatedBuyerData,
    debugMode,
    handleReserveNumbers,
    handleProceedToPayment,
    handleCompletePayment,
    findOrCreateParticipant,
    getSoldNumbersCount
  };
}
