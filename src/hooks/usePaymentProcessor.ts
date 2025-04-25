
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

  // Function to handle reserving numbers - this is separate from paying reserved numbers
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

  // Handle new purchases of available numbers
  const handleProceedToPayment = async (numbers: string[], participantData?: ValidatedBuyerInfo) => {
    console.log("💰 usePaymentProcessor: handleProceedToPayment llamado con números:", numbers);
    console.log("💰 usePaymentProcessor: participantData:", participantData);

    if (numbers.length === 0) {
      toast.error('Seleccione al menos un número para comprar');
      return;
    }

    try {
      // Validate seller limits
      if (!(await validateSellerMaxNumbers(numbers.length))) {
        return;
      }

      // For new purchases, check availability
      const isReservedNumberPayment = participantData !== undefined;
      if (!isReservedNumberPayment) {
        const unavailableNumbers = await checkNumbersAvailability(numbers);
        if (unavailableNumbers.length > 0) {
          toast.error(`Números ${unavailableNumbers.join(', ')} no están disponibles`);
          return;
        }
      }

      // If participantData is provided, we're paying for reserved numbers
      if (participantData) {
        // Set the validated data to be used in the payment form
        setValidatedBuyerData(participantData);
        setSelectedNumbers(numbers);
      } else {
        // For fresh selections, check if any of the selected numbers are reserved
        if (raffleNumbers && numbers.length > 0) {
          const selectedNumber = raffleNumbers.find(n => 
            (n.number === numbers[0] || n.number === parseInt(numbers[0])) && n.status === 'reserved'
          );

          // If a reserved number is selected without validation, require validation
          if (selectedNumber) {
            toast.error('Debe validar su teléfono o cédula antes de pagar sus números apartados.');
            return;
          }

          setSelectedNumbers(numbers);
        }
      }

      // Open the payment modal
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
      debugLog('Complete Payment - starting', {
        selectedNumbers,
        data,
        sellerId: raffleSeller.seller_id
      });
      
      if (!(await validateSellerMaxNumbers(selectedNumbers.length))) {
        return;
      }
      
      // Upload payment proof if provided
      const paymentProofUrl = await uploadPaymentProof(data.paymentProof);
      
      // Process participant data - this now handles saving fraud reports with participant_id
      const participantId = await processParticipant(data);
      
      if (!participantId) {
        toast.error('usePaymentProcessor: Error al procesar la información del participante');
        return;
      }
      
      // Update number status to sold
      await updateNumbersToSold(selectedNumbers, participantId, paymentProofUrl, raffleNumbers);
      await refetchRaffleNumbers();
      
      // Store payment data for receipt
      setPaymentData({
        ...data,
        paymentProof: paymentProofUrl
      });
      
      // Close payment modal and show receipt only if allowed
      setIsPaymentModalOpen(false);
      
      if (allowVoucherPrint) {
        setIsVoucherOpen(true);
      } else {
        toast.success('Pago completado exitosamente. El comprobante de pago está en revisión.');
        toast.info('Es importante que le exija su comprobante de pago a su vendedor, este es su constancia de reclamo de premios.');
      }
      
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
    getSoldNumbersCount,
    allowVoucherPrint
  };
}
