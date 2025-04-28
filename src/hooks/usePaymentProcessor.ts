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
  const { isPaymentModalOpen, setIsPaymentModalOpen, isReservationModalOpen, setIsReservationModalOpen, isCompletePaymentOpen, setIsCompletePaymentOpen, isVoucherOpen, setIsVoucherOpen } = useModalState();
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
  
    // 1. Validaciones iniciales
    if (!raffleSeller?.seller_id) {
      toast.error("usePaymentProcessor: Información del vendedor no disponible");
      return;
    }
    if (!buyerPhone || !buyerName) {
      toast.error("usePaymentProcessor: Nombre y teléfono son obligatorios para apartar números");
      return;
    }
    // Validar cédula mínima
    if (buyerCedula && buyerCedula.length < 5) {
      toast.error("usePaymentProcessor: Cédula debe tener al menos 5 caracteres");
      return;
    }
    // Máximo de ventas
    if (!(await validateSellerMaxNumbers(numbers.length))) {
      return;
    }
  
    try {
      debugLog("usePaymentProcessor: Números de reserva llamados con", {
        numbers,
        buyerPhone,
        buyerName,
        buyerCedula
      });
  
      // 2. Crear o encontrar participante
      const participantId = await findOrCreateParticipant(buyerPhone, buyerName, buyerCedula);
      console.log("👤 usePaymentProcessor: Participante creado / encontrado:", participantId);
      if (!participantId) {
        toast.error("usePaymentProcessor: No se pudo crear o encontrar al participante");
        return;
      }
  
      // 3. Reservar números y guardar datos
      await updateRaffleNumbersStatus(
        numbers,
        "reserved",
        participantId,
        {
          // Usamos llaves idénticas a las columnas de la tabla
          participant_name: buyerName,
          participant_phone: buyerPhone,
          participant_cedula: buyerCedula ?? null
        }
      );
  
      // 4. Refrescar y limpiar
      await refetchRaffleNumbers();
      setSelectedNumbers([]);
  
      toast.success(`${numbers.length} número(s) apartados exitosamente`);
    } catch (error: any) {
      console.error("usePaymentProcessor: ❌ Error al reservar números:", error);
      toast.error(`usePaymentProcessor: Error al apartar números${error.message ? ` — ${error.message}` : ""}`);
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
      
      setSelectedNumbers(numbers);
      setIsPaymentModalOpen(true);
      
    } catch (error) {
      console.error('usePaymentProcessor: ❌ Error al proceder al pago:', error);
      toast.error('Error al procesar el pago');
    }
  };

  const handlePayReservedNumbers = async (numbers: string[], participantData: ValidatedBuyerInfo) => {
    console.log("💰 usePaymentProcessor: handlePayReservedNumbers recibió estos números:", {
      numbers,
      participantData
    });

    if (numbers.length === 0) {
      toast.error('No hay números seleccionados para pagar');
      return;
    }

    try {
      setValidatedBuyerData(participantData);
      setSelectedNumbers(numbers);
      
      setIsPaymentModalOpen(true);
      
      debugLog("usePaymentProcessor: Modal de pago abierto con datos validados:", participantData);
    } catch (error) {
      console.error('usePaymentProcessor: ❌ Error al proceder al pago de números reservados:', error);
      toast.error('Error al procesar el pago de números reservados');
    }
  };

  const handleCompletePayment = async (data: PaymentFormData) => {
    console.log("🔄 handleCompletePayment called with data:", {
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      buyerCedula: data.buyerCedula,
      paymentMethod: data.paymentMethod
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
      
      let participantId: string | null;
      
      if (validatedBuyerData?.id) {
        participantId = validatedBuyerData.id;
        console.log("Using existing participant ID:", participantId);
      } else {
        participantId = await processParticipant(data);
      }
      
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
        const { data: existingReport } = await supabase
          .from('fraud_reports')
          .select('id')
          .match({
            participant_id: participantId,
            raffle_id: raffleId,
            seller_id: raffleSeller.seller_id
          })
          .maybeSingle();
        
        if (!existingReport) {
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
          }
        } else {
          console.log("⚠️ Fraud report already exists for this participant, skipping duplicate insert");
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
    handleReserveNumbers,       // para “Apartar”
    handleProceedToPayment,     // para “Pagar” (compra directa)
    handlePayReservedNumbers,   // para iniciar el pago de apartados
    handleCompletePayment,      // para finalizar cualquiera de los dos pagos
    findOrCreateParticipant,
    getSoldNumbersCount,
    allowVoucherPrint,
    isReservationModalOpen,
    setIsReservationModalOpen,
    isCompletePaymentOpen,
    setIsCompletePaymentOpen
  };
}
