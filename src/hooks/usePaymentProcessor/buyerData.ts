
import { useState, useEffect } from "react";
import { ValidatedBuyerInfo } from '@/types/participant';

export function useBuyerData() {
  const [validatedBuyerData, setValidatedBuyerData] = useState<ValidatedBuyerInfo | null>(null);
  
  // Log whenever the buyer data changes
  useEffect(() => {
    if (validatedBuyerData) {
      console.log("🔵 useBuyerData - Buyer data updated:", validatedBuyerData);
    }
  }, [validatedBuyerData]);
  
  return { validatedBuyerData, setValidatedBuyerData };
}
