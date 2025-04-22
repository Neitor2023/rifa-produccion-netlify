
import { useState, useEffect } from "react";
import { ValidatedBuyerInfo } from '@/types/participant';

export function useBuyerData() {
  const [validatedBuyerData, setValidatedBuyerData] = useState<ValidatedBuyerInfo | null>(null);
  
  // Log whenever the buyer data changes
  useEffect(() => {
    if (validatedBuyerData) {
      console.log("🔵 useBuyerData - Buyer data updated:", {
        id: validatedBuyerData.id,
        name: validatedBuyerData.name,
        phone: validatedBuyerData.phone,
        cedula: validatedBuyerData.cedula || 'N/A',
        direccion: validatedBuyerData.direccion || 'N/A',
        sugerencia_producto: validatedBuyerData.sugerencia_producto || 'N/A'
      });
    } else {
      console.log("🔵 useBuyerData - No buyer data available");
    }
  }, [validatedBuyerData]);
  
  return { validatedBuyerData, setValidatedBuyerData };
}
