import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';

interface UseGridHandlersProps {
  numbers: any[];
  raffleSeller: {
    id: string;
    raffle_id: string;
    seller_id: string;
    active: boolean;
    cant_max: number;
  };
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
  debugMode = true,
  reservationDays,
  lotteryDate,
  totalNumbers,
  soldNumbersCount = 0
}: UseGridHandlersProps) => {
  // States for modals
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [clickedPaymentButton, setClickedPaymentButton] = useState<string | undefined>(undefined);
  
  // Context hooks
  const { setBuyerInfo } = useBuyerInfo();
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
  
  const handlePayReserved = () => {
    console.log('[NumberGridControls.tsx] Iniciando proceso de pago de apartado');
    
    setClickedPaymentButton("Pagar Apartados");
    
    if (highlightReserved) {
      console.log('[NumberGrid/useGridHandlers.ts] Ya está en modo highlight, no procesar nuevamente');
      return;
    }
    
    // Filtrar solo números reservados para este vendedor
    const reservedNumbers = numbers.filter(n => 
      n.status === 'reserved' && 
      n.seller_id === raffleSeller.seller_id
    );
    
    console.log('[NumberGrid/useGridHandlers.ts] Números reservados encontrados para este vendedor:', {
      cantidad: reservedNumbers.length,
      vendedor: raffleSeller.seller_id
    });
    
    if (reservedNumbers.length === 0) {
      console.log('[NumberGrid/useGridHandlers.ts] No hay números reservados para este vendedor');
      toast.warning('No hay números reservados para pagar');
      setShowReservedMessage(false);
      return;
    }
    
    setHighlightReserved(true);
    setShowReservedMessage(true);
    toast.info(`Hay ${reservedNumbers.length} numero reservado(s). Seleccione uno para proceder con el pago.`);
    
    console.log('[NumberGridControls.tsx] Finalizando proceso de pago de apartado');
  };
  
  const handleCloseReservedMessage = () => {
    setShowReservedMessage(false);
  };
  
  const toggleNumber = (number: string, status: string) => {
    if (debugMode) {
      console.log(`[NumberGrid/useGridHandlers.ts] Alternar número llamado con número=${number}, status=${status}`);
    }
    
    if (highlightReserved && status === 'reserved') {
      const selectedNumber = numbers.find(n => n.number === number);
      if (selectedNumber) {
        console.log(`[NumberGrid/useGridHandlers.ts] Número seleccionado en modo apartado:`, {
          numero: number,
          participantId: selectedNumber.participant_id,
          sellerId: selectedNumber.seller_id
        });
        
        // Solo obtener números del mismo participante que el número seleccionado
        const allReservedNumbers = numbers
          .filter(n => 
            n.status === 'reserved' && 
            n.participant_id === selectedNumber.participant_id &&
            n.seller_id === raffleSeller.seller_id // Asegurar que sea del mismo vendedor
          )
          .map(n => n.number);
          
        console.log(`[NumberGrid/useGridHandlers.ts] Números reservados del mismo participante (${selectedNumber.participant_id}):`, {
          numeros: allReservedNumbers,
          cantidad: allReservedNumbers.length
        });
        
        setSelectedNumbers(allReservedNumbers);
        setSelectedReservedNumber(number);
        setIsPhoneModalOpen(true);
      }
      return;
    }
    
    if (status !== 'available') return;
    
    // Calculate maximum available numbers
    const maxAvailableNumbers = raffleSeller.cant_max;
    
    // Calculate remaining available numbers based on total numbers (if provided) or seller max
    let remainingAvailable: number;
    
    // If totalNumbers is provided, calculate how many numbers are actually available
    if (totalNumbers && typeof totalNumbers === 'number') {
      // Calculate how many numbers are still available for sale
      const availableNumbers = Math.max(0, totalNumbers - soldNumbersCount + 1);      
      // Take the minimum between available numbers and max seller numbers
      remainingAvailable = Math.min((maxAvailableNumbers - soldNumbersCount + 1), availableNumbers);           
    } else {
      // Fallback to just use the seller maximum
      remainingAvailable = maxAvailableNumbers;
    }
      
    if (debugMode) {
      console.log('[NumberGrid/useGridHandlers.ts] Cálculo de números disponibles:', {
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
        // Check if adding this number would exceed the maximum allowed
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
      console.log('[NumberGrid/useGridHandlers.ts] Reservation data:', data);
      console.log('[NumberGrid/useGridHandlers.ts] Selected numbers:', selectedNumbers);
      console.log('[NumberGrid/useGridHandlers.ts] Reservation days:', reservationDays);
      console.log('[NumberGrid/useGridHandlers.ts] Lottery date:', lotteryDate);
    }
    
    if (!data.buyerName || !data.buyerPhone) {
      toast.error('Nombre y teléfono son requeridos');
      return;
    }
    
    // Calculate the reservation expiration date based on reservationDays and lotteryDate
    let reservationExpiresAt: Date;
    
    // Get the current date
    const currentDate = new Date();
    
    // Calculate the date after adding the reservation days
    // Use the reservationDays if provided, otherwise default to a reasonable value
    const daysToAdd = typeof reservationDays === 'number' ? reservationDays : 5;
    
    if (debugMode) {
      console.log('[NumberGrid/useGridHandlers.ts] Usando días de reserva:', daysToAdd);
    }
    
    // Create a new date by adding the specified days
    const expirationDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    
    // Determine if we should use the lottery date if it comes before the calculated expiration
    if (lotteryDate && lotteryDate instanceof Date && !isNaN(lotteryDate.getTime())) {
      // Valid lottery date, compare with expiration date
      if (expirationDate.getTime() > lotteryDate.getTime()) {
        // If expiration would be after the lottery, use the lottery date instead
        reservationExpiresAt = new Date(lotteryDate);
        if (debugMode) {
          console.log('[NumberGrid/useGridHandlers.ts] Utilizando la fecha de lotería como fecha de vencimiento:', reservationExpiresAt.toISOString());
        }
      } else {
        // Otherwise use the calculated expiration date
        reservationExpiresAt = expirationDate;
        if (debugMode) {
          console.log('[NumberGrid/useGridHandlers.ts] Usando la fecha de vencimiento calculada:', reservationExpiresAt.toISOString());
        }
      }
    } else {
      // No valid lottery date, just use the calculated expiration date
      reservationExpiresAt = expirationDate;
      if (debugMode) {
        console.log('[NumberGrid/useGridHandlers.ts] No hay fecha de lotería válida, se utiliza el vencimiento calculado:', reservationExpiresAt.toISOString());
      }
    }
    
    // Pass the calculated reservation expiration date to onReserve
    onReserve(selectedNumbers, data.buyerPhone, data.buyerName, data.buyerCedula);
    setIsReservationModalOpen(false);
    setSelectedNumbers([]);
  };
  
  const handleProceedToPayment = async (buttonType: string) => {
    if (debugMode) {
      console.log(`[NumberGrid/useGridHandlers.ts] handleProceedToPayment llamado con tipo de botón: ${buttonType}`);
    }
    
    // Validar que raffle_id esté definido
    if (!raffleSeller.raffle_id) {
      console.error("❌ Error: raffle_id está undefined en raffleSeller. Abortando ejecución.");
      toast.error("Error en la identificación de la rifa. Por favor, intente de nuevo.");
      return;
    }
    
    setClickedPaymentButton(buttonType);
    
    if (selectedNumbers.length === 0) {
      toast.error('Seleccione al menos un número para pagar');
      return;
    }
    
    try {
      await onProceedToPayment(selectedNumbers, undefined, buttonType);
    } catch (error) {
      console.error("❌ Error al proceder al pago:", error);
      toast.error("Error al procesar el pago. Por favor, intente de nuevo.");
    }
  };
  
  const handleValidationSuccess = async (
    validatedNumber: string,
    participantId: string,
    buyerInfo?: ValidatedBuyerInfo
  ) => {
    console.log(`[NumberGrid/useGridHandlers.ts] Validación exitosa para participante:`, {
      participantId,
      numerosSeleccionados: selectedNumbers,
      cantidadSeleccionada: selectedNumbers.length
    });
    
    // Validar que participantId esté definido
    if (!participantId) {
      console.error("❌ Error: participantId está undefined. Abortando ejecución.");
      toast.error("Error en la validación. Por favor, intente de nuevo.");
      return;
    }
    
    if (buyerInfo) {
      if (debugMode) {
        console.log("[NumberGrid/useGridHandlers.ts] Se recibió información validada del comprador:", {
          name: buyerInfo.name,
          phone: buyerInfo.phone,
          cedula: buyerInfo.cedula,
          id: buyerInfo.id
        });
      }
      
      // Update context state
      setBuyerInfo(buyerInfo);
    }
    
    setIsPhoneModalOpen(false);
    
    // After validation success, automatically close the reserved message
    setShowReservedMessage(false);
    
    try {
      if (participantId && buyerInfo) {
        console.log(`[NumberGrid/useGridHandlers.ts] Procediendo al pago para participante:`, {
          participantId,
          numerosSeleccionados: selectedNumbers,
          tipoBoton: clickedPaymentButton
        });
        await onProceedToPayment(selectedNumbers, buyerInfo, clickedPaymentButton);
      } else {
        await handleNumberValidation(validatedNumber);
      }
    } catch (error) {
      console.error("❌ Error al proceder después de la validación:", error);
      toast.error("Error al procesar después de la validación. Por favor, intente de nuevo.");
    }
  };
  
  const handleParticipantValidation = async (participantId: string) => {
    console.log(`[NumberGrid/useGridHandlers.ts] Validando participante: ${participantId}`);
    
    // Validar que raffle_id y seller_id estén definidos
    if (!raffleSeller.raffle_id) {
      console.error("❌ Error: raffle_id está undefined en raffleSeller. Abortando ejecución.");
      toast.error("Error en la identificación de la rifa. Por favor, intente de nuevo.");
      return;
    }
    
    if (!raffleSeller.seller_id) {
      console.error("❌ Error: seller_id está undefined en raffleSeller. Abortando ejecución.");
      toast.error("Error en la identificación del vendedor. Por favor, intente de nuevo.");
      return;
    }
    
    if (debugMode) {
      console.log('[NumberGrid/useGridHandlers.ts] Consultar a Supabase los números reservados con el participante ID:', participantId);
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
        console.error('[NumberGrid/useGridHandlers.ts] Error al obtener números reservados:', error);
        toast.error('Error al buscar números reservados');
        return;
      }
      
      if (reservedNumbers && reservedNumbers.length > 0) {
        const allReservedNumbers = reservedNumbers.map(n => 
          n.number.toString().padStart(2, '0')
        );
        
        console.log(`[NumberGrid/useGridHandlers.ts] Números reservados encontrados para participante ${participantId}:`, allReservedNumbers);
        
        toast.success(`${allReservedNumbers.length} número(s) encontrado(s)`);
        await onProceedToPayment(allReservedNumbers);
      } else {
        if (debugMode) {
          console.log('[NumberGrid/useGridHandlers.ts] No se encontraron números reservados con consulta directa');
        }
        
        toast.error('❗ No se encontraron números reservados para este participante.');
      }
    } catch (error) {
      console.error("❌ Error al validar participante:", error);
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
      console.error("❌ Error al proceder al pago después de validación:", error);
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
