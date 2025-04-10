
import React from 'react';
import { Organization } from '@/lib/constants';

interface RaffleHeaderProps {
  organization: Organization;
}

const RaffleHeader: React.FC<RaffleHeaderProps> = ({ organization }) => {
  return (
    <div className="flex items-center p-4 bg-white shadow-sm rounded-lg mb-4">
      <div className="flex items-center">
        <img 
          src={organization.organization_logo_url} 
          alt={organization.organization_name} 
          className="w-10 h-10 object-cover rounded-full mr-3"
        />
        <h1 className="text-lg font-semibold text-gray-800">
          {organization.organization_name}
        </h1>
      </div>
    </div>
  );
};

export default RaffleHeader;
