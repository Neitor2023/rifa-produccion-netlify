import { useState, useEffect } from 'react';
import { PaymentFormData } from '@/components/PaymentModal';
import { ValidatedBuyerInfo } from '@/types/participant';
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
import { supabase } from '@/integrations/supabase/client';

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
  
  const { findOrCreateParticipant } = useParticipantManager({ 
    raffleId, 
    debugMode, 
    raffleSeller, 
    setValidatedBuyerData 
  });

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ${context}]:`, data);
    }
  };

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

  const handleProceedToPayment = async (numbers: string[], participantData?: ValidatedBuyerInfo) => {
    console.log("💰 usePaymentProcessor: handleProceedToPayment llamado con números:", numbers);
    console.log("💰 usePaymentProcessor: participantData:", participantData);

    if (numbers.length === 0) {
      toast.error('Seleccione al menos un número para comprar');
      return;
    }

    try {
      if (!(await validateSellerMaxNumbers(numbers.length))) {
        return;
      }

      const isReservedNumberPayment = participantData !== undefined;
      if (!isReservedNumberPayment) {
        const unavailableNumbers = await checkNumbersAvailability(numbers);
        if (unavailableNumbers.length > 0) {
          toast.error(`Números ${unavailableNumbers.join(', ')} no están disponibles`);
          return;
        }
      }

      if (participantData) {
        setValidatedBuyerData(participantData);
        setSelectedNumbers(numbers);
      } else {
        if (raffleNumbers && numbers.length > 0) {
          const selectedNumber = raffleNumbers.find(n => 
            (n.number === numbers[0] || n.number === parseInt(numbers[0])) && n.status === 'reserved'
          );

          if (selectedNumber) {
            toast.error('Debe validar su teléfono o cédula antes de pagar sus números apartados.');
            return;
          }

          setSelectedNumbers(numbers);
        }
      }

      setIsPaymentModalOpen(true);
      debugLog("usePaymentProcessor: Modal de pago abierto con datos validados:", participantData || validatedBuyerData);
    } catch (error) {
      console.error('usePaymentProcessor: ❌ Error al proceder al pago:', error);
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
      
      const participantId = await processParticipant(data);
      
      if (!participantId) {
        toast.error('Error al procesar la información del participante');
        return;
      }
      
      await updateNumbersToSold(selectedNumbers, participantId, paymentProofUrl, raffleNumbers);
      await refetchRaffleNumbers();
      
      setPaymentData({
        ...data,
        paymentProof: paymentProofUrl
      });
      
      if (data.reporteSospechoso) {
        const { error: fraudError } = await supabase
          .from('fraud_reports')
          .insert({
            raffle_id: raffleId,
            seller_id: raffleSeller.seller_id,
            participant_id: participantId,
            mensaje: data.reporteSospechoso,
            estado: 'pendiente'
          });

        if (fraudError) {
          console.error('Error saving fraud report:', fraudError);
        } else {
          console.log("✅ Saved fraud report for participant:", participantId);
        }
      }
      
      setIsPaymentModalOpen(false);
      
      if (allowVoucherPrint) {
        setIsVoucherOpen(true);
      } else {
        toast.success('Pago completado exitosamente. El comprobante de pago está en revisión.');
        toast.info('Es importante que le exija su comprobante de pago a su vendedor, este es su constancia de reclamo de premios.');
      }
      
      toast.success('Pago completado exitosamente');
    } catch (error) {
      console.error('Error al completar el pago:', error);
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
    getSoldNumbersCount,
    allowVoucherPrint
  };
}
