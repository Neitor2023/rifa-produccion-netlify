
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface NumberGridLegendProps {
  highlightReserved: boolean;
}

export const NumberGridLegend: React.FC<NumberGridLegendProps> = ({ highlightReserved }) => {
  return (
    <Card className="mt-4 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center">
            <div className="h-4 w-4 border dark:border-gray-600 rounded-sm mr-2"></div>
            <span className="text-sm font-bold text-card-foreground">DISPONIBLE</span>
          </div>
          
          <div className="flex items-center">
            <div className="h-4 w-4 bg-rifa-purple dark:bg-purple-700 rounded-sm mr-2"></div>
            <span className="text-sm font-bold text-card-foreground">SELECCIONADO</span>
          </div>
          
          <div className="flex items-center">
            <div className="h-4 w-4 bg-gray-100 dark:bg-gray-700 rounded-sm mr-2"></div>
            <span className="text-sm font-bold text-card-foreground">NO DISPONIBLE</span>
          </div>
          
          {highlightReserved && (
            <div className="flex items-center">
              <div className="h-4 w-4 bg-amber-300 border-amber-500 rounded-sm mr-2"></div>
              <span className="text-sm font-bold text-card-foreground">APARTADO</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
