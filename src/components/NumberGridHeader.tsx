
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface NumberGridHeaderProps {
  soldNumbersCount?: number;
  maxNumbers?: number;
}

const NumberGridHeader: React.FC<NumberGridHeaderProps> = ({ 
  soldNumbersCount = 0, 
  maxNumbers = 100 
}) => {
  const remainingNumbers = maxNumbers - soldNumbersCount;

  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
        Números Disponibles
      </h2>
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="outline" className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800">
          Vendidos: <span className="font-bold ml-1">{soldNumbersCount}</span>
        </Badge>
        <Badge variant="outline" className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800">
          Disponibles: <span className="font-bold ml-1">{remainingNumbers}</span>
        </Badge>
      </div>
    </div>
  );
};

export default NumberGridHeader;
