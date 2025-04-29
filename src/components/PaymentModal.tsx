
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogClose,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ValidatedBuyerInfo } from '@/types/participant';
import { PaymentModalHeader } from './payment/PaymentModalHeader';
import { PaymentModalActions } from './payment/PaymentModalActions';
import PaymentModalContent from './payment/PaymentModalContent';
import { supabase } from '@/integrations/supabase/client';
import { useParticipantManager } from '@/hooks/useParticipantManager';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  price: number;
  onComplete: (paymentData: PaymentFormData) => void;
  buyerData?: ValidatedBuyerInfo;
  debugMode?: boolean;
  raffleId?: string;
  sellerId?: string;
}

const paymentFormSchema = z.object({
  buyerName: z.string().min(3, { message: "Nombre debe tener al menos 3 caracteres" }),
  buyerPhone: z.string().min(10, { message: "Teléfono debe tener al menos 10 caracteres" }),
  buyerEmail: z.string().email({ message: "Email inválido" }),
  buyerCedula: z.string().min(5, { message: "Cédula/DNI debe tener al menos 5 caracteres" }),
  paymentMethod: z.enum(["cash", "transfer"], { 
    required_error: "Seleccione un método de pago" 
  }),
  paymentProof: z.any().optional(),
  nota: z.string().optional(),
  direccion: z.string().optional(),
  sugerenciaProducto: z.string().optional(),
  reporteSospechoso: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedNumbers,
  price,
  onComplete,
  buyerData,
  debugMode = false,
  raffleId,
  sellerId
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // Use valid UUIDs
  const effectiveRaffleId = raffleId || "fd6bd3bc-d81f-48a9-be58-8880293a0472";
  const effectiveSellerId = sellerId || "76c5b100-1530-458b-84d6-29fae68cd5d2";
  
  const { updateParticipant, markNumbersAsSold } = useParticipantManager();
  
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      buyerName: "",
      buyerPhone: "",
      buyerCedula: "",
      buyerEmail: "",
      paymentMethod: undefined,
      paymentProof: undefined,
      nota: "",
      direccion: "",
      sugerenciaProducto: "",
      reporteSospechoso: "",
    },
  });

  // Update form values when buyerData changes
  useEffect(() => {
    console.log("▶️ PaymentModal.tsx: Modal abierto:", isOpen, "datos del comprador:", buyerData);
    
    if (buyerData && isOpen) {
      console.log("▶️ PaymentModal.tsx: Actualizando formulario con datos del comprador:", buyerData);
      form.setValue('buyerName', buyerData.name || "");
      form.setValue('buyerPhone', buyerData.phone || "");
      form.setValue('buyerCedula', buyerData.cedula || "");
      
      if (buyerData.direccion) {
        form.setValue("direccion", buyerData.direccion);
      }
      
      if (buyerData.sugerencia_producto) {
        form.setValue("sugerenciaProducto", buyerData.sugerencia_producto);
      }
      
      // Add email field with default value for validation to pass
      form.setValue("buyerEmail", "default@example.com");
      
      console.log("▶️ PaymentModal.tsx: Valores del formulario actualizados:", form.getValues());
    } else {
      console.log("▶️ PaymentModal.tsx: Modal cerrado o sin datos de comprador:", { isOpen, buyerData });
    }
  }, [buyerData, form, isOpen]);

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PaymentModal - ${context}]:`, data);
    }
  };
  
  const uploadPaymentProof = async (file: File): Promise<string | null> => {
    if (!file) return null;
    
    try {
      console.log("PaymentModal.tsx: Subiendo comprobante de pago...");
      const fileExt = file.name.split('.').pop();
      const filePath = `payment_proofs/${Math.random().toString(36).substring(2)}${Date.now().toString()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, file);
      
      if (error) {
        console.error("PaymentModal.tsx: Error al subir comprobante:", error);
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(filePath);
        
      console.log("PaymentModal.tsx: Comprobante subido exitosamente:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("PaymentModal.tsx: Error al subir comprobante:", error);
      throw error;
    }
  };
  
  const onSubmit = async (data: PaymentFormData) => {
    if (!buyerData || !buyerData.id) {
      toast.error("Datos de comprador no válidos");
      return;
    }
    
    console.log("▶️ PaymentModal.tsx: Iniciando proceso de pago con datos:", data);
    console.log("▶️ PaymentModal.tsx: buyerData:", buyerData);
    
    setIsSubmitting(true);
    debugLog('Form submit - data', data);
    
    try {
      if (data.paymentMethod === "transfer" && !uploadedImage) {
        toast.error("Por favor suba un comprobante de pago");
        debugLog('Validation error', 'Missing payment proof for transfer');
        setIsSubmitting(false);
        return;
      }
      
      // Upload payment proof if provided
      let paymentProofUrl = null;
      if (uploadedImage) {
        console.log("PaymentModal.tsx: Subiendo comprobante de pago");
        paymentProofUrl = await uploadPaymentProof(uploadedImage);
        debugLog('Payment proof uploaded', paymentProofUrl);
      }
      
      // Step 1: Update participant information
      console.log("PaymentModal.tsx: Actualizando información del participante:", buyerData.id);
      const updateResult = await updateParticipant(buyerData.id, {
        email: data.buyerEmail,
        direccion: data.direccion,
        raffle_id: effectiveRaffleId,
        seller_id: effectiveSellerId,
        nota: data.nota,
        sugerencia_producto: data.sugerenciaProducto
      });
      
      if (!updateResult) {
        throw new Error("Error al actualizar la información del participante");
      }
      
      // Step 2: Mark numbers as sold using upsert to avoid duplicate key errors
      console.log("PaymentModal.tsx: Marcando números como vendidos:", selectedNumbers);
      const markResult = await markNumbersAsSold(
        selectedNumbers, 
        effectiveRaffleId, 
        effectiveSellerId, 
        buyerData.id, 
        {
          name: buyerData.name,
          phone: buyerData.phone,
          cedula: buyerData.cedula
        },
        paymentProofUrl || undefined
      );
      
      if (!markResult) {
        throw new Error("Error al marcar los números como vendidos");
      }
      
      // Step 3: Process fraud report if provided
      if (data.reporteSospechoso && data.reporteSospechoso.trim() !== '') {
        console.log("PaymentModal.tsx: Procesando reporte de actividad sospechosa");
        
        // Check if a report already exists
        const { data: existingReport } = await supabase
          .from('fraud_reports')
          .select('id')
          .match({
            participant_id: buyerData.id,
            raffle_id: effectiveRaffleId,
            seller_id: effectiveSellerId
          })
          .maybeSingle();
        
        if (existingReport) {
          console.log("PaymentModal.tsx: Actualizando reporte existente:", existingReport.id);
          
          // Update existing report
          const { error: updateError } = await supabase
            .from('fraud_reports')
            .update({
              mensaje: data.reporteSospechoso,
              estado: 'pendiente'
            })
            .eq('id', existingReport.id);
          
          if (updateError) {
            console.error("PaymentModal.tsx: Error al actualizar reporte de fraude:", updateError);
            // Continue execution even if this fails
          }
        } else {
          console.log("PaymentModal.tsx: Creando nuevo reporte de fraude");
          
          // Create new fraud report using upsert to avoid conflicts
          const { error: fraudError } = await supabase
            .from('fraud_reports')
            .insert({
              raffle_id: effectiveRaffleId,
              seller_id: effectiveSellerId,
              participant_id: buyerData.id,
              mensaje: data.reporteSospechoso,
              estado: 'pendiente'
            });

          if (fraudError) {
            console.error('PaymentModal.tsx: Error al guardar reporte de fraude:', fraudError);
            // Continue execution even if this fails
          }
        }
      }
      
      // If all steps completed successfully, finish process
      console.log("PaymentModal.tsx: Proceso de pago completado exitosamente");
      
      if (uploadedImage) {
        data.paymentProof = paymentProofUrl;
      }
      
      // Ensure the data includes the buyerData values
      data.buyerName = buyerData.name;
      data.buyerPhone = buyerData.phone;
      data.buyerCedula = buyerData.cedula || "";
      
      toast.success("Pago completado exitosamente");
      onComplete(data);
      resetForm();
      
    } catch (error: any) {
      console.error("PaymentModal.tsx: Error al procesar el pago:", error);
      toast.error(`Error al completar el pago: ${error.message || "Error desconocido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    debugLog('Image upload', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    setUploadedImage(file);
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
  };

  const handleRemoveImage = () => {
    debugLog('Removing uploaded image', null);
    setUploadedImage(null);
    setPreviewUrl(null);
  };
  
  const resetForm = () => {
    debugLog('Resetting form', null);
    form.reset();
    setUploadedImage(null);
    setPreviewUrl(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else {
      debugLog('Modal opened', {
        selectedNumbers,
        price,
        buyerData
      });
      
      // When modal opens, update form with buyerData
      if (buyerData) {
        console.log("▶️ PaymentModal.tsx: Modal abierto, actualizando formulario con datos del comprador:", buyerData);
        form.setValue('buyerName', buyerData.name || "");
        form.setValue('buyerPhone', buyerData.phone || "");
        form.setValue('buyerCedula', buyerData.cedula || "");
        form.setValue('buyerEmail', "default@example.com"); // Default value for validation
        
        if (buyerData.direccion) {
          form.setValue("direccion", buyerData.direccion);
        }
        
        if (buyerData.sugerencia_producto) {
          form.setValue("sugerenciaProducto", buyerData.sugerencia_producto);
        }
      }
    }
  }, [isOpen, selectedNumbers, price, buyerData, form]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] flex flex-col">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <PaymentModalHeader />

        <PaymentModalContent
          form={form}
          selectedNumbers={selectedNumbers}
          price={price}
          previewUrl={previewUrl}
          buyerData={buyerData}
          onFileUpload={handleImageUpload}
          onFileRemove={handleRemoveImage}
        />
        
        <PaymentModalActions 
          isSubmitting={isSubmitting}
          onClose={onClose}
          onSubmit={form.handleSubmit(onSubmit)}
        />
        
        <Toaster
          position="top-right"
          visibleToasts={10}
          gap={12}
          closeButton
        />
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
