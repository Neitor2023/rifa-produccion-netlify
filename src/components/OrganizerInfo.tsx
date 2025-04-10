
import React from 'react';
import { Organization } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Phone } from 'lucide-react';

interface OrganizerInfoProps {
  organization: Organization;
}

const OrganizerInfo: React.FC<OrganizerInfoProps> = ({ organization }) => {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Organizadores:</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Organizer */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <img 
                src={organization.org_photo} 
                alt={organization.org_name} 
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-100">{organization.org_name}</h3>
                <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mt-1">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>{organization.org_phone_number}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Organizador</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Administrator */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <img 
                src={organization.admin_photo} 
                alt={organization.admin_name} 
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-100">{organization.admin_name}</h3>
                <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mt-1">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>{organization.admin_phone_number}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Administrador</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrganizerInfo;
