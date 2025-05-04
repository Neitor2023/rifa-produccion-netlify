
import React from 'react';
import RaffleInfo from '@/components/RaffleInfo';
import SellerInfo from '@/components/SellerInfo';
import OrganizerInfo from '@/components/OrganizerInfo';
import { Organization } from '@/lib/constants';

interface RaffleInfoSectionProps {
  raffle: any;
  seller?: any; // Make seller optional
  organization: Organization | null;
  excludeSellerInfo?: boolean; // Add the new prop
}

const RaffleInfoSection: React.FC<RaffleInfoSectionProps> = ({ 
  raffle, 
  seller, 
  organization,
  excludeSellerInfo = false // Default to false to maintain backward compatibility
}) => {
  return (
    <>
      {raffle && (
        <RaffleInfo
          description={raffle.description}
          lottery={raffle.lottery}
          dateLottery={raffle.date_lottery}
          paymentInstructions={raffle.payment_instructions}
          price={raffle.price}
          currency={raffle.currency}
        />
      )}
      
      {/* Only render SellerInfo if excludeSellerInfo is false and seller exists */}
      {!excludeSellerInfo && seller && (
        <SellerInfo
          name={seller.name}
          phone={seller.phone}
          avatar={seller.avatar}
          id={seller.id}
        />
      )}
      
      {organization && <OrganizerInfo organization={organization} />}
      
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 italic mb-8">
        Las plataformas de redes sociales no están asociadas a esta rifa.
      </div>
    </>
  );
};

export default RaffleInfoSection;
