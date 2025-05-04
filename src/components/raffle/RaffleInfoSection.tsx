
import React from 'react';
import RaffleInfo from '@/components/RaffleInfo';
import SellerInfo from '@/components/SellerInfo';
import OrganizerInfo from '@/components/OrganizerInfo';
import { Organization } from '@/lib/constants';

interface RaffleInfoSectionProps {
  raffle: any;
  seller: any;
  organization: Organization | null;
}

const RaffleInfoSection: React.FC<RaffleInfoSectionProps> = ({ 
  raffle, 
  seller, 
  organization 
}) => {
  return (
    <>
      {raffle && (
        <RaffleInfo
          title={raffle.title || 'Sin título'}
          details={raffle.description || ''}
          drawInfo={`${raffle.lottery || 'Sorteo'} - ${raffle.date_lottery || 'Fecha pendiente'}`}
          instructions={raffle.payment_instructions || ''}
          priceInfo={`${raffle.price || 0} ${raffle.currency || ''}`}
        />
      )}
      
      {seller && (
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
