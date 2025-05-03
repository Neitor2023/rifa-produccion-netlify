
import React, { useCallback } from 'react';
import { toast } from 'sonner';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';

interface SelectionHandlerProps {
  numbers: any[];
  raffleSeller: {
    cant_max: number;
  };
}

// Return type is now JSX.Element, making it a proper React component
const SelectionHandler: React.FC<SelectionHandlerProps> = ({ 
  numbers,
  raffleSeller
}) => {
  const {
    selectedNumbers,
    setSelectedNumbers,
    highlightReserved,
    setHighlightReserved,
    setShowReservedMessage,
    setSelectedReservedNumber,
    clearSelectionState
  } = useNumberSelection();

  const handlePayReserved = useCallback(() => {
    console.log('SelectionHandler.tsx: handlePayReserved called');
    
    // Set the clicked button
    if (highlightReserved) {
      // If we're already in highlight mode, don't do anything
      return;
    }
    
    const reservedNumbers = numbers.filter(n => n.status === 'reserved');
    if (reservedNumbers.length === 0) {
      toast.warning('No hay números apartados para pagar');
      // Auto-close the message since there are no reserved numbers
      setShowReservedMessage(false);
      return;
    }
    
    setHighlightReserved(true);
    setShowReservedMessage(true);
    toast.info(`Hay ${reservedNumbers.length} número(s) apartados. Seleccione uno para proceder al pago.`);
  }, [numbers, highlightReserved, setHighlightReserved, setShowReservedMessage]);

  const toggleNumber = useCallback((number: string, status: string) => {
    console.log(`SelectionHandler.tsx: Toggle number called with number=${number}, status=${status}`);
    
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
        return true; // Signal that we handled a reserved number click
      }
      return false;
    }
    
    if (status !== 'available') return false;
    
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        if (prev.length >= raffleSeller.cant_max) {
          toast.error(`No puede seleccionar más de ${raffleSeller.cant_max} números`);
          return prev;
        }
        return [...prev, number];
      }
    });
    
    return true;
  }, [highlightReserved, numbers, raffleSeller.cant_max, setSelectedNumbers, setSelectedReservedNumber]);

  // Use the shared clearSelection function from context
  const clearSelection = useCallback(() => {
    console.log("SelectionHandler.tsx: Clear selection function called");
    clearSelectionState();
  }, [clearSelectionState]);

  // Instead of returning an object with functions, provide the functions via a custom hook
  return (
    <div style={{ display: 'none' }} data-testid="selection-handler">
      {/* This is a non-rendering component that provides functionality */}
    </div>
  );
};

// Export the component
export default SelectionHandler;

// Export a custom hook to access the selection handler functions
export const useSelectionHandler = (
  numbers: any[], 
  raffleSeller: { cant_max: number }
) => {
  const {
    selectedNumbers,
    setSelectedNumbers,
    highlightReserved,
    setHighlightReserved,
    setShowReservedMessage,
    setSelectedReservedNumber,
    clearSelectionState
  } = useNumberSelection();

  const handlePayReserved = () => {
    console.log('SelectionHandler.tsx: handlePayReserved called');
    
    if (highlightReserved) {
      // If we're already in highlight mode, don't do anything
      return;
    }
    
    const reservedNumbers = numbers.filter(n => n.status === 'reserved');
    if (reservedNumbers.length === 0) {
      toast.warning('No hay números apartados para pagar');
      // Auto-close the message since there are no reserved numbers
      setShowReservedMessage(false);
      return;
    }
    
    setHighlightReserved(true);
    setShowReservedMessage(true);
    toast.info(`Hay ${reservedNumbers.length} número(s) apartados. Seleccione uno para proceder al pago.`);
  };

  const toggleNumber = (number: string, status: string) => {
    console.log(`SelectionHandler.tsx: Toggle number called with number=${number}, status=${status}`);
    
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
        return true; // Signal that we handled a reserved number click
      }
      return false;
    }
    
    if (status !== 'available') return false;
    
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        if (prev.length >= raffleSeller.cant_max) {
          toast.error(`No puede seleccionar más de ${raffleSeller.cant_max} números`);
          return prev;
        }
        return [...prev, number];
      }
    });
    
    return true;
  };

  const clearSelection = () => {
    console.log("SelectionHandler.tsx: Clear selection function called");
    clearSelectionState();
  };

  return {
    toggleNumber,
    handlePayReserved,
    clearSelection
  };
};
