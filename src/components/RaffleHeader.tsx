
import React from 'react';
import { Organization } from '@/lib/constants';
import SafeImage from '@/components/SafeImage';
import { Card, CardContent } from '@/components/ui/card';

interface RaffleHeaderProps {
  organization: Organization;
}

const RaffleHeader: React.FC<RaffleHeaderProps> = ({ organization }) => {
  // Debug logging for organization logo
  React.useEffect(() => {
    console.log("RaffleHeader - Logo URL:", organization.organization_logo_url);
  }, [organization]);

  return (
    <Card className="mb-4 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
            <SafeImage 
              src={organization.organization_logo_url} 
              alt={organization.organization_name}
              className="w-full h-full object-cover"
              fallbackClassName="bg-gray-200 dark:bg-gray-700"
            />
          </div>
          <h1 className="ml-3 text-lg sm:text-xl font-semibold">
            {organization.organization_name}
          </h1>
        </div>
      </CardContent>
    </Card>
  );
};

export default RaffleHeader;
