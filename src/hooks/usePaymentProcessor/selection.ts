
import { useState } from "react";

export function useSelection() {
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  
  const resetSelection = () => {
    console.log("🔄 useSelection: Resetting selected numbers");
    setSelectedNumbers([]);
  };
  
  return { selectedNumbers, setSelectedNumbers, resetSelection };
}
