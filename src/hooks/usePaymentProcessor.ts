
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
    setValidatedBuyerData,
    debugMode
  });

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ${context}]:`, data);
    }
  };

  // Log validated buyer data when it changes
  useEffect(() => {
    if (validatedBuyerData) {
      console.log("🔄 usePaymentProcessor: Datos del comprador validados actualizados:", {
        id: validatedBuyerData.id || 'N/A',
        name: validatedBuyerData.name,
        phone: validatedBuyerData.phone,
        cedula: validatedBuyerData.cedula || 'N/A',
        direccion: validatedBuyerData.direccion || 'N/A',
        sugerencia_producto: validatedBuyerData.sugerencia_producto || 'N/A'
      });
    } else {
      console.log("🔄 usePaymentProcessor: ValidatedBuyerData es nulo");
    }
  }, [validatedBuyerData]);

  const { findOrCreateParticipant } = useParticipantManager({ 
    raffleId, 
    debugMode, 
    raffleSeller,
    setValidatedBuyerData
  });
  
  const { updateRaffleNumbersStatus } = useNumberStatus({ raffleSeller, raffleId, raffleNumbers, debugMode });

  const handleReserveNumbers = async (
    numbers: string[], 
    buyerPhone?: string, 
    buyerName?: string, 
    buyerCedula?: string
  ) => {
    console.log("🎯 usePaymentProcessor: handleReserveNumbers llamado con:", {
      numbers,
      buyerPhone,
      buyerName,
      buyerCedula
    });
    
    if (!raffleSeller?.seller_id) {
      toast.error('usePaymentProcessor: Información del vendedor no disponible');
      return;
    }
    
    if (!buyerPhone || !buyerName) {
      toast.error('usePaymentProcessor: Nombre y teléfono son obligatorios para apartar números');
      return;
    }
    
    if (!(await validateSellerMaxNumbers(numbers.length))) {
      return;
    }
    
    try {
      debugLog('usePaymentProcessor: Números de reserva llamados con', { numbers, buyerPhone, buyerName, buyerCedula });
      
      const participantId = await findOrCreateParticipant(buyerPhone, buyerName, buyerCedula);
      console.log("👤 usePaymentProcessor: Participante creado / encontrado:", participantId);
      
      if (!participantId) {
        toast.error('usePaymentProcessor: No se pudo crear o encontrar al participante');
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
      
      toast.success(`usePaymentProcessor: ${numbers.length} número(s) apartados exitosamente`);
    } catch (error) {
      console.error('usePaymentProcessor: ❌ Error al reservar números:', error);
      toast.error('usePaymentProcessor: Error al apartar números');
    }
  };

  const handleProceedToPayment = async (numbers: string[]) => {
    console.log("💰 usePaymentProcessor: handleProceedToPayment llamado con números:", numbers);
    
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
      
      // For reserved numbers, check which participant they belong to
      await checkReservedNumbersParticipant(numbers);
      
      setSelectedNumbers(numbers);
      setIsPaymentModalOpen(true);
      
      console.log("✅ usePaymentProcessor: Modal de pago abierto con validatedBuyerData:", validatedBuyerData);
    } catch (error) {
      console.error('usePaymentProcessor: ❌ Error al proceder al pago:', error);
      toast.error('Error al procesar el pago');
    }
  };

  const handleCompletePayment = async (data: PaymentFormData) => {
    console.log("🔄 usePaymentProcessor: handleCompletePayment llamado con datos:", {
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      buyerCedula: data.buyerCedula
    });
    
    if (!raffleSeller?.seller_id) {
      toast.error('usePaymentProcessor: Información del vendedor no disponible');
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
      debugLog('usePaymentProcessor: Resultado de carga del comprobante de pago', { paymentProofUrl });
      
      const participantId = await processParticipant(data);
      debugLog('usePaymentProcessor: Resultado del procesamiento del participante', { participantId });
      
      if (!participantId) {
        toast.error('usePaymentProcessor: Error al procesar la información del participante');
        return;
      }
      
      await updateNumbersToSold(selectedNumbers, participantId, paymentProofUrl, raffleNumbers);
      debugLog('usePaymentProcessor: Números actualizados a vendidos', { 
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
      debugLog('usePaymentProcessor: Pago completado exitosamente', null);
    } catch (error) {
      console.error('usePaymentProcessor: Error al completar el pago:', error);
      debugLog('usePaymentProcessor: Error de finalización del pago', error);
      toast.error('usePaymentProcessor: Error al completar el pago');
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
