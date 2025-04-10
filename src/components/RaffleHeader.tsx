
import React from 'react';
import { Organization } from '@/lib/constants';

interface RaffleHeaderProps {
  organization: Organization;
}

const RaffleHeader: React.FC<RaffleHeaderProps> = ({ organization }) => {
  return (
    <div className="flex items-center py-3 px-4 bg-white dark:bg-gray-800 shadow-sm rounded-lg mb-4">
      <div className="flex items-center">
        <img 
          src={organization.organization_logo_url} 
          alt={organization.organization_name} 
          className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-full mr-3"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            e.currentTarget.src = "https://via.placeholder.com/100x100.png?text=Logo";
          }}
        />
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
          {organization.organization_name}
        </h1>
      </div>
    </div>
  );
};

export default RaffleHeader;
