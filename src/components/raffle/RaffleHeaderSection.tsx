
import React from 'react';
import RaffleHeader from '@/components/RaffleHeader';
import DarkModeToggle from '@/components/DarkModeToggle';
import { Organization } from '@/lib/constants';

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
      
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
        {title || 'Cargando...'}
      </h1>
    </>
  );
};

export default RaffleHeaderSection;
