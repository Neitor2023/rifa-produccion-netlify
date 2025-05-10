
import React from 'react';
import { Toaster } from 'sonner';
import { Card } from '@/components/ui/card';
import NumberGridHeader from './NumberGridHeader';
import { NumberGridControls } from './NumberGridControls';
import { NumberGridLegend } from './NumberGridLegend';
import GridLayout from './NumberGrid/GridLayout';
import ReservedMessageAlert from './NumberGrid/ReservedMessageAlert';
import ValidationModals from './NumberGrid/ValidationModals';
import { useGridHandlers } from './NumberGrid/useGridHandlers';
import { ValidatedBuyerInfo } from '@/types/participant';
import { Organization } from '@/lib/constants/types';

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
  reservationDays?: number;
  lotteryDate?: Date;
  organization?: Organization;
  totalNumbers?: number;
  mini_instructivo?: string;
}

const NumberGrid: React.FC<NumberGridProps> = ({ 
  numbers, 
  raffleSeller,
  onReserve,
  onProceedToPayment,
  debugMode = false,
  soldNumbersCount = 0,
  reservationDays,
  lotteryDate,
  organization,
  totalNumbers,
  mini_instructivo,
}) => {
  const {
    // State
    isPhoneModalOpen,
    setIsPhoneModalOpen,
    isReservationModalOpen,
    setIsReservationModalOpen,
    selectedNumbers,
    highlightReserved,
    showReservedMessage,
    selectedReservedNumber,
    
    // Handlers
    handlePayReserved,
    handleCloseReservedMessage,
    toggleNumber,
    clearSelectionState,
    handleReserve,
    handleConfirmReservation,
    handleProceedToPayment,
    handleValidationSuccess
  } = useGridHandlers({
    numbers,
    raffleSeller,
    onReserve,
    onProceedToPayment,
    debugMode,
    reservationDays,
    lotteryDate
  });

  return (
    <div className="mb-8">
      <NumberGridHeader 
        soldNumbersCount={soldNumbersCount} 
        maxNumbers={raffleSeller.cant_max} 
      />
      
      {showReservedMessage && (
        <ReservedMessageAlert onClose={handleCloseReservedMessage} />
      )}
      
      <Card className="p-2 sm:p-4 mb-4 overflow-x-auto">
        <GridLayout
          numbers={numbers}
          selectedNumbers={selectedNumbers}
          highlightReserved={highlightReserved}
          toggleNumber={toggleNumber}
          onPayReserved={handlePayReserved}
          organization={organization}
          totalNumbers={totalNumbers}
        />
      </Card>
      
      <NumberGridControls 
        selectedNumbers={selectedNumbers}
        raffleSeller={raffleSeller}
        onClearSelection={clearSelectionState}
        onReserve={handleReserve}
        onPayReserved={handlePayReserved}
        onProceedToPayment={handleProceedToPayment}
      />
      
      <NumberGridLegend 
        highlightReserved={highlightReserved} 
        organization={organization}
        mini_instructivo={mini_instructivo}
      />
      
      <ValidationModals 
        isPhoneModalOpen={isPhoneModalOpen}
        setIsPhoneModalOpen={setIsPhoneModalOpen}
        isReservationModalOpen={isReservationModalOpen}
        setIsReservationModalOpen={setIsReservationModalOpen}
        selectedReservedNumber={selectedReservedNumber}
        raffleNumbers={numbers}
        raffleSellerId={raffleSeller.seller_id}
        raffleId={raffleSeller.raffle_id}
        debugMode={debugMode}
        handleValidationSuccess={handleValidationSuccess}
        handleConfirmReservation={handleConfirmReservation}
        selectedNumbers={selectedNumbers}
        organization={organization}
      />
    </div>
  );
};

export default NumberGrid;
