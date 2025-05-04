
import { useState } from "react";
import { toast } from 'sonner';

export function usePayment() {
  const [paymentData, setPaymentData] = useState<any>(null);
  
  const handleProofCheck = (paymentMethod: string, uploadedImage: File | null) => {
    console.log("usePayment: Checking payment proof for method:", paymentMethod);
    
    if (paymentMethod === "transfer" && !uploadedImage) {
      toast.error("Por favor suba un comprobante de pago");
      return false;
    }
    return true;
  }
  
  return { paymentData, setPaymentData, handleProofCheck };
}
