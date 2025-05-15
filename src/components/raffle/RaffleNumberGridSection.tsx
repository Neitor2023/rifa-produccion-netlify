
import React from 'react';
import NumberGrid from '../NumberGrid';
import { ValidatedBuyerInfo } from '@/types/participant';
import { Organization } from '@/lib/constants/types';

interface RaffleNumberGridSectionProps {
  raffleNumbers: any[];
  formatNumbersForGrid: (numbers: any[]) => any[];
  raffleSeller: any;
  raffleId: string;
  sellerId: string;
  debugMode?: boolean;
  onReserve: (selectedNumbers: string[], buyerPhone?: string, buyerName?: string, buyerCedula?: string) => Promise<void>;
  onProceedToPayment: (selectedNumbers: string[], participantData?: ValidatedBuyerInfo, clickedButton?: string) => Promise<void>;
  getSoldNumbersCount: () => number;
  reservationDays?: number;
  lotteryDate?: Date;
  organization?: Organization;
  totalNumbers?: number;
  mini_instructivo?: string;
}

const RaffleNumberGridSection: React.FC<RaffleNumberGridSectionProps> = ({ 
  raffleNumbers, 
  formatNumbersForGrid, 
  raffleSeller, 
  raffleId, 
  sellerId,
  debugMode = false,
  onReserve,
  onProceedToPayment,
  getSoldNumbersCount,
  reservationDays,
  lotteryDate,
  organization,
  totalNumbers,
  mini_instructivo
}) => {
  // Validar que raffleId y sellerId estén definidos
  if (!raffleId) {
    console.error("❌ Error: raffleId está undefined en RaffleNumberGridSection. No se puede continuar.");
    return <div className="text-red-600 p-4 bg-red-100 rounded-md">Error: ID de rifa no disponible. Por favor recargue la página.</div>;
  }

  if (!sellerId) {
    console.error("❌ Error: sellerId está undefined en RaffleNumberGridSection. No se puede continuar.");
    return <div className="text-red-600 p-4 bg-red-100 rounded-md">Error: ID de vendedor no disponible. Por favor recargue la página.</div>;
  }

  const formattedNumbers = formatNumbersForGrid(raffleNumbers);
  
  return (
    <NumberGrid 
      numbers={formattedNumbers}
      raffleSeller={{
        id: raffleSeller?.id || 'default',
        raffle_id: raffleId,
        seller_id: sellerId,
        active: raffleSeller?.active || true,
        cant_max: raffleSeller?.cant_max || 0
      }}
      onReserve={onReserve}
      onProceedToPayment={onProceedToPayment}
      debugMode={debugMode}
      soldNumbersCount={getSoldNumbersCount()}
      reservationDays={reservationDays}
      lotteryDate={lotteryDate}
      organization={organization}
      totalNumbers={totalNumbers}
      mini_instructivo={mini_instructivo}
    />
  );
};

export default RaffleNumberGridSection;
