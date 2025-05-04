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
import { NumberSelectionProvider } from '@/contexts/NumberSelectionContext';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  price: number;
  onComplete: (paymentData: PaymentFormData) => void;
  buyerData?: ValidatedBuyerInfo;
  debugMode?: boolean;
  clickedButton?: string;
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
  clickedButton
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { buyerInfo } = useBuyerInfo();
  
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
    console.log("PaymentModal.tsx:71 - Modal is open:", isOpen, "buyerData:", buyerData);
    
    if (buyerData && isOpen) {
      console.log("PaymentModal.tsx:74 - Modal is open, updating form with buyer data:", buyerData);
      form.setValue('buyerName', buyerData.name || "");
      form.setValue('buyerPhone', buyerData.phone || "");
      form.setValue('buyerCedula', buyerData.cedula || "");
      form.setValue('buyerEmail', buyerData.email || "");
      
      if (buyerData.direccion) {
        form.setValue("direccion", buyerData.direccion);
      }
      
      if (buyerData.sugerencia_producto) {
        form.setValue("sugerenciaProducto", buyerData.sugerencia_producto);
      }
      
      console.log("PaymentModal.tsx:89 - Form values after update:", form.getValues());
    } else {
      console.log("PaymentModal.tsx:91 - Either modal is closed or no buyerData:", { isOpen, buyerData });
    }
  }, [buyerData, form, isOpen]);

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PaymentModal - ${context}]:`, data);
    }
  };
  
  const onSubmit = () => {
    // Add the requested console.log for debugging
    console.log('PaymentModal.tsx:101 - Botón Completar pago pulsado');
    console.log('PaymentModal.tsx:102 - Email a guardar:', form.getValues().buyerEmail);
    
    // Get the current form values
    const data = form.getValues();
    
    setIsSubmitting(true);
    debugLog('Form submit - data', data);
    
    // Check buyerData and complete with buyerInfo if needed
    let completeData = { ...data };
    
    if (buyerData) {
      const { name, phone, cedula, email } = buyerData;
      
      if (!name || !phone || !cedula || !email) {
        console.log('PaymentModal.tsx:115 - buyerData incompleta (name, phone, cedula, email), intentando completar con buyerInfo:', 
          buyerInfo, 'buyerData:', buyerData);
        
        if (buyerInfo) {
          // Create an updated version of buyerData with missing fields from buyerInfo
          const updatedFields = {
            buyerName: completeData.buyerName || buyerInfo.name,
            buyerPhone: completeData.buyerPhone || buyerInfo.phone,
            buyerCedula: completeData.buyerCedula || buyerInfo.cedula || "",
            buyerEmail: completeData.buyerEmail || buyerInfo.email || "",
          };
          
          completeData = { ...completeData, ...updatedFields };
          
          console.log('PaymentModal.tsx:128 - buyerData completada (name, phone, cedula, email):', 
            updatedFields, 'formulario actualizado:', completeData);
          console.log('PaymentModal.tsx:130 - Email final a guardar:', completeData.buyerEmail);
        } else {
          console.log('PaymentModal.tsx:131 - buyerInfo también está vacío.');
        }
      } else {
        console.log('PaymentModal.tsx:134 - buyerData (name, phone, cedula, email) está completa:', buyerData);
        console.log('PaymentModal.tsx:135 - Email completo a guardar:', data.buyerEmail);
      }
    } else {
      console.log('PaymentModal.tsx:137 - buyerData es null o undefined.');
    }
    
    if (data.paymentMethod === "transfer" && !uploadedImage) {
      toast.error("Por favor suba un comprobante de pago");
      debugLog('Validation error', 'Missing payment proof for transfer');
      setIsSubmitting(false);
      return;
    }
    
    if (uploadedImage) {
      completeData.paymentProof = uploadedImage;
      debugLog('Payment proof attached', {
        name: uploadedImage.name,
        size: uploadedImage.size,
        type: uploadedImage.type
      });
    }
    
    debugLog('Sending payment data to parent component', completeData);
    console.log("PaymentModal.tsx:156 - Submitting payment with data:", {
      buyerName: completeData.buyerName,
      buyerPhone: completeData.buyerPhone,
      buyerCedula: completeData.buyerCedula,
      buyerEmail: completeData.buyerEmail,
      paymentMethod: completeData.paymentMethod
    });
    
    onComplete(completeData);
    setIsSubmitting(false);
    resetForm();
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
        console.log("PaymentModal.tsx:204 - Modal PaymentModal abierto, actualizando formulario con buyer data:", buyerData);
        form.setValue('buyerName', buyerData.name || "");
        form.setValue('buyerPhone', buyerData.phone || "");
        form.setValue('buyerCedula', buyerData.cedula || "");
        form.setValue('buyerEmail', buyerData.email || "");
        console.log("PaymentModal.tsx:209 - Email valor establecido:", buyerData.email || "");
        
        if (buyerData.direccion) {
          form.setValue("direccion", buyerData.direccion);
        }
        
        if (buyerData.sugerencia_producto) {
          form.setValue("sugerenciaProducto", buyerData.sugerencia_producto);
        }
        
        console.log("PaymentModal.tsx:218 - Form values after modal open:", form.getValues());
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
          clickedButton={clickedButton}
        />
        
        <PaymentModalActions 
          isSubmitting={isSubmitting}
          onClose={onClose}
          onSubmit={onSubmit}
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
