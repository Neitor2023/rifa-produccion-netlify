
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
  getSoldNumbersCount: (sellerId: string) => number;
  lotteryDate?: Date; // Added lottery date
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
  lotteryDate
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
        soldNumbersCount={getSoldNumbersCount(sellerId)}
        lotteryDate={lotteryDate}
      />
    </div>
  );
};

export default RaffleNumberGridSection;
