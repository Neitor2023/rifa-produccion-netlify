
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
import { supabase } from '@/integrations/supabase/client';

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
    },
    mode: "onChange"
  });

  // Reset form when modal is opened or closed
  useEffect(() => {
    console.log('[src/components/PaymentModal.tsx] useEffect disparado:', { 
      isOpen, 
      clickedButton, 
      buyerInfoPresent: !!buyerInfo,
      buyerInfoId: buyerInfo?.id,
      buyerInfoName: buyerInfo?.name,
      buyerInfoEmail: buyerInfo?.email
    });

    // Reset form when modal is closed
    if (!isOpen) {
      console.log('[src/components/PaymentModal.tsx] Modal cerrado, reseteando formulario');
      resetForm();
    } 
    // Establecer valores de formulario cuando se abre el modal con información del comprador
    else if (isOpen && clickedButton === "Pagar") {
      console.log('[src/components/PaymentModal.tsx] Reseteando formulario para "Pagar" (nuevo comprador)');
      resetForm();
    } else if (isOpen && buyerInfo) {
      // Obtener datos completos del participante, incluyendo email
      fetchCompleteParticipantData(buyerInfo.id);
    }
  }, [isOpen, clickedButton, buyerInfo]);

  // Función para obtener datos completos del participante desde la base de datos
  const fetchCompleteParticipantData = async (participantId?: string) => {
    if (!participantId) {
      console.warn('[src/components/PaymentModal.tsx] No se proporcionó ID de participante para obtener datos completos');
      return;
    }

    try {
      console.log('[src/components/PaymentModal.tsx] Obteniendo datos completos del participante:', participantId);
      
      const { data: participantData, error } = await supabase
        .from('participants')
        .select('*')
        .eq('id', participantId)
        .single();

      if (error) {
        console.error('[src/components/PaymentModal.tsx] Error al obtener datos del participante:', participantId, 'Error:', error);
        // Usar datos básicos de buyerInfo como fallback
        loadBasicBuyerInfo();
        return;
      }

      if (participantData) {
        console.log('[src/components/PaymentModal.tsx] Datos completos del participante obtenidos exitosamente:', participantData.name, 'Email:', participantData.email, 'ID:', participantData.id);
        
        // Cargar TODOS los datos del participante, priorizando el email
        form.setValue('buyerName', participantData.name || '');
        form.setValue('buyerPhone', participantData.phone || '');
        form.setValue('buyerCedula', participantData.cedula || '');
        
        // PRIORIDAD CRÍTICA: Email del participante
        const participantEmail = participantData.email || '';
        form.setValue('buyerEmail', participantEmail);
        console.log('[src/components/PaymentModal.tsx] Email del participante cargado correctamente:', participantEmail, 'para participante:', participantData.name);
        
        form.setValue('direccion', participantData.direccion || '');
        form.setValue('sugerenciaProducto', participantData.sugerencia_producto || '');
        
        // Establecer participantId
        form.setValue('participantId', participantData.id);
        console.log('[src/components/PaymentModal.tsx] participantId establecido en formulario:', participantData.id, 'para participante:', participantData.name);
        
        if (debugMode) {
          console.log("[src/components/PaymentModal.tsx] Datos completos cargados:", {
            name: participantData.name,
            phone: participantData.phone,
            email: participantData.email,
            cedula: participantData.cedula,
            participantId: participantData.id,
            direccion: participantData.direccion,
            sugerenciaProducto: participantData.sugerencia_producto
          });
        }
      }
    } catch (err) {
      console.error('[src/components/PaymentModal.tsx] Error al obtener datos completos del participante:', participantId, 'Error:', err);
      // Usar datos básicos como fallback
      loadBasicBuyerInfo();
    }
  };

  // Función de fallback para cargar datos básicos
  const loadBasicBuyerInfo = () => {
    if (!buyerInfo) return;
    
    console.log('[src/components/PaymentModal.tsx] Cargando datos básicos del participante (fallback):', buyerInfo.name, 'Email:', buyerInfo.email || 'Sin email');
    
    form.setValue('buyerName', buyerInfo.name || '');
    form.setValue('buyerPhone', buyerInfo.phone || '');
    form.setValue('buyerCedula', buyerInfo.cedula || '');
    form.setValue('buyerEmail', buyerInfo.email || '');
    form.setValue('direccion', buyerInfo.direccion || '');
    form.setValue('sugerenciaProducto', buyerInfo.sugerencia_producto || '');
    
    if (buyerInfo.id) {
      form.setValue('participantId', buyerInfo.id);
      console.log('[src/components/PaymentModal.tsx] participantId establecido (fallback):', buyerInfo.id, 'para participante:', buyerInfo.name);
    }
  };

  // VALIDACIÓN CRÍTICA: Verificar datos antes de abrir el modal para "Pagar Apartados"
  useEffect(() => {
    if (isOpen && clickedButton === "Pagar Apartados") {
      console.log('[src/components/PaymentModal.tsx] Validando datos para "Pagar Apartados":', {
        buyerInfo: buyerInfo ? {
          id: buyerInfo.id,
          name: buyerInfo.name,
          phone: buyerInfo.phone,
          email: buyerInfo.email || 'Sin email'
        } : null,
        participantIdEnFormulario: form.getValues('participantId')
      });
      
      // Si no hay buyerInfo o no tiene ID válido para "Pagar Apartados"
      if (!buyerInfo || !buyerInfo.id) {
        console.error('[src/components/PaymentModal.tsx] Error: Datos de participante faltantes para "Pagar Apartados"');
        toast.error('Error: No se pudieron cargar los datos del participante. Por favor, intente nuevamente.');
        onClose();
        return;
      }
    }
  }, [isOpen, clickedButton, buyerInfo, onClose, form]);
  
  // Función para restablecer el formulario
  const resetForm = () => {
    console.log("[src/components/PaymentModal.tsx] Reseteando formulario completamente");
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
    console.log("[src/components/PaymentModal.tsx] Formulario completamente reseteado");
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('[src/components/PaymentModal.tsx] Archivo cargado:', file.name, 'para participante:', form.getValues('buyerName'));
      form.setValue("paymentProof", file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const onFileRemove = () => {
    console.log('[src/components/PaymentModal.tsx] Removiendo archivo de comprobante para participante:', form.getValues('buyerName'));
    form.setValue("paymentProof", null);
    setPreviewUrl(null);
  };

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setIsSubmitting(true);
      
      console.log('[src/components/PaymentModal.tsx] Iniciando envío de formulario para:', clickedButton, 'Participante:', data.buyerName, 'Email:', data.buyerEmail);
      console.log('[src/components/PaymentModal.tsx] Datos del formulario completos:', {
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        buyerEmail: data.buyerEmail,
        buyerCedula: data.buyerCedula,
        participantId: data.participantId,
        paymentMethod: data.paymentMethod,
        hasPaymentProof: !!data.paymentProof
      });
      
      // VALIDACIÓN CRÍTICA FINAL antes del envío
      if (clickedButton === "Pagar Apartados") {
        const participantId = data.participantId || buyerInfo?.id;
        
        console.log('[src/components/PaymentModal.tsx] Validación final para "Pagar Apartados":', {
          participantIdFormulario: data.participantId,
          participantIdBuyerInfo: buyerInfo?.id,
          participantIdFinal: participantId,
          participantName: data.buyerName,
          participantEmail: data.buyerEmail
        });
        
        if (!participantId) {
          console.error('[src/components/PaymentModal.tsx] Error: participantId faltante en envío para participante:', data.buyerName);
          toast.error('Error: No se puede procesar el pago sin identificar el participante.');
          setIsSubmitting(false);
          return;
        }
        
        // Asegurar que el participantId esté en los datos del formulario
        data.participantId = participantId;
      }
      
      // Registrar los datos del formulario para fines de depuración
      if (debugMode) {
        console.log("[src/components/PaymentModal.tsx] Datos finales a enviar:", {
          ...data,
          participantId: data.participantId
        });
        console.log("[src/components/PaymentModal.tsx] Email verificado antes de envío:", data.buyerEmail);
      }
      
      // Almacenar el tipo de botón en el que se hizo clic en los datos del formulario
      data.clickedButtonType = clickedButton;
      
      console.log('[src/components/PaymentModal.tsx] Enviando datos de pago para participante:', data.buyerName, 'Email:', data.buyerEmail);
      const result = await onCompletePayment(data);
      
      // Si el resultado tiene números conflictivos, el manejo modal lo realizarán los componentes principales.
      // Solo se maneja el caso en el que necesitamos cerrar el modo de pago
      if (!result || (result && result.success)) {
        console.log('[src/components/PaymentModal.tsx] Pago procesado exitosamente para participante:', data.buyerName, 'cerrando modal');
        onClose();
        clearSelectionState();
        resetForm(); // Restablecer formulario después de un envío exitoso
      } else {
        console.log('[src/components/PaymentModal.tsx] Pago no exitoso para participante:', data.buyerName, 'manteniendo modal abierto');
      }
      
    } catch (error) {
      console.error("[src/components/PaymentModal.tsx] Error al procesar el pago para participante:", form.getValues('buyerName'), "Error:", error);
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
        console.log('[src/components/PaymentModal.tsx] Cerrando modal y reseteando formulario para participante:', form.getValues('buyerName'));
        onClose();
        resetForm(); // Restablecer formulario cuando se cierra el diálogo
      }
    }}>
      <DialogContent className="bg-white/20 backdrop-blur-md max-w-2xl">
        <Card className="bg-transparent border-0 shadow-none">
        <PaymentModalHeader onClose={() => {
          console.log('[src/components/PaymentModal.tsx] Cerrando modal desde header y reseteando formulario para participante:', form.getValues('buyerName'));
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
            console.log('[src/components/PaymentModal.tsx] Cerrando modal desde acciones y reseteando formulario para participante:', form.getValues('buyerName'));
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
