
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const formSchema = z.object({
  buyerName: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  buyerPhone: z.string().min(7, { message: "El teléfono debe tener al menos 7 dígitos" }),
  buyerCedula: z.string().min(5, { message: "La cédula debe tener al menos 5 caracteres" }),
});

type FormData = z.infer<typeof formSchema>;

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { buyerName: string; buyerPhone: string; buyerCedula: string }) => void;
  selectedNumbers: string[];
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedNumbers,
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      buyerName: '',
      buyerPhone: '',
      buyerCedula: '',
    },
  });

  const formatPhoneNumber = (phone: string): string => {
    let formattedPhone = phone.trim();
    
    // Remove Ecuador's prefix if it starts with +5930
    if (formattedPhone.startsWith('+5930')) {
      formattedPhone = '+593' + formattedPhone.substring(5);
    }
    // If it starts with 0, remove it and add +593
    else if (formattedPhone.startsWith('0')) {
      formattedPhone = '+593' + formattedPhone.substring(1);
    }
    // If it doesn't have any prefix, add +593
    else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+593' + formattedPhone;
    }
    
    console.log("🔄 Formatted phone:", formattedPhone, "from original:", phone);
    return formattedPhone;
  };

  const handleSubmit = (data: FormData) => {
    if (selectedNumbers.length === 0) {
      toast.error('Debe seleccionar al menos un número para apartar');
      return;
    }
    
    // Validate data has values before calling onConfirm
    if (!data.buyerName || !data.buyerPhone || !data.buyerCedula) {
      toast.error('Nombre, teléfono y cédula son obligatorios');
      return;
    }
    
    // Format phone number for Ecuador
    const formattedPhone = formatPhoneNumber(data.buyerPhone);
    
    console.log("📞 ReservationModal submitting with:", {
      name: data.buyerName,
      phone: formattedPhone,
      cedula: data.buyerCedula
    });
    
    onConfirm({
      buyerName: data.buyerName,
      buyerPhone: formattedPhone,
      buyerCedula: data.buyerCedula
    });
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Apartar números</DialogTitle>
          <DialogDescription>
            Ingrese los datos de la persona que apartará los números: {selectedNumbers.join(', ')}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="buyerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del comprador" {...field} />
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
                      type="tel"
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
                      placeholder="Número de cédula o documento" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white">
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationModal;
