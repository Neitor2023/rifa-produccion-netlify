
import React from 'react';
import { Organization } from '@/lib/constants';
import SafeImage from '@/components/SafeImage';

interface RaffleHeaderProps {
  organization: Organization;
}

const RaffleHeader: React.FC<RaffleHeaderProps> = ({ organization }) => {
  return (
    <div className="flex items-center py-3 px-4 bg-white dark:bg-gray-800 shadow-sm rounded-lg mb-4">
      <div className="flex items-center">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
          <SafeImage 
            src={organization.organization_logo_url} 
            alt={organization.organization_name}
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="ml-3 text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
          {organization.organization_name}
        </h1>
      </div>
    </div>
  );
};

export default RaffleHeader;
