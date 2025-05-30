import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentModalHeader } from '@/components/payment/PaymentModalHeader';
import PaymentModalContent from "@/components/payment/PaymentModalContent";
import { PaymentModalActions } from '@/components/payment/PaymentModalActions';
import { PaymentFormData, PaymentFormSchema } from '@/schemas/paymentFormSchema';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import { ValidatedBuyerInfo } from '@/types/participant';
import { Organization } from '@/lib/constants/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  price: number;
  onCompletePayment: (data: PaymentFormData) => Promise<{ success: boolean; conflictingNumbers?: string[] } | void>;
  buyerInfo?: ValidatedBuyerInfo | null;
  debugMode?: boolean;
  clickedButton?: string;  
  organization?: Organization | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedNumbers,
  price,
  onCompletePayment,
  buyerInfo,
  debugMode = false,
  clickedButton,
  organization
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { clearSelectionState } = useNumberSelection();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(PaymentFormSchema),
    defaultValues: {
      buyerName: buyerInfo?.name || '',
      buyerPhone: buyerInfo?.phone || '',
      buyerCedula: buyerInfo?.cedula || '',
      buyerEmail: buyerInfo?.email || '',
      direccion: buyerInfo?.direccion || '',
      sugerenciaProducto: buyerInfo?.sugerencia_producto || '',
      paymentMethod: "cash",
      paymentProof: null,
      nota: '',
      reporteSospechoso: '',
      sellerId: '',
      participantId: buyerInfo?.id || '',
      clickedButtonType: '',
      paymentReceiptUrl: '',
    },
    mode: "onChange"
  });

  // Reset form when modal is opened or closed
  useEffect(() => {
    // Reset form when modal is closed
    if (!isOpen) {
      resetForm();
    } 
    // Establecer valores de formulario cuando se abre el modal con información del comprador
    else if (isOpen && clickedButton === "Pagar") {
      resetForm();
    } else if (isOpen && buyerInfo) {
      // For other buttons (like "Pagar Apartados"), keep the existing data
      form.setValue('buyerName', buyerInfo.name || '');
      form.setValue('buyerPhone', buyerInfo.phone || '');
      form.setValue('buyerCedula', buyerInfo.cedula || '');
      form.setValue('buyerEmail', buyerInfo.email || '');
      form.setValue('direccion', buyerInfo.direccion || '');
      form.setValue('sugerenciaProducto', buyerInfo.sugerencia_producto || '');
      
      // CRUCIAL: Asegurar que el participantId se establezca correctamente
      if (buyerInfo.id) {
        form.setValue('participantId', buyerInfo.id);
        console.log(`[PaymentModal.tsx] 💾 participantId establecido en el formulario: ${buyerInfo.id}`);
      }
      
      // Log para depuración
      if (debugMode) {
        console.log("PaymentModal: Cargando datos de comprador existente:", {
          name: buyerInfo.name,
          phone: buyerInfo.phone,
          participantId: buyerInfo.id,
          sugerenciaProducto: buyerInfo.sugerencia_producto
        });
      }
    }
  }, [isOpen, clickedButton, buyerInfo]);

  // VALIDACIÓN CRÍTICA: Verificar datos antes de abrir el modal para "Pagar Apartados"
  useEffect(() => {
    if (isOpen && clickedButton === "Pagar Apartados") {
      console.log('[PaymentModal.tsx] 🔍 Validando datos para "Pagar Apartados":', {
        buyerInfo: buyerInfo ? {
          id: buyerInfo.id,
          name: buyerInfo.name,
          phone: buyerInfo.phone
        } : null,
        participantIdEnFormulario: form.getValues('participantId')
      });
      
      // Si no hay buyerInfo o no tiene ID válido para "Pagar Apartados"
      if (!buyerInfo || !buyerInfo.id) {
        console.error('[PaymentModal.tsx] ❌ Error: Datos de participante faltantes para "Pagar Apartados"');
        toast.error('Error: No se pudieron cargar los datos del participante. Por favor, intente nuevamente.');
        onClose();
        return;
      }
    }
  }, [isOpen, clickedButton, buyerInfo, onClose, form]);
  
  // Función para restablecer el formulario
  const resetForm = () => {
    console.log("🧹 PaymentModal.tsx: Reseteando formulario");
    form.reset({
      buyerName: '',
      buyerPhone: '',
      buyerCedula: '',
      buyerEmail: '',
      direccion: '',
      sugerenciaProducto: '',
      paymentMethod: "cash",
      paymentProof: null,
      nota: '',
      reporteSospechoso: '',
      sellerId: '',
      participantId: '',
      clickedButtonType: '',
      paymentReceiptUrl: '',
    });
    setPreviewUrl(null);
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("paymentProof", file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const onFileRemove = () => {
    form.setValue("paymentProof", null);
    setPreviewUrl(null);
  };

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setIsSubmitting(true);
      
      // VALIDACIÓN CRÍTICA FINAL antes del envío
      if (clickedButton === "Pagar Apartados") {
        const participantId = data.participantId || buyerInfo?.id;
        
        console.log('[PaymentModal.tsx] 🔍 Validación final para "Pagar Apartados":', {
          participantIdFormulario: data.participantId,
          participantIdBuyerInfo: buyerInfo?.id,
          participantIdFinal: participantId
        });
        
        if (!participantId) {
          console.error('[PaymentModal.tsx] ❌ Error: participantId faltante en envío');
          toast.error('Error: No se puede procesar el pago sin identificar el participante.');
          setIsSubmitting(false);
          return;
        }
        
        // Asegurar que el participantId esté en los datos del formulario
        data.participantId = participantId;
      }
      
      // Registrar los datos del formulario para fines de depuración
      if (debugMode) {
        console.log("Datos del formulario a enviar:", {
          ...data,
          participantId: data.participantId
        });
        console.log("Valor del campo sugerenciaProducto:", data.sugerenciaProducto);
      }
      
      // Almacenar el tipo de botón en el que se hizo clic en los datos del formulario
      data.clickedButtonType = clickedButton;
      
      const result = await onCompletePayment(data);
      
      // Si el resultado tiene números conflictivos, el manejo modal lo realizarán los componentes principales.
      // Solo se maneja el caso en el que necesitamos cerrar el modo de pago
      if (!result || (result && result.success)) {
        onClose();
        clearSelectionState();
        resetForm(); // Restablecer formulario después de un envío exitoso
      }
      
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      toast.error("Error al procesar el pago. Por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Este es el controlador que se pasa al título en el que se puede hacer clic.
  const handleHeaderClick = () => {
    if (form.formState.isValid && !isSubmitting) {
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetForm(); // Restablecer formulario cuando se cierra el diálogo
      }
    }}>
      <DialogContent className="bg-white/20 backdrop-blur-md max-w-2xl">
        <Card className="bg-transparent border-0 shadow-none">
        <PaymentModalHeader onClose={() => {
          onClose();
          resetForm(); // Restablecer formulario al cerrarlo mediante el botón de encabezado
        }} onHeaderClick={handleHeaderClick} />
        <PaymentModalContent
          form={form}
          selectedNumbers={selectedNumbers}
          price={price}
          previewUrl={previewUrl}
          buyerData={buyerInfo}
          onFileUpload={onFileUpload}
          onFileRemove={onFileRemove}
          clickedButton={clickedButton}
          organization={organization}
        />
        <PaymentModalActions
          isSubmitting={isSubmitting}
          isFormValid={form.formState.isValid}
          onClose={() => {
            onClose(); 
            resetForm(); // Restablecer el formulario al cerrarlo mediante el botón Cancelar
          }}
          onSubmit={form.handleSubmit(onSubmit)}
        />
      </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
