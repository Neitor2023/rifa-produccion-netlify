
export interface PaymentFormData {
  buyerName: string;
  buyerPhone: string;
  buyerCedula?: string;
  buyerEmail?: string;
  direccion?: string;
  paymentMethod?: 'cash' | 'transfer';
  paymentProof?: File | string | null;
  participantId?: string;
  reporteSospechoso?: string;
  nota?: string;
  sugerenciaProducto?: string;
  paymentReceiptUrl?: string;
  sellerId?: string;
  clickedButtonType?: string;
}
