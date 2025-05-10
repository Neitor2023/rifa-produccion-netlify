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
  onReserve: (numbers: string[], buyerPhone?: string, buyerName?: string, buyerCedula?: string) => Promise<void>;
  onProceedToPayment: (numbers: string[], participantData?: ValidatedBuyerInfo, clickedButton?: string) => Promise<void>;
  debugMode?: boolean;
  reservationDays?: number;
  lotteryDate?: Date;
}

export const useGridHandlers = ({
  numbers,
  raffleSeller,
  onReserve,
  onProceedToPayment,
  debugMode = false,
  reservationDays,
  lotteryDate
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
    console.log('NumberGrid: handlePayReserved called');
    
    setClickedPaymentButton("Pagar Apartados");
    
    if (highlightReserved) {
      return;
    }
    
    const reservedNumbers = numbers.filter(n => n.status === 'reserved');
    if (reservedNumbers.length === 0) {
      toast.warning('No reserved numbers to pay');
      setShowReservedMessage(false);
      return;
    }
    
    setHighlightReserved(true);
    setShowReservedMessage(true);
    toast.info(`Hay ${reservedNumbers.length} numero reservado(s). Seleccione uno para proceder con el pago.`);
  };
  
  const handleCloseReservedMessage = () => {
    setShowReservedMessage(false);
  };
  
  const toggleNumber = (number: string, status: string) => {
    if (debugMode) {
      console.log(`NumberGrid: Alternar número llamado con número=${number}, status=${status}`);
    }
    
    if (highlightReserved && status === 'reserved') {
      const selectedNumber = numbers.find(n => n.number === number);
      if (selectedNumber) {
        const allReservedNumbers = numbers
          .filter(n => 
            n.status === 'reserved' && 
            n.participant_id === selectedNumber.participant_id
          )
          .map(n => n.number);
          
        setSelectedNumbers(allReservedNumbers);
        setSelectedReservedNumber(number);
        setIsPhoneModalOpen(true);
      }
      return;
    }
    
    if (status !== 'available') return;
    
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        if (prev.length >= raffleSeller.cant_max) {
          toast.error(`No puedes seleccionar más de ${raffleSeller.cant_max} números`);
          return prev;
        }
        return [...prev, number];
      }
    });
  };
  
  const handleReserve = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Select at least one number to reserve');
      return;
    }
    setIsReservationModalOpen(true);
  };
  
  const handleConfirmReservation = (data: { buyerName: string; buyerPhone: string; buyerCedula: string }) => {
    if (debugMode) {
      console.log('NumberGrid: Reservation data:', data);
      console.log('NumberGrid: Selected numbers:', selectedNumbers);
      console.log('NumberGrid: Reservation days:', reservationDays);
      console.log('NumberGrid: Lottery date:', lotteryDate);
    }
    
    if (!data.buyerName || !data.buyerPhone) {
      toast.error('Name and phone are required');
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
      console.log('NumberGrid: Using reservation days:', daysToAdd);
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
          console.log('NumberGrid: Using lottery date as expiration:', reservationExpiresAt.toISOString());
        }
      } else {
        // Otherwise use the calculated expiration date
        reservationExpiresAt = expirationDate;
        if (debugMode) {
          console.log('NumberGrid: Using calculated expiration date:', reservationExpiresAt.toISOString());
        }
      }
    } else {
      // No valid lottery date, just use the calculated expiration date
      reservationExpiresAt = expirationDate;
      if (debugMode) {
        console.log('NumberGrid: No valid lottery date, using calculated expiration:', reservationExpiresAt.toISOString());
      }
    }
    
    // Pass the calculated reservation expiration date to onReserve
    onReserve(selectedNumbers, data.buyerPhone, data.buyerName, data.buyerCedula);
    setIsReservationModalOpen(false);
    setSelectedNumbers([]);
  };
  
  const handleProceedToPayment = async (buttonType: string) => {
    if (debugMode) {
      console.log(`NumberGrid: handleProceedToPayment called with button type: ${buttonType}`);
    }
    
    setClickedPaymentButton(buttonType);
    
    if (selectedNumbers.length === 0) {
      toast.error('Select at least one number to pay');
      return;
    }
    await onProceedToPayment(selectedNumbers, undefined, buttonType);
  };
  
  const handleValidationSuccess = async (
    validatedNumber: string,
    participantId: string,
    buyerInfo?: ValidatedBuyerInfo
  ) => {
    if (buyerInfo) {
      if (debugMode) {
        console.log("NumberGrid: Received validated buyer information:", {
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
    
    if (participantId && buyerInfo) {
      await onProceedToPayment(selectedNumbers, buyerInfo, clickedPaymentButton);
    } else {
      await handleNumberValidation(validatedNumber);
    }
  };
  
  const handleParticipantValidation = async (participantId: string) => {
    if (debugMode) {
      console.log('NumberGrid: Querying Supabase for reserved numbers with participant ID:', participantId);
    }
    
    const { data: reservedNumbers, error } = await supabase
      .from('raffle_numbers')
      .select('number')
      .eq('participant_id', participantId)
      .eq('status', 'reserved')
      .eq('raffle_id', raffleSeller.raffle_id)
      .eq('seller_id', raffleSeller.seller_id);
    
    if (error) {
      console.error('NumberGrid: Error al obtener números reservados:', error);
      toast.error('Error al buscar números reservados');
      return;
    }
    
    if (reservedNumbers && reservedNumbers.length > 0) {
      const allReservedNumbers = reservedNumbers.map(n => 
        n.number.toString().padStart(2, '0')
      );
      
      if (debugMode) {
        console.log('NumberGrid: Números reservados encontrados:', allReservedNumbers);
      }
      
      toast.success(`${allReservedNumbers.length} number(s) found`);
      await onProceedToPayment(allReservedNumbers);
    } else {
      if (debugMode) {
        console.log('NumberGrid: No se encontraron números reservados con consulta directa');
      }
      
      toast.error('❗ No se encontraron números reservados para este participante.');
    }
  };
  
  const handleNumberValidation = async (validatedNumber: string) => {
    const number = numbers.find(n => n.number === validatedNumber && n.status === 'reserved');
    
    if (!number) {
      toast.error('Number not found');
      return;
    }
    
    toast.success('Validation successful');
    await onProceedToPayment([validatedNumber]);
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
