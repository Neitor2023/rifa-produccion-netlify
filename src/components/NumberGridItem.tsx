
import React from 'react';
import SafeImage from '@/components/SafeImage';

interface NumberGridItemProps {
  number: string;
  status: string;
  isSelected: boolean;
  isHighlighted: boolean;
  onToggle: () => void;
  checklistImage?: string; // Add the checklist image URL prop
}

const NumberGridItem: React.FC<NumberGridItemProps> = ({ 
  number, 
  status, 
  isSelected, 
  isHighlighted, 
  onToggle,
  checklistImage // Add the checklist image parameter
}) => {
  const getClassNames = () => {
    const baseClasses = 'number-grid-item flex items-center justify-center border rounded-md h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 cursor-pointer text-sm font-medium transition-colors duration-150';
    
    if (status !== 'available' && !isHighlighted) {
      return `${baseClasses} bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400`;
    }
    
    if (isSelected) {
      return `${baseClasses} bg-rifa-purple text-white dark:bg-purple-700 dark:text-white border-rifa-purple dark:border-purple-600`;
    }
    
    if (isHighlighted) {
      return `${baseClasses} bg-amber-300 text-amber-950 border-amber-500 hover:bg-amber-400`;
    }
    
    if (status === 'available') {
      return `${baseClasses} bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200`;
    }
    
    return baseClasses;
  };

  // Show the checklist image for sold numbers
  if (status === 'sold' && checklistImage) {
    return (
      <div className={getClassNames()} onClick={undefined}>
        <div className="relative w-full h-full flex items-center justify-center">
          <span className="absolute opacity-20">{number}</span>
          <SafeImage 
            src={checklistImage} 
            alt="Vendido" 
            className="w-full h-full object-contain p-1" 
            fallbackClassName="bg-transparent"
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={getClassNames()} 
      onClick={status === 'available' || isHighlighted ? onToggle : undefined}
    >
      {number}
    </div>
  );
};

export default NumberGridItem;
