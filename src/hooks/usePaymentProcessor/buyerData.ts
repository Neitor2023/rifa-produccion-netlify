
import { useState, useEffect } from "react";
import { ValidatedBuyerInfo } from '@/types/participant';

export function useBuyerData({ raffleId, debugMode = false }) {
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

  // These functions are placeholders for the actual implementation
  const validateBuyerInfo = () => {
    console.log("validateBuyerInfo called");
  };
  
  const setBuyerInfo = () => {
    console.log("setBuyerInfo called");
  };
  
  const validateBuyerByCedula = () => {
    console.log("validateBuyerByCedula called");
  };
  
  const validateBuyerByPhone = () => {
    console.log("validateBuyerByPhone called");
  };
  
  return { 
    validatedBuyerData, 
    setValidatedBuyerData,
    validateBuyerInfo,
    setBuyerInfo,
    validateBuyerByCedula,
    validateBuyerByPhone
  };
}
