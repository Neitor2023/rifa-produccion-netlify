
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
import { useReservationHandler } from './NumberGrid/ReservationHandler';

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
  reservationDays?: number; // Added prop for reservation days
}

const NumberGrid: React.FC<NumberGridProps> = ({ 
  numbers, 
  raffleSeller,
  onReserve,
  onProceedToPayment,
  debugMode = false,
  soldNumbersCount = 0,
  lotteryDate,
  reservationDays = 10 // Default to 5 days if not provided
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

  // Debug log for reservation days and lottery date
  if (debugMode) {
    console.log("NumberGrid.tsx: Received reservationDays:", reservationDays);
    console.log("NumberGrid.tsx: Received lotteryDate:", lotteryDate);
  }

  // Use the selection handler hook instead of the component
  const { toggleNumber, handlePayReserved, clearSelection } = useSelectionHandler(
    numbers,
    raffleSeller
  );
  
  // Use our new reservation handler
  const { handleConfirmReservation } = useReservationHandler({
    selectedNumbers,
    onReserve,
    reservationDays,
    lotteryDate,
    debugMode,
    onClose: () => setIsReservationModalOpen(false)
  });
  
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
      toast.error('Select at least one number to reserve');
      return;
    }
    setIsReservationModalOpen(true);
  };
  
  const handleProceedToPayment = async (buttonType: string) => {
    console.log(`NumberGrid.tsx: handleProceedToPayment called with button type: ${buttonType}`);
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
      toast.error('NumberGrid.tsx: Number not found');
      return;
    }
    
    toast.success('Validation successful');
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
