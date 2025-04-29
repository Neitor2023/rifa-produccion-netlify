
import { useState } from "react";

export function useSelection() {
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  
  const resetSelection = () => {
    setSelectedNumbers([]);
  };
  
  return { selectedNumbers, setSelectedNumbers, resetSelection };
}
