import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';
import { useReservationHandling } from '@/hooks/useReservationHandling';
import { useSellerValidation } from '@/hooks/usePaymentProcessor/sellerValidation';
import { ValidatedBuyerInfo } from '@/types/participant';

interface UseGridHandlersProps {
  numbers: any[];
  raffleSeller: any;
  onReserve: (selectedNumbers: string[], buyerPhone?: string, buyerName?: string, buyerCedula?: string) => Promise<void>;
  onProceedToPayment: (selectedNumbers: string[], participantData?: ValidatedBuyerInfo, clickedButton?: string) => Promise<void>;
  debugMode?: boolean;
  reservationDays?: number;
  lotteryDate?: Date;
  totalNumbers?: number;
  soldNumbersCount?: number;
}

export const useGridHandlers = ({
  numbers,
  raffleSeller,
  onReserve,
  onProceedToPayment,
  debugMode = false,
  reservationDays,
  lotteryDate,
  totalNumbers,
  soldNumbersCount
}: UseGridHandlersProps) => {
  // States for modals
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [clickedPaymentButton, setClickedPaymentButton] = useState<string | undefined>(undefined);
  
  // Context hooks
  const { setBuyerInfo, buyerInfo } = useBuyerInfo();
  const {
    selectedNumbers,
    setSelectedNumbers,
    highlightReserved,
    setHighlightReserved,
    showReservedMessage,
    setShowReservedMessage,
    selectedReservedNumber,
    setSelectedReservedNumber,
    clearSelectionState
  } = useNumberSelection();
  
  const { validateSellerMaxNumbers } = useSellerValidation(raffleSeller, numbers, debugMode);
  
  const handlePayReserved = async () => {
    console.log('[useGridHandlers.ts] 🎯 Botón "Pagar Apartados" presionado - Flujo simplificado activado');
    
    setClickedPaymentButton("Pagar Apartados");
    
    // Verificar que hay números reservados para este vendedor
    const reservedNumbers = numbers.filter(n => 
      n.status === 'reserved' && 
      n.seller_id === raffleSeller.seller_id
    );
    
    console.log('[useGridHandlers.ts] 📊 Números reservados encontrados:', {
      cantidad: reservedNumbers.length,
      vendedor: raffleSeller.seller_id
    });
    
    if (reservedNumbers.length === 0) {
      console.log('[useGridHandlers.ts] ⚠️ No hay números reservados para este vendedor');
      toast.warning('No hay números reservados para pagar');
      return;
    }
    
    // Validate seller max numbers with single argument
    if (!(await validateSellerMaxNumbers(reservedNumbers.length))) {
      return;
    }
    
    // Abrir directamente el modal de validación sin selección de números
    setIsPhoneModalOpen(true);
  };
  
  const handleCloseReservedMessage = () => {
    console.log('[useGridHandlers.ts] 🧹 Cerrando mensaje de reservados y limpiando estado');
    setShowReservedMessage(false);
    setHighlightReserved(false);
    setClickedPaymentButton(undefined);
  };
  
  const toggleNumber = (number: string, status: string) => {
    if (debugMode) {
      console.log(`[useGridHandlers.ts] 🔄 Alternando número ${number}, estado: ${status}`);
    }
    
    if (status !== 'available') return;
    
    // Calculate maximum available numbers
    const maxAvailableNumbers = raffleSeller.cant_max;
    
    // Calculate remaining available numbers based on total numbers (if provided) or seller max
    let remainingAvailable: number;
    
    if (totalNumbers && typeof totalNumbers === 'number') {
      const availableNumbers = Math.max(0, totalNumbers - soldNumbersCount + 1);      
      remainingAvailable = Math.min((maxAvailableNumbers - soldNumbersCount + 1), availableNumbers);           
    } else {
      remainingAvailable = maxAvailableNumbers;
    }
      
    if (debugMode) {
      console.log('[useGridHandlers.ts] 📊 Cálculo de números disponibles:', {
        totalNumbers,
        soldNumbersCount,
        maxAvailableNumbers,
        remainingAvailable
      });
    }
    
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        if (prev.length >= remainingAvailable) {
          toast.error(`Se ha superado la cantidad de números permitidos del vendedor, por favor finalice su selección de números.`);
          return prev;
        }
        return [...prev, number];
      }
    });
  };
  
  const handleReserve = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Seleccione al menos un número para reservar');
      return;
    }
    setIsReservationModalOpen(true);
  };
  
  const handleConfirmReservation = (data: { buyerName: string; buyerPhone: string; buyerCedula: string }) => {
    if (debugMode) {
      console.log('[useGridHandlers.ts] 📝 Datos de reservación:', data);
      console.log('[useGridHandlers.ts] 📝 Números seleccionados:', selectedNumbers);
      console.log('[useGridHandlers.ts] 📝 Días de reserva:', reservationDays);
      console.log('[useGridHandlers.ts] 📝 Fecha de lotería:', lotteryDate);
    }
    
    if (!data.buyerName || !data.buyerPhone) {
      toast.error('Nombre y teléfono son requeridos');
      return;
    }
    
    let reservationExpiresAt: Date;
    const currentDate = new Date();
    const daysToAdd = typeof reservationDays === 'number' ? reservationDays : 5;
    
    if (debugMode) {
      console.log('[useGridHandlers.ts] Usando días de reserva:', daysToAdd);
    }
    
    const expirationDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    
    if (lotteryDate && lotteryDate instanceof Date && !isNaN(lotteryDate.getTime())) {
      if (expirationDate.getTime() > lotteryDate.getTime()) {
        reservationExpiresAt = new Date(lotteryDate);
        if (debugMode) {
          console.log('[useGridHandlers.ts] Utilizando la fecha de lotería como fecha de vencimiento:', reservationExpiresAt.toISOString());
        }
      } else {
        reservationExpiresAt = expirationDate;
        if (debugMode) {
          console.log('[useGridHandlers.ts] Usando la fecha de vencimiento calculada:', reservationExpiresAt.toISOString());
        }
      }
    } else {
      reservationExpiresAt = expirationDate;
      if (debugMode) {
        console.log('[useGridHandlers.ts] No hay fecha de lotería válida, se utiliza el vencimiento calculado:', reservationExpiresAt.toISOString());
      }
    }
    
    onReserve(selectedNumbers, data.buyerPhone, data.buyerName, data.buyerCedula);
    setIsReservationModalOpen(false);
    setSelectedNumbers([]);
  };
  
  const handleProceedToPayment = async (paymentFormData?: any) => {
    console.log('[useGridHandlers.ts] 🚀 handleProceedToPayment iniciado con:', {
      selectedNumbers,
      buyerInfo,
      paymentFormData
    });

    if (selectedNumbers.length === 0) {
      toast.error('Seleccione al menos un número');
      return;
    }

    // Validate seller max numbers with single argument
    if (!(await validateSellerMaxNumbers(selectedNumbers.length))) {
      return;
    }

    try {
      // Build payment data ensuring paymentProof is included
      const paymentData = {
        ...buyerInfo,
        ...paymentFormData,
        // Explicitly ensure paymentProof is passed through
        paymentProof: paymentFormData?.paymentProof || '',
        clickedButtonType: 'direct'
      };

      console.log('[useGridHandlers.ts] 🚀 Datos enviados a voucher:', {
        participante: paymentData.buyerName,
        paymentMethod: paymentData.paymentMethod,
        tienePaymentProof: !!paymentData.paymentProof,
        paymentProofLength: paymentData.paymentProof?.length || 0,
        participantId: paymentData.participantId
      });

      await onProceedToPayment(selectedNumbers, paymentData, 'direct');
      
      // Clear selection after successful payment
      clearSelectionState();
      
    } catch (error) {
      console.error('[useGridHandlers.ts] ❌ Error en pago directo:', error);
      toast.error('Error al procesar el pago');
    }
  };
  
  const handleValidationSuccess = async (
    validatedNumber: string,
    participantId: string,
    buyerInfo?: ValidatedBuyerInfo
  ) => {
    console.log('[useGridHandlers.ts] ✅ Validación exitosa en flujo simplificado:', {
      participantId,
      clickedPaymentButton
    });

    if (!participantId) {
      console.error("[useGridHandlers.ts] ❌ Error: participantId undefined después de validación");
      toast.error("Error crítico: participante no identificado.");
      return;
    }

    if (buyerInfo) {
      console.log("[useGridHandlers.ts] 💾 Actualizando información del comprador");
      
      const updatedBuyerInfo = {
        ...buyerInfo,
        id: participantId
      };
      
      setBuyerInfo(updatedBuyerInfo);
    }

    // Flujo simplificado para "Pagar Apartados"
    if (clickedPaymentButton === "Pagar Apartados") {
      try {
        console.log('[useGridHandlers.ts] 🔍 Consultando números reservados para participante:', participantId);
        
        const { data: reservedNumbers, error } = await supabase
          .from("raffle_numbers")
          .select("number")
          .eq("participant_id", participantId)
          .eq("seller_id", raffleSeller.seller_id)
          .eq("raffle_id", raffleSeller.raffle_id)
          .eq("status", "reserved");

        if (error) {
          console.error('[useGridHandlers.ts] ❌ Error al consultar números reservados:', error);
          toast.error("Error al buscar los números reservados.");
          return;
        }

        const numeros = reservedNumbers.map((n) =>
          n.number.toString().padStart(2, "0")
        );

        if (numeros.length === 0) {
          toast.warning("Este participante no tiene números reservados.");
          return;
        }

        console.log('[useGridHandlers.ts] ✅ Números reservados recuperados:', numeros);

        // Proceder al pago directamente con los números obtenidos
        const finalBuyerInfo = buyerInfo ? {
          ...buyerInfo,
          id: participantId
        } : undefined;

        await onProceedToPayment(numeros, finalBuyerInfo, clickedPaymentButton);

      } catch (error) {
        console.error('[useGridHandlers.ts] ❌ Error en flujo simplificado al recuperar números:', error);
        toast.error("No se pudieron recuperar los números reservados.");
      }

      // Cerrar modal de validación
      setIsPhoneModalOpen(false);
      return;
    }

    // Resto de la lógica existente para otros tipos de pago
    try {
      if (participantId && buyerInfo) {
        console.log(`[useGridHandlers.ts] 🚀 Procediendo al pago con participante validado: ${participantId}`);
        
        const finalBuyerInfo = {
          ...buyerInfo,
          id: participantId
        };
        
        await onProceedToPayment(selectedNumbers, finalBuyerInfo, clickedPaymentButton);
      } else {
        await handleNumberValidation(validatedNumber);
      }
    } catch (error) {
      console.error("[useGridHandlers.ts] ❌ Error después de validación:", error);
      toast.error("Error al procesar después de la validación. Por favor, intente de nuevo.");
    }
  };
  
  const handleParticipantValidation = async (participantId: string) => {
    console.log(`[useGridHandlers.ts] 🔍 Validando participante: ${participantId}`);
    
    if (!raffleSeller.raffle_id) {
      console.error("[useGridHandlers.ts] ❌ Error: raffle_id undefined");
      toast.error("Error en la identificación de la rifa. Por favor, intente de nuevo.");
      return;
    }
    
    if (!raffleSeller.seller_id) {
      console.error("[useGridHandlers.ts] ❌ Error: seller_id undefined");
      toast.error("Error en la identificación del vendedor. Por favor, intente de nuevo.");
      return;
    }
    
    try {
      const { data: reservedNumbers, error } = await supabase
        .from('raffle_numbers')
        .select('number')
        .eq('participant_id', participantId)
        .eq('status', 'reserved')
        .eq('raffle_id', raffleSeller.raffle_id)
        .eq('seller_id', raffleSeller.seller_id);
      
      if (error) {
        console.error('[useGridHandlers.ts] ❌ Error al obtener números reservados:', error);
        toast.error('Error al buscar números reservados');
        return;
      }
      
      if (reservedNumbers && reservedNumbers.length > 0) {
        const allReservedNumbers = reservedNumbers.map(n => 
          n.number.toString().padStart(2, '0')
        );
        
        console.log(`[useGridHandlers.ts] ✅ Números encontrados para participante ${participantId}:`, allReservedNumbers);
        
        toast.success(`${allReservedNumbers.length} número(s) encontrado(s)`);
        await onProceedToPayment(allReservedNumbers);
      } else {
        console.log('[useGridHandlers.ts] ⚠️ No se encontraron números reservados');
        toast.error('❗ No se encontraron números reservados para este participante.');
      }
    } catch (error) {
      console.error("[useGridHandlers.ts] ❌ Error al validar participante:", error);
      toast.error("Error al buscar números reservados. Por favor, intente de nuevo.");
    }
  };
  
  const handleNumberValidation = async (validatedNumber: string) => {
    const number = numbers.find(n => n.number === validatedNumber && n.status === 'reserved');
    
    if (!number) {
      toast.error('Número no encontrado');
      return;
    }
    
    toast.success('Validación exitosa');
    
    try {
      await onProceedToPayment([validatedNumber]);
    } catch (error) {
      console.error("[useGridHandlers.ts] ❌ Error al proceder al pago después de validación:", error);
      toast.error("Error al procesar el pago. Por favor, intente de nuevo.");
    }
  };
  
  return {
    // State
    isPhoneModalOpen,
    setIsPhoneModalOpen,
    isReservationModalOpen,
    setIsReservationModalOpen,
    selectedNumbers,
    highlightReserved,
    showReservedMessage,
    selectedReservedNumber,
    clickedPaymentButton,
    
    // Handlers
    handlePayReserved,
    handleCloseReservedMessage,
    toggleNumber,
    clearSelectionState,
    handleReserve,
    handleConfirmReservation,
    handleProceedToPayment,
    handleValidationSuccess,
    handleParticipantValidation,
    handleNumberValidation
  };
};
