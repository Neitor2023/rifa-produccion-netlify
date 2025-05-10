
import { useState } from 'react';
import { toast } from 'sonner';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';

interface UseNumberGridStateProps {
  numbers: any[];
  raffleSeller: {
    id: string;
    seller_id: string;
    cant_max: number;
    active: boolean;
  };
  debugMode?: boolean;
}

export const useNumberGridState = ({
  numbers,
  raffleSeller,
  debugMode = false
}: UseNumberGridStateProps) => {
  console.log("🔄 useNumberGridState: Entry point");
  
  // Access selection context
  const {
    selectedNumbers,
    setSelectedNumbers,
    highlightReserved,
    setHighlightReserved,
    showReservedMessage,
    setShowReservedMessage,
    selectedReservedNumber,
    setSelectedReservedNumber,
    clearSelectionState
  } = useNumberSelection();

  // Handle toggling a number's selection
  const toggleNumber = (number: string, status: string) => {
    if (debugMode) {
      console.log(`useNumberGridState: Toggle number called with number=${number}, status=${status}`);
    }
    
    if (highlightReserved && status === 'reserved') {
      const selectedNumber = numbers.find(n => n.number === number);
      if (selectedNumber) {
        const allReservedNumbers = numbers
          .filter(n => 
            n.status === 'reserved' && 
            n.participant_id === selectedNumber.participant_id
          )
          .map(n => n.number);
          
        setSelectedNumbers(allReservedNumbers);
        setSelectedReservedNumber(number);
        return true; // Return true to indicate the phone modal should be opened
      }
      return false;
    }
    
    if (status !== 'available') return false;
    
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        if (prev.length >= raffleSeller.cant_max) {
          toast.error(`You cannot select more than ${raffleSeller.cant_max} numbers`);
          return prev;
        }
        return [...prev, number];
      }
    });
    
    return false;
  };

  console.log("✅ useNumberGridState: Exit with selectedNumbers", selectedNumbers.length);
  
  return {
    selectedNumbers,
    setSelectedNumbers,
    highlightReserved,
    setHighlightReserved,
    showReservedMessage,
    setShowReservedMessage,
    selectedReservedNumber,
    setSelectedReservedNumber,
    clearSelectionState,
    toggleNumber
  };
};
