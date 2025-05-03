import React, { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { Card } from '@/components/ui/card';
import PhoneValidationModal from './PhoneValidationModal';
import ReservationModal from './ReservationModal';
import { supabase } from '@/integrations/supabase/client';
import { NumberGridControls } from './NumberGridControls';
import { NumberGridLegend } from './NumberGridLegend';
import NumberGridHeader from './NumberGridHeader';
import { ValidatedBuyerInfo } from '@/types/participant';
import GridLayout from './NumberGrid/GridLayout';
import ReservedMessageAlert from './NumberGrid/ReservedMessageAlert';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import SelectionHandler, { useSelectionHandler } from './NumberGrid/SelectionHandler';

interface RaffleNumber {
  id: string;
  raffle_id: string;
  number: string;
  status: string;
  seller_id: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  payment_method: string | null;
  payment_proof: string | null;
  payment_date: string | null;
  participant_id?: string | null;
}

interface RaffleSeller {
  id: string;
  raffle_id: string;
  seller_id: string;
  active: boolean;
  cant_max: number;
}

interface NumberGridProps {
  numbers: RaffleNumber[];
  raffleSeller: RaffleSeller;
  onReserve: (selectedNumbers: string[], buyerPhone?: string, buyerName?: string, buyerCedula?: string) => Promise<void>;
  onProceedToPayment: (selectedNumbers: string[], participantData?: ValidatedBuyerInfo, clickedButton?: string) => Promise<void>;
  debugMode?: boolean;
  soldNumbersCount?: number;
  lotteryDate?: Date; // Added prop for lottery date
}

const NumberGrid: React.FC<NumberGridProps> = ({ 
  numbers, 
  raffleSeller,
  onReserve,
  onProceedToPayment,
  debugMode = false,
  soldNumbersCount = 0,
  lotteryDate
}) => {
  // Get values from NumberSelection context
  const {
    selectedNumbers,
    highlightReserved,
    showReservedMessage,
    setShowReservedMessage,
    selectedReservedNumber,
  } = useNumberSelection();

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [clickedPaymentButton, setClickedPaymentButton] = useState<string | undefined>(undefined);
  
  // Use the context
  const { setBuyerInfo } = useBuyerInfo();

  // Use the selection handler hook instead of the component
  const { toggleNumber, handlePayReserved, clearSelection } = useSelectionHandler(
    numbers,
    raffleSeller
  );
  
  const handleCloseReservedMessage = () => {
    setShowReservedMessage(false);
  };
  
  const handleNumberToggle = (number: string, status: string) => {
    const result = toggleNumber(number, status);
    
    if (result && highlightReserved && status === 'reserved') {
      setIsPhoneModalOpen(true);
    }
  };
  
  const handleReserve = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Seleccione al menos un número para apartar');
      return;
    }
    setIsReservationModalOpen(true);
  };
  
  const handleConfirmReservation = (data: { buyerName: string; buyerPhone: string; buyerCedula: string }) => {
    if (debugMode) {
      console.log('NumberGrid.tsx: Datos de reserva:', data);
      console.log('NumberGrid.tsx: Números seleccionados:', selectedNumbers);
    }
    
    if (!data.buyerName || !data.buyerPhone) {
      toast.error('Nombre y teléfono son obligatorios');
      return;
    }
    
    // Calculate the reservation expiration date based on the logic:
    // If current date + 5 days is before lottery date, use current + 5 days
    // Otherwise use the lottery date
    const currentDate = new Date();
    const fiveDaysLater = new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    let expirationDate = fiveDaysLater;
    
    // Check if lottery date is available and compare with five days later
    if (lotteryDate && fiveDaysLater.getTime() > lotteryDate.getTime()) {
      expirationDate = lotteryDate;
    }
    
    if (debugMode) {
      console.log('NumberGrid.tsx: Current Date:', currentDate);
      console.log('NumberGrid.tsx: Five days later:', fiveDaysLater);
      console.log('NumberGrid.tsx: Lottery date:', lotteryDate);
      console.log('NumberGrid.tsx: Selected expiration date:', expirationDate);
    }
    
    // Pass the expiration date as an additional parameter to onReserve
    onReserve(selectedNumbers, data.buyerPhone, data.buyerName, data.buyerCedula);
    setIsReservationModalOpen(false);
  };
  
  const handleProceedToPayment = async (buttonType: string) => {
    console.log(`NumberGrid.tsx: handleProceedToPayment called with button type: ${buttonType}`);
    setClickedPaymentButton(buttonType);
    
    if (selectedNumbers.length === 0) {
      toast.error('Seleccione al menos un número para pagar');
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
      console.log("NumberGrid.tsx: Received validated buyer information:", {
        name: buyerInfo.name,
        phone: buyerInfo.phone,
        cedula: buyerInfo.cedula,
        id: buyerInfo.id,
        direccion: buyerInfo.direccion,
        sugerencia_producto: buyerInfo.sugerencia_producto
      });
      
      // Update context state
      setBuyerInfo(buyerInfo);
    }
    
    setIsPhoneModalOpen(false);
    
    // After validation success, automatically close the reserved message
    // since the user has successfully selected a reserved number
    setShowReservedMessage(false);
    
    if (participantId && buyerInfo) {
      await onProceedToPayment(selectedNumbers, buyerInfo, clickedPaymentButton);
    } else {
      await handleNumberValidation(validatedNumber);
    }
  };
  
  const handleNumberValidation = async (validatedNumber: string) => {
    const number = numbers.find(n => n.number === validatedNumber && n.status === 'reserved');
    
    if (!number) {
      toast.error('NumberGrid.tsx: Número no encontrado');
      return;
    }
    
    toast.success('Validación exitosa');
    await onProceedToPayment([validatedNumber]);
  };

  return (
    <div className="mb-8">
      <NumberGridHeader 
        soldNumbersCount={soldNumbersCount} 
        maxNumbers={raffleSeller.cant_max} 
      />
      
      {showReservedMessage && (
        <ReservedMessageAlert onClose={handleCloseReservedMessage} />
      )}
      
      <Card className="p-2 sm:p-4 mb-4 bg-white dark:bg-gray-800 overflow-x-auto">
        <GridLayout
          numbers={numbers}
          selectedNumbers={selectedNumbers}
          highlightReserved={highlightReserved}
          toggleNumber={handleNumberToggle}
          onPayReserved={handlePayReserved} 
        />
      </Card>
      
      <NumberGridControls 
        selectedNumbers={selectedNumbers}
        raffleSeller={raffleSeller}
        onClearSelection={clearSelection}
        onReserve={handleReserve}
        onPayReserved={handlePayReserved}
        onProceedToPayment={handleProceedToPayment}
      />
      
      <NumberGridLegend highlightReserved={highlightReserved} />
      
      <PhoneValidationModal 
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onPhoneValidationSuccess={handleValidationSuccess}
        selectedNumber={selectedReservedNumber}
        raffleNumbers={numbers}
        raffleSellerId={raffleSeller.seller_id}
        raffleId={raffleSeller.raffle_id}
        debugMode={debugMode}
      />
      
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        onConfirm={handleConfirmReservation}
        selectedNumbers={selectedNumbers}
      />
    </div>
  );
};

export default NumberGrid;
