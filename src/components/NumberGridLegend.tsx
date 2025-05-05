
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Circle, CircleDot } from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import { Organization } from '@/lib/constants/types';

interface NumberGridLegendProps {
  highlightReserved: boolean;
  organization?: Organization;
}

export const NumberGridLegend: React.FC<NumberGridLegendProps> = ({ 
  highlightReserved, 
  organization 
}) => {
  return (
    <Card className="mt-4 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center">
            <div className="h-4 w-4 border dark:border-gray-600 rounded-sm mr-2"></div>
            <div className="h-4 w-4 bg-gray-100 dark:bg-gray-700 rounded-sm mr-2"></div>            
            <span className="text-xs font-bold text-card-foreground">DISPONIBLE</span>
          </div>
          
          <div className="flex items-center">
            <div className="h-4 w-4 bg-rifa-purple dark:bg-purple-700 rounded-sm mr-2"></div>
            <span className="text-xs font-bold text-card-foreground">SELECCIONADO</span>
          </div>
          
          {organization?.image_checklist && (
            <div className="flex items-center">
              <div className="h-4 w-4 mr-2 flex items-center justify-center">
                <SafeImage
                  src={organization.image_checklist}
                  alt="Vendido"
                  className="w-4 h-4 object-contain"
                  fallbackClassName="bg-transparent"
                />
              </div>
              <span className="text-xs font-bold text-card-foreground">VENDIDO</span>
            </div>
          )}
          
          {organization?.image_apartado && (
            <div className="flex items-center">
              <div className="h-4 w-4 mr-2 flex items-center justify-center">
                <SafeImage
                  src={organization.image_apartado}
                  alt="Apartado"
                  className="w-4 h-4 object-contain"
                  fallbackClassName="bg-transparent"
                />
              </div>
              <span className="text-xs font-bold text-card-foreground">APARTADO</span>
            </div>
          )}
          
          {highlightReserved && (
            <div className="flex items-center">
              <div className="h-4 w-4 bg-amber-300 border-amber-500 rounded-sm mr-2"></div>
              <span className="text-xs font-bold text-card-foreground">APARTADO</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
