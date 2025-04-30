
import { useState } from "react";
import { toast } from 'sonner';

export function usePayment() {
  const [paymentData, setPaymentData] = useState<any>(null);
  // ... include further split logic as needed, e.g. upload proof, etc ...
  const handleProofCheck = (paymentMethod: string, uploadedImage: File | null) => {
    if (paymentMethod === "transfer" && !uploadedImage) {
      toast.error("Por favor suba un comprobante de pago");
      return false;
    }
    return true;
  }
  return { paymentData, setPaymentData, handleProofCheck };
}
