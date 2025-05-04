
import React from 'react';
import RaffleInfo from '@/components/RaffleInfo';
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
      
      {organization && <OrganizerInfo organization={organization} />}
    </>
  );
};

export default RaffleInfoSection;
