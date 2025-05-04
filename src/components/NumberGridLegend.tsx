
import React from 'react';

interface NumberGridLegendProps {
  highlightReserved: boolean;
}

export const NumberGridLegend: React.FC<NumberGridLegendProps> = ({ highlightReserved }) => {
  return (
    <div className="mt-4 flex flex-wrap gap-4 justify-center">
      <div className="flex items-center">
        <div className="h-4 w-4 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-sm mr-2"></div>
        <span className="text-xs text-gray-600 dark:text-gray-400">Disponible</span>
      </div>
      
      <div className="flex items-center">
        <div className="h-4 w-4 bg-rifa-purple dark:bg-purple-700 rounded-sm mr-2"></div>
        <span className="text-xs text-gray-600 dark:text-gray-400">Seleccionado</span>
      </div>
      
      <div className="flex items-center">
        <div className="h-4 w-4 bg-gray-100 dark:bg-gray-700 rounded-sm mr-2"></div>
        <span className="text-xs text-gray-600 dark:text-gray-400">No disponible</span>
      </div>
      
      {highlightReserved && (
        <div className="flex items-center">
          <div className="h-4 w-4 bg-amber-300 border-amber-500 rounded-sm mr-2"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Apartado</span>
        </div>
      )}
    </div>
  );
};
