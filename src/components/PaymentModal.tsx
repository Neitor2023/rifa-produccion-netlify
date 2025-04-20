
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogClose,
} from '@/components/ui/dialog';
import { Form } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import PaymentSummary from './payment/PaymentSummary';
import PaymentFormFields from './payment/PaymentFormFields';
import PaymentMethodFields from './payment/PaymentMethodFields';
import PaymentNotes from './payment/PaymentNotes';
import { PaymentModalHeader } from './payment/PaymentModalHeader';
import { PaymentModalActions } from './payment/PaymentModalActions';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ValidatedBuyerInfo } from '@/types/participant';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  price: number;
  onComplete: (paymentData: PaymentFormData) => void;
  buyerData?: ValidatedBuyerInfo;
  debugMode?: boolean;
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
  debugMode = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Log incoming buyer data
  console.log("🧾 Incoming buyerData to PaymentModal:", buyerData);
  
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      buyerName: buyerData?.name || "",
      buyerPhone: buyerData?.phone || "",
      buyerCedula: buyerData?.cedula || "",
      buyerEmail: "",
      paymentMethod: undefined,
      paymentProof: undefined,
      nota: "",
      direccion: buyerData?.direccion || "",
      sugerenciaProducto: buyerData?.sugerencia_producto || "",
      reporteSospechoso: "",
    },
  });
  
  useEffect(() => {
    if (buyerData) {
      console.log("📦 Updating form with buyer data:", buyerData);
      form.setValue('buyerName', buyerData.name);
      form.setValue('buyerPhone', buyerData.phone);
      if (buyerData.cedula) {
        form.setValue("buyerCedula", buyerData.cedula);
      }
      if (buyerData.direccion) {
        form.setValue("direccion", buyerData.direccion);
      }
      if (buyerData.sugerencia_producto) {
        form.setValue("sugerenciaProducto", buyerData.sugerencia_producto);
      }
    }
  }, [buyerData, form]);

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PaymentModal - ${context}]:`, data);
    }
  };
  
  const onSubmit = (data: PaymentFormData) => {
    setIsSubmitting(true);
    debugLog('Form submit - data', data);
    
    if (data.paymentMethod === "transfer" && !uploadedImage) {
      toast.error("Por favor suba un comprobante de pago");
      debugLog('Validation error', 'Missing payment proof for transfer');
      setIsSubmitting(false);
      return;
    }
    
    if (uploadedImage) {
      data.paymentProof = uploadedImage;
      debugLog('Payment proof attached', {
        name: uploadedImage.name,
        size: uploadedImage.size,
        type: uploadedImage.type
      });
    }
    
    debugLog('Sending payment data to parent component', data);
    onComplete(data);
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
    }
  }, [isOpen, selectedNumbers, price, buyerData]);
useEffect(() => {
  if (buyerData) {
    console.log("🔁 PaymentModal buyerData antes de renderizar:", buyerData?.name, buyerData?.phone, buyerData?.cedula);
  } else {
    console.log("🔁 PaymentModal buyerData no está definido");
  }
}, [buyerData]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] flex flex-col">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <PaymentModalHeader />

        <ScrollArea className="flex-1 overflow-y-auto px-1">
          <Form {...form}>         
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <PaymentSummary 
                selectedNumbers={selectedNumbers}
                price={price}
              />                 
              <div className="space-y-6">
                <PaymentFormFields 
                  form={form}
                  readOnlyData={buyerData}
                  previewUrl={previewUrl}
                />
                <PaymentMethodFields
                  form={form}
                  previewUrl={previewUrl}
                  onFileUpload={handleImageUpload}
                  onFileRemove={handleRemoveImage}
                />
              </div>
            </form>
          </Form>
        </ScrollArea>
        
        <PaymentModalActions 
          isSubmitting={isSubmitting}
          onClose={onClose}
          onSubmit={form.handleSubmit(onSubmit)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
