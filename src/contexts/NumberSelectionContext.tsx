
import React, { createContext, useContext, useState } from 'react';

interface NumberSelectionContextType {
  selectedNumbers: string[];
  setSelectedNumbers: React.Dispatch<React.SetStateAction<string[]>>;
  highlightReserved: boolean;
  setHighlightReserved: React.Dispatch<React.SetStateAction<boolean>>;
  showReservedMessage: boolean;
  setShowReservedMessage: React.Dispatch<React.SetStateAction<boolean>>;
  selectedReservedNumber: string | null;
  setSelectedReservedNumber: React.Dispatch<React.SetStateAction<string | null>>;
  clearSelectionState: () => void;
}

const NumberSelectionContext = createContext<NumberSelectionContextType | undefined>(undefined);

export const NumberSelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [highlightReserved, setHighlightReserved] = useState(false);
  const [showReservedMessage, setShowReservedMessage] = useState(false);
  const [selectedReservedNumber, setSelectedReservedNumber] = useState<string | null>(null);

  const clearSelectionState = () => {
    console.log("NumberSelectionContext.tsx: Clearing selection state");
    setSelectedNumbers([]);
    setHighlightReserved(false);
    setShowReservedMessage(false);
    setSelectedReservedNumber(null);
    // Removed the toast notification from here to avoid duplication
  };

  return (
    <NumberSelectionContext.Provider value={{
      selectedNumbers,
      setSelectedNumbers,
      highlightReserved,
      setHighlightReserved,
      showReservedMessage,
      setShowReservedMessage,
      selectedReservedNumber,
      setSelectedReservedNumber,
      clearSelectionState
    }}>
      {children}
    </NumberSelectionContext.Provider>
  );
};

export const useNumberSelection = (): NumberSelectionContextType => {
  const context = useContext(NumberSelectionContext);
  if (context === undefined) {
    throw new Error('useNumberSelection must be used within a NumberSelectionProvider');
  }
  return context;
};
