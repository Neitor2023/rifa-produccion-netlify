import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
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
import { LoaderCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import PaymentSummary from './payment/PaymentSummary';
import PaymentUploadZone from './payment/PaymentUploadZone';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  price: number;
  onComplete: (paymentData: PaymentFormData) => void;
  buyerData?: {
    name: string;
    phone: string;
  }
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
  buyerData
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
  
  const onSubmit = (data: PaymentFormData) => {
    setIsSubmitting(true);
    
    if (data.paymentMethod === "transfer" && !uploadedImage) {
      toast.error("Por favor suba un comprobante de pago");
      setIsSubmitting(false);
      return;
    }
    
    if (uploadedImage) {
      data.paymentProof = uploadedImage;
    }
    
    onComplete(data);
    setIsSubmitting(false);
    resetForm();
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedImage(file);
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setPreviewUrl(null);
  };
  
  const resetForm = () => {
    form.reset();
    setUploadedImage(null);
    setPreviewUrl(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-gray-800">
            Finalizar Compra
          </DialogTitle>
          <DialogDescription className="text-center">
            Completa tu información para reservar tus números
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PaymentSummary 
              selectedNumbers={selectedNumbers}
              price={price}
            />
            
            <div className="space-y-4">
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
                        disabled={!!buyerData}
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
                        disabled={!!buyerData}
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
              
              <FormField
                control={form.control}
                name="buyerCedula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cédula/DNI</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Número de identificación" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de pago</FormLabel>
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
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground">¿Nos ayudas con una opinión rápida?</h3>
              
              <FormField
                control={form.control}
                name="nota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota personal</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Alguna nota o comentario adicional..." 
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sugerenciaProducto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Qué producto te gustaría ver en la próxima rifa?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tu sugerencia nos ayuda a mejorar..." 
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reporteSospechoso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Observaste algo sospechoso?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ayúdanos a mantener un sistema seguro. Tu reporte es confidencial." 
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            {form.watch("paymentMethod") === "transfer" && (
              <PaymentUploadZone
                previewUrl={previewUrl}
                onFileUpload={handleImageUpload}
                onFileRemove={handleRemoveImage}
              />
            )}
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="mt-2 w-full sm:w-auto sm:mt-0"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              
              <Button 
                type="submit" 
                className="bg-rifa-purple hover:bg-rifa-darkPurple mt-2 w-full sm:w-auto sm:mt-0"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Completar compra
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
