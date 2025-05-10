
import React from 'react';
import DarkModeToggle from '@/components/DarkModeToggle';
import { Organization } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import SafeImage from '@/components/SafeImage';

interface RaffleHeaderSectionProps {
  organization: Organization | null;
}

const RaffleHeaderSection: React.FC<RaffleHeaderSectionProps> = ({ 
  organization
}) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          {/* Nombre de la organización en su propia tarjeta con espaciado reducido */}
          {organization && (
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    <SafeImage 
                      src={organization.organization_logo_url} 
                      alt={organization.organization_name}
                      className="w-full h-full object-cover"
                      fallbackClassName="bg-gray-200 dark:bg-gray-700"
                    />
                  </div>
                  <h1 className="ml-2 text-base sm:text-lg font-semibold">
                    {organization.organization_name}
                  </h1>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <DarkModeToggle />
      </div>
    </>
  );
};

export default RaffleHeaderSection;
