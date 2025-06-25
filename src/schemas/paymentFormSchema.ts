
import { z } from 'zod';

// Define the schema for payment form validation
export const PaymentFormSchema = z.object({
  buyerName: z.string().min(1, { message: "Nombre es requerido" }),
  buyerPhone: z.string().min(1, { message: "Teléfono es requerido" }),
  buyerCedula: z.string().min(1, { message: "Cédula es requerida" }),
  buyerEmail: z.string().email({ message: "Correo electrónico no válido" }).optional().or(z.literal('')),
  direccion: z.string().min(1, { message: "Dirección es requerida" }).optional().or(z.literal('')),
  sugerenciaProducto: z.string().optional().or(z.literal('')),
  paymentMethod: z.enum(["cash", "transfer"], {
    required_error: "Seleccione un método de pago",
  }),
  paymentProof: z.any().optional(), // File object or string URL
  nota: z.string().optional().or(z.literal('')),
  reporteSospechoso: z.string().optional().or(z.literal('')),
  sellerId: z.string().optional(),
  participantId: z.string().optional(),
  clickedButtonType: z.string().optional(),
  paymentReceiptUrl: z.string().optional(),
  selectedBankId: z.string().optional(),
}).refine((data) => {
  // If payment method is transfer, selectedBankId is required
  if (data.paymentMethod === "transfer") {
    return data.selectedBankId && data.selectedBankId.trim() !== "";
  }
  return true;
}, {
  message: "Debe seleccionar el banco donde realizó la transferencia",
  path: ["selectedBankId"],
});

// Export the interface based on the schema
export type PaymentFormData = z.infer<typeof PaymentFormSchema>;
