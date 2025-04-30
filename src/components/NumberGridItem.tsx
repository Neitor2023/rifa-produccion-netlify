
import React from 'react';

interface NumberGridItemProps {
  number: string;
  status: string;
  isSelected: boolean;
  isHighlighted: boolean;
  onToggle: () => void;
}

const NumberGridItem: React.FC<NumberGridItemProps> = ({ 
  number, 
  status, 
  isSelected, 
  isHighlighted, 
  onToggle 
}) => {
  const getClassNames = () => {
    const baseClasses = 'number-grid-item flex items-center justify-center border rounded-md h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-sm font-medium transition-colors duration-150';
    
    // Sold numbers should be disabled and styled differently
    if (status === 'sold') {
      return `${baseClasses} bg-gray-200 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60`;
    }
    
    // Other unavailable numbers
    if (status !== 'available' && status !== 'reserved' && !isHighlighted) {
      return `${baseClasses} bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400`;
    }
    
    if (isSelected) {
      return `${baseClasses} bg-rifa-purple text-white dark:bg-purple-700 dark:text-white border-rifa-purple dark:border-purple-600 cursor-pointer`;
    }
    
    if (isHighlighted) {
      return `${baseClasses} bg-amber-300 text-amber-950 border-amber-500 hover:bg-amber-400 cursor-pointer`;
    }
    
    if (status === 'available') {
      return `${baseClasses} bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-pointer`;
    }
    
    return `${baseClasses} cursor-pointer`;
  };

  // Determine if the number is clickable - sold numbers should never be clickable
  const isClickable = status === 'available' || isHighlighted || (status === 'reserved' && isHighlighted);

  // Logging for sold numbers
  React.useEffect(() => {
    if (status === 'sold') {
      console.log(`▶️ NumberGridItem.tsx: Número ${number} está vendido y no seleccionable`);
    }
  }, [status, number]);

  return (
    <div 
      className={getClassNames()} 
      onClick={isClickable ? onToggle : undefined}
      role="button"
      tabIndex={isClickable ? 0 : -1}
      aria-disabled={!isClickable}
    >
      {number}
    </div>
  );
};

export default NumberGridItem;
