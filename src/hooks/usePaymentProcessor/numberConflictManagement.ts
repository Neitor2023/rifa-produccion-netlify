
import { useState } from 'react';

export function useNumberConflictManagement(
  setSelectedNumbers: (numbers: string[]) => void,
  setIsPaymentModalOpen: (isOpen: boolean) => void,
  refetchRaffleNumbers: () => Promise<any>
) {
  // State for number conflict modal
  const [isConflictModalOpen, setIsConflictModalOpen] = useState<boolean>(false);
  const [conflictingNumbers, setConflictingNumbers] = useState<string[]>([]);
  
  const handleConflictModalClose = () => {
    console.log("🔄 [numberConflictManagement.ts] Cerrando modal de conflicto y refrescando números");
    setIsConflictModalOpen(false);
    setConflictingNumbers([]);
    setSelectedNumbers([]);
    setIsPaymentModalOpen(false);
    refetchRaffleNumbers();
  };

  return {
    isConflictModalOpen,
    setIsConflictModalOpen,
    conflictingNumbers,
    setConflictingNumbers,
    handleConflictModalClose
  };
}
