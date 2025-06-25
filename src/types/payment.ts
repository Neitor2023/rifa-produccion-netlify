
export interface PaymentFormData {
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  buyerCedula: string;
  paymentMethod?: "cash" | "transfer";
  paymentProof?: any;
  nota?: string;
  direccion?: string;
  sugerenciaProducto?: string;
  reporteSospechoso?: string;
  sellerId?: string;
  paymentReceiptUrl?: string;
  participantId?: string;
  clickedButtonType?: string;
  selectedBankId?: string; // Added field for bank selection
}
