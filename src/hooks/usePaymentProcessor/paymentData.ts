
import { useState } from 'react';
import { PaymentFormData } from '@/components/PaymentModal';

export function usePaymentData() {
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null);
  
  const resetPaymentData = () => {
    setPaymentData(null);
  };

  return {
    paymentData,
    setPaymentData,
    resetPaymentData
  };
}
