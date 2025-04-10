
import React, { useState } from 'react';
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
import { LoaderCircle, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  price: number;
  onComplete: (paymentData: PaymentFormData) => void;
}

const paymentFormSchema = z.object({
  buyerName: z.string().min(3, { message: "Nombre debe tener al menos 3 caracteres" }),
  buyerPhone: z.string().min(10, { message: "Teléfono debe tener al menos 10 caracteres" }),
  paymentMethod: z.enum(["cash", "transfer"], { 
    required_error: "Seleccione un método de pago" 
  }),
  paymentProof: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedNumbers,
  price,
  onComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      buyerName: "",
      buyerPhone: "",
      paymentMethod: undefined,
      paymentProof: "",
    },
  });
  
  const onSubmit = (data: PaymentFormData) => {
    setIsSubmitting(true);
    
    // Simulate image upload
    if (data.paymentMethod === "transfer" && !uploadedImage) {
      toast.error("Por favor suba un comprobante de pago");
      setIsSubmitting(false);
      return;
    }
    
    // Add the uploadedImage to the data
    if (uploadedImage) {
      data.paymentProof = uploadedImage;
    }
    
    // Simulate API call
    setTimeout(() => {
      onComplete(data);
      setIsSubmitting(false);
      form.reset();
      setUploadedImage(null);
    }, 1500);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // For demo purposes, just create a dummy URL
    // In a real app, this would upload to Supabase storage
    setUploadedImage(URL.createObjectURL(file));
  };
  
  const totalAmount = selectedNumbers.length * price;
  
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
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <div className="text-sm text-gray-500 mb-1">Números seleccionados:</div>
              <div className="flex flex-wrap gap-1">
                {selectedNumbers.map((number) => (
                  <span key={number} className="bg-rifa-purple text-white px-2 py-1 text-xs rounded-md">
                    {number}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-right font-medium">
                Total: ${totalAmount.toFixed(2)}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="buyerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo" {...field} />
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
                    <Input placeholder="Número de teléfono" {...field} />
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
            
            {form.watch("paymentMethod") === "transfer" && (
              <div className="space-y-2">
                <FormLabel>Comprobante de pago</FormLabel>
                
                {uploadedImage ? (
                  <div className="relative">
                    <img 
                      src={uploadedImage} 
                      alt="Comprobante" 
                      className="w-full h-48 object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setUploadedImage(null)}
                    >
                      Eliminar
                    </Button>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Haga clic para subir o arrastre su comprobante aquí
                    </p>
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                )}
              </div>
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
