
import React from 'react';

interface NumberGridHeaderProps {
  soldNumbersCount: number;
  maxNumbers: number;
}

const NumberGridHeader: React.FC<NumberGridHeaderProps> = ({ 
  soldNumbersCount, 
  maxNumbers 
}) => {
  return (
    <>
      <h2 className="text-lg font-semibold mb-4 text-center text-gray-800 dark:text-gray-200">
        Seleccione sus números
      </h2>
      
      <div className="mb-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
        🎫 Vendidos: {soldNumbersCount} / {maxNumbers}
      </div>
    </>
  );
};

export default NumberGridHeader;
