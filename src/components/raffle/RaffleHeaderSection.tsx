
import React from 'react';
import DarkModeToggle from '@/components/DarkModeToggle';
import { Organization } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import SafeImage from '@/components/SafeImage';

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
          {/* Nombre de la organización en su propia tarjeta */}
          {organization && (
            <Card className="mb-4 bg-white dark:bg-gray-800 shadow-sm">
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
                  <h1 className="ml-3 text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {organization.organization_name}
                  </h1>
                </div>
              </CardContent>
            </Card>
          )}
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
