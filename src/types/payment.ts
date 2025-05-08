
export interface PaymentFormData {
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerCedula: string;
  paymentMethod?: "cash" | "transfer";
  paymentProof?: any;
  nota: string;
  direccion: string;
  sugerenciaProducto: string;
  reporteSospechoso: string;
  sellerId?: string;
}
