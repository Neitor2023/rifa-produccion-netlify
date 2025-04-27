
import { PaymentFormData } from '@/components/PaymentModal';

export function validatePaymentData(data: PaymentFormData): string[] {
  const errors: string[] = [];
  
  if (!data.buyerName?.trim()) {
    errors.push('Nombre es requerido');
  }
  
  if (!data.buyerPhone?.trim()) {
    errors.push('Teléfono es requerido');
  }
  
  if (!data.buyerEmail?.trim()) {
    errors.push('Email es requerido');
  }
  
  if (data.paymentMethod === 'transfer' && !data.paymentProof) {
    errors.push('Comprobante de pago es requerido para transferencias');
  }
  
  return errors;
}
