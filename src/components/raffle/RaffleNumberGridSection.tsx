
import React from 'react';
import NumberGrid from '@/components/NumberGrid';
import { ValidatedBuyerInfo } from '@/types/participant';

interface RaffleNumberGridSectionProps {
  raffleNumbers: any[] | null;
  formatNumbersForGrid: () => any[];
  raffleSeller: {
    id: string;
    raffle_id: string;
    seller_id: string;
    active: boolean;
    cant_max: number;
  } | null;
  raffleId: string;
  sellerId: string;
  debugMode: boolean;
  onReserve: (numbers: string[], buyerPhone?: string, buyerName?: string, buyerCedula?: string) => Promise<void>;
  onProceedToPayment: (numbers: string[], participantData?: ValidatedBuyerInfo, clickedButton?: string) => Promise<void>;
  getSoldNumbersCount: () => number;
  reservationDays?: number;  // Add the reservationDays prop
  lotteryDate?: Date;        // Add the lotteryDate prop
}

const RaffleNumberGridSection: React.FC<RaffleNumberGridSectionProps> = ({ 
  raffleNumbers,
  formatNumbersForGrid,
  raffleSeller,
  raffleId,
  sellerId,
  debugMode,
  onReserve,
  onProceedToPayment,
  getSoldNumbersCount,
  reservationDays,  // Get the reservationDays prop
  lotteryDate       // Get the lotteryDate prop
}) => {
  if (!raffleNumbers) return null;
  
  return (
    <div className="mb-8">
      <NumberGrid 
        numbers={formatNumbersForGrid()}
        raffleSeller={{
          id: raffleSeller?.id || 'default',
          raffle_id: raffleId,
          seller_id: raffleSeller?.seller_id || sellerId,
          active: raffleSeller?.active || true,
          cant_max: raffleSeller?.cant_max || 33
        }}
        onReserve={onReserve}
        onProceedToPayment={onProceedToPayment}
        debugMode={debugMode}
        soldNumbersCount={getSoldNumbersCount()} // Call getSoldNumbersCount with no arguments
        reservationDays={reservationDays}  // Pass the reservationDays to NumberGrid
        lotteryDate={lotteryDate}          // Pass the lotteryDate to NumberGrid
      />
    </div>
  );
};

export default RaffleNumberGridSection;
