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

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ${context}]:`, data);
    }
  };

  const { findOrCreateParticipant } = useParticipantManager({ raffleId, debugMode, raffleSeller });
  const { updateRaffleNumbersStatus } = useNumberStatus({ raffleSeller, raffleId, raffleNumbers, debugMode });

  useEffect(() => {
    if (validatedBuyerData) {
      console.log("🔄 usePaymentProcessor validatedBuyerData updated:", {
        name: validatedBuyerData.name,
        phone: validatedBuyerData.phone,
        cedula: validatedBuyerData.cedula || 'N/A',
        direccion: validatedBuyerData.direccion || 'N/A',
        sugerencia_producto: validatedBuyerData.sugerencia_producto || 'N/A'
      });
    } else {
      console.log("🔄 usePaymentProcessor validatedBuyerData is null");
    }
  }, [validatedBuyerData]);

  const handleReserveNumbers = async (
    numbers: string[], 
    buyerPhone?: string, 
    buyerName?: string, 
    buyerCedula?: string
  ) => {
    console.log("🎯 handleReserveNumbers called with:", {
      numbers,
      buyerPhone,
      buyerName,
      buyerCedula
    });
    
    if (!raffleSeller?.seller_id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    
    if (!buyerPhone || !buyerName) {
      toast.error('Nombre y teléfono son obligatorios para apartar números');
      return;
    }
    
    if (!(await validateSellerMaxNumbers(numbers.length))) {
      return;
    }
    
    try {
      debugLog('Reserve numbers called with', { numbers, buyerPhone, buyerName, buyerCedula });
      
      const participantId = await findOrCreateParticipant(buyerPhone, buyerName, buyerCedula);
      console.log("👤 Participant created/found:", participantId);
      
      if (!participantId) {
        toast.error('No se pudo crear o encontrar al participante');
        return;
      }
      
      await updateRaffleNumbersStatus(
        numbers, 
        'reserved', 
        participantId, 
        { 
          buyerName: buyerName, 
          buyerPhone: buyerPhone, 
          buyerCedula: buyerCedula 
        }
      );
      
      await refetchRaffleNumbers();
      setSelectedNumbers([]);
      
      toast.success(`${numbers.length} número(s) apartados exitosamente`);
    } catch (error) {
      console.error('❌ Error reserving numbers:', error);
      toast.error('Error al apartar números');
    }
  };

  const handleProceedToPayment = async (numbers: string[]) => {
    console.log("💰 handleProceedToPayment called with numbers:", numbers);
    
    if (numbers.length === 0) {
      toast.error('Seleccione al menos un número para comprar');
      return;
    }
    
    try {
      if (!(await validateSellerMaxNumbers(numbers.length))) {
        return;
      }
      
      const unavailableNumbers = await checkNumbersAvailability(numbers);
      
      if (unavailableNumbers.length > 0) {
        toast.error(`Números ${unavailableNumbers.join(', ')} no están disponibles`);
        return;
      }
      
      await checkReservedNumbersParticipant(numbers);
      
      setSelectedNumbers(numbers);
      setIsPaymentModalOpen(true);
      
      console.log("✅ Payment modal opened with validatedBuyerData:", validatedBuyerData);
    } catch (error) {
      console.error('❌ Error proceeding to payment:', error);
      toast.error('Error al procesar el pago');
    }
  };

  const handleCompletePayment = async (data: PaymentFormData) => {
    console.log("🔄 handleCompletePayment called with data:", {
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      buyerCedula: data.buyerCedula
    });
    
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
      
      if (!(await validateSellerMaxNumbers(selectedNumbers.length))) {
        return;
      }
      
      const paymentProofUrl = await uploadPaymentProof(data.paymentProof);
      debugLog('Payment proof upload result', { paymentProofUrl });
      
      const participantId = await processParticipant(data);
      debugLog('Participant processing result', { participantId });
      
      if (!participantId) {
        toast.error('Error al procesar la información del participante');
        return;
      }
      
      await updateNumbersToSold(selectedNumbers, participantId, paymentProofUrl, raffleNumbers);
      debugLog('Numbers updated to sold', { 
        count: selectedNumbers.length, 
        numbers: selectedNumbers 
      });
      
      await refetchRaffleNumbers();
      
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
    setValidatedBuyerData,
    debugMode,
    handleReserveNumbers,
    handleProceedToPayment,
    handleCompletePayment,
    findOrCreateParticipant,
    getSoldNumbersCount
  };
}
