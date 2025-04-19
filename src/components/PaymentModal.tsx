import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Form } from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import PaymentSummary from './payment/PaymentSummary';
import PaymentFormFields from './payment/PaymentFormFields';
import PaymentMethodFields from './payment/PaymentMethodFields';
import PaymentNotes from './payment/PaymentNotes';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  price: number;
  onComplete: (paymentData: PaymentFormData) => void;
  buyerData?: {
    name: string;
    phone: string;
  };
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
  
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      buyerName: buyerData?.name || "",
      buyerPhone: buyerData?.phone || "",
      buyerEmail: "",
      buyerCedula: "",
      paymentMethod: undefined,
      paymentProof: undefined,
      nota: "",
      sugerenciaProducto: "",
      reporteSospechoso: "",
    },
  });
  
  useEffect(() => {
    if (buyerData) {
      form.setValue('buyerName', buyerData.name);
      form.setValue('buyerPhone', buyerData.phone);
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
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] flex flex-col">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <DialogHeader className="pt-6">
          <DialogTitle className="text-xl font-bold text-center text-gray-800">
            Finalizar Compra
          </DialogTitle>
          <DialogDescription className="text-center">
            Completa tu información para reservar tus números
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <PaymentSummary 
                selectedNumbers={selectedNumbers}
                price={price}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PaymentFormFields 
                  form={form}
                  readOnlyData={buyerData}
                />
                
                <PaymentMethodFields
                  form={form}
                  previewUrl={previewUrl}
                  onFileUpload={handleImageUpload}
                  onFileRemove={handleRemoveImage}
                />
              </div>

              <PaymentNotes form={form} />
            </form>
          </Form>
        </ScrollArea>
        
        <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none bg-[#9b87f5] hover:bg-[#7E69AB]"
          >
            {isSubmitting ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Completar Pago
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
