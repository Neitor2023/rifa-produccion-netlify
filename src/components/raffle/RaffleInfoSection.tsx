
import React from 'react';
import RaffleInfo from '@/components/RaffleInfo';
import OrganizerInfo from '@/components/OrganizerInfo';
import { Organization } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';

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
      
      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="text-center text-xs italic">
            Las plataformas de redes sociales no están asociadas a esta rifa.
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default RaffleInfoSection;
