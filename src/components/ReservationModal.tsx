
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
  DialogClose
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
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import PromotionalImage from '@/components/raffle/PromotionalImage';
import { Organization } from '@/lib/constants/types';

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
  organization?: Organization | null;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedNumbers,
  organization,
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      buyerName: '',
      buyerPhone: '',
      buyerCedula: '',
    },
  });

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
    
    console.log("src/components/ReservationModal.tsx: 📞 Envío de ReservationModal con:", {
      name: data.buyerName,
      phone: formattedPhone,
      cedula: data.buyerCedula,
      selectedNumbers
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
      <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] flex flex-col bg-background dark:bg-gray-900 rounded-xl border-0 shadow-xl">        
        <Card className="bg-background dark:bg-gray-900 border-0 shadow-none">
          <DialogHeader>
            <Card className="bg-[#9b87f5] dark:bg-[#7E69AB] shadow-md border-0">
              <CardHeader className="px-4">
                <DialogTitle className="text-xl text-white font-bold text-center">
                  Apartar númerosXYZ--XYZ---XYZ
                </DialogTitle>
                <DialogClose className="absolute - right-10 center bg-[#3d3d3d] hover:bg-[#1a1a1a] rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-white">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DialogClose>                
              </CardHeader>
            </Card>
          </DialogHeader>
          
          <CardContent className="p-0 mt-4">
            <ScrollArea className="max-h-[50vh] overflow-y-auto px-1 bg-gray-400 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
              <div className="p-4">
                <DialogDescription className="mb-4 font-black">
                  Ingrese los datos de la persona que apartará los números: {selectedNumbers.join(', ')}
                </DialogDescription>
                
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
                    
                    {/* Display promotional image if available */}
                    {organization?.imagen_publicitaria && (
                      <div className="mt-6">
                        <PromotionalImage imageUrl={organization.imagen_publicitaria} />
                      </div>
                    )}
                  </form>
                </Form>
              </div>
            </ScrollArea>
          </CardContent>
          
          <DialogFooter className="flex flex-row justify-between mt-2 pt-2 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 sm:flex-none font-bold uppercase text-gray-800 dark:text-white hover:bg-[#9b87f5] hover:text-white dark:hover:text-gray-800"
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={form.handleSubmit(handleSubmit)} 
              className="flex-1 sm:flex-none bg-[#9b87f5] hover:bg-[#7E69AB] text-white font-bold uppercase"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationModal;
