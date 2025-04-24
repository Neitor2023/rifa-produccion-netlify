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

  const handleProceedToPayment = async (numbers: string[], participantData?: ValidatedBuyerInfo) => {
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

      if (raffleNumbers && numbers.length > 0) {
        const selectedNumber = raffleNumbers.find(n => 
          (n.number === numbers[0] || n.number === parseInt(numbers[0])) && n.status === 'reserved'
        );

        if (selectedNumber) {
          if (!participantData || !participantData.id) {
            toast.error('Debe validar su teléfono o cédula antes de pagar sus números apartados.');
            return;
          }

          const { data: reservedNumbers } = await supabase
            .from('raffle_numbers')
            .select('number')
            .eq('participant_id', participantData.id)
            .eq('status', 'reserved')
            .eq('seller_id', raffleSeller?.seller_id);

          if (reservedNumbers && reservedNumbers.length > 0) {
            const allReservedNumbers = reservedNumbers.map(n => n.number.toString().padStart(2, '0'));
            setSelectedNumbers(allReservedNumbers);
          }

          setValidatedBuyerData(participantData);
        } else {
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
      if (data.reporteSospechoso) {
        const { error: fraudError } = await supabase
          .from('fraud_reports')
          .insert({
            raffle_id: raffleId,
            seller_id: raffleSeller.seller_id,
            participant_id: validatedBuyerData?.id,
            mensaje: data.reporteSospechoso,
            estado: 'pendiente'
          });

        if (fraudError) {
          console.error('Error al guardar reporte de fraude:', fraudError);
        }
      }

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
        toast.error('usePaymentProcessor: Error al procesar la información del participante');
        return;
      }
      
      await updateNumbersToSold(selectedNumbers, participantId, paymentProofUrl, raffleNumbers);
      await refetchRaffleNumbers();
      
      setPaymentData({
        ...data,
        paymentProof: paymentProofUrl
      });
      
      setIsPaymentModalOpen(false);
      setIsVoucherOpen(true);
      
      toast.success('Pago completado exitosamente');
    } catch (error) {
      console.error('usePaymentProcessor: Error al completar el pago:', error);
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
