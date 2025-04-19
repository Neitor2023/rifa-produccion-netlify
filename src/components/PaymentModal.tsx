import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Check, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import PaymentSummary from './payment/PaymentSummary';
import PaymentUploadZone from './payment/PaymentUploadZone';
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <PaymentSummary 
                selectedNumbers={selectedNumbers}
                price={price}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-800">Información personal</h3>
                  
                  <FormField
                    control={form.control}
                    name="buyerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nombre completo" 
                            {...field} 
                            readOnly
                            className="bg-gray-50 text-gray-700 font-medium cursor-not-allowed"
                            value={buyerData?.name || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="buyerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Número de teléfono" 
                            {...field} 
                            readOnly
                            className="bg-gray-50 text-gray-700 font-medium cursor-not-allowed"
                            value={buyerData?.phone || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="buyerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="correo@ejemplo.com" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-800">Método de pago</h3>
                  
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selecciona el método</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar método de pago" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Efectivo</SelectItem>
                            <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("paymentMethod") === "transfer" && (
                    <PaymentUploadZone
                      previewUrl={previewUrl}
                      onFileUpload={handleImageUpload}
                      onFileRemove={handleRemoveImage}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground">Comentarios adicionales (opcional)</h3>
                
                <FormField
                  control={form.control}
                  name="nota"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="¿Alguna nota o comentario adicional?" 
                          {...field}
                          className="resize-none"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </ScrollArea>
        
        <DialogFooter className="sticky bottom-0 pt-4 bg-white border-t mt-4">
          <Button
            onClick={onClose}
            className="w-full bg-[#9b87f5] hover:bg-[#7E69AB] text-white font-medium transition-colors"
          >
            Volver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
