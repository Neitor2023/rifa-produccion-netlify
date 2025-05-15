
import { z } from 'zod';

export const paymentFormSchema = z.object({
  buyerName: z.string().min(3, { message: "Nombre debe tener al menos 3 caracteres" }),
  buyerPhone: z.string().min(10, { message: "Teléfono debe tener al menos 10 caracteres" }),
  buyerEmail: z.string().email({ message: "Email inválido" }).optional().or(z.literal('')),
  buyerCedula: z.string().min(5, { message: "Cédula/DNI debe tener al menos 5 caracteres" }),
  paymentMethod: z.enum(["cash", "transfer"], { 
    required_error: "Seleccione un método de pago" 
  }),
  paymentProof: z.any().optional(),
  nota: z.string().optional(),
  direccion: z.string().optional(),
  sugerenciaProducto: z.string().optional(),
  reporteSospechoso: z.string().optional(),
  paymentReceiptUrl: z.string().optional(),
  participantId: z.string().optional(), // Field to store the participant ID
  sellerId: z.string().optional(), // Field to store the seller ID
  clickedButtonType: z.string().optional() // Field to identify which button was clicked
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;
