
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface NumberGridHeaderProps {
  soldNumbersCount: number;
  maxNumbers: number;
}

const NumberGridHeader: React.FC<NumberGridHeaderProps> = ({ 
  soldNumbersCount, 
  maxNumbers 
}) => {
  return (
    <Card className="mb-4 bg-white dark:bg-gray-800 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Seleccione sus números
          </h2>
          
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2 sm:mt-0">
            🎫 Vendidos: {soldNumbersCount} / {maxNumbers}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NumberGridHeader;
