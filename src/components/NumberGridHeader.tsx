
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
    <Card className="mb-4 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h2 className="text-lg font-semibold">
            Seleccione sus números
          </h2>
          
          <div className="text-sm font-medium mt-2 sm:mt-0">
            🎫 Vendidos: {soldNumbersCount} / {maxNumbers}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NumberGridHeader;
