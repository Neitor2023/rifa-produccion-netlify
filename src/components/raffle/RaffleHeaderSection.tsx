
import React from 'react';
import RaffleHeader from '@/components/RaffleHeader';
import DarkModeToggle from '@/components/DarkModeToggle';
import { Organization } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';

interface RaffleHeaderSectionProps {
  organization: Organization | null;
  title: string;
}

const RaffleHeaderSection: React.FC<RaffleHeaderSectionProps> = ({ 
  organization, 
  title 
}) => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          {organization && <RaffleHeader organization={organization} />}
        </div>
        <DarkModeToggle />
      </div>
      
      {/* Título de la rifa en su propia tarjeta */}
      <Card className="mb-6 bg-white dark:bg-gray-800 shadow-sm">
        <CardContent className="p-4">
          <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
            {title || 'Cargando...'}
          </h1>
        </CardContent>
      </Card>
    </>
  );
};

export default RaffleHeaderSection;
