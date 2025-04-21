
import { useState } from "react";
export function useSelection() {
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  return { selectedNumbers, setSelectedNumbers };
}
