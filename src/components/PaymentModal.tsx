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
  rafflePrice: number;
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
  rafflePrice,
  onCompletePayment,
  buyerInfo,
  debugMode = false,
  clickedButton,
  organization
}) => {
  console.log('[PaymentModal.tsx] 🔍 CRÍTICO: Modal renderizado:', {
    isOpen,
    selectedNumbersCount: selectedNumbers?.length || 0,
    hasOnCompletePayment: !!onCompletePayment,
    clickedButton,
    hasOrganization: !!organization
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string | undefined>();
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
      selectedBankId: '',
    },
    mode: "onChange"
  });

  // 🧹 LIMPIEZA ESPECÍFICA PARA "PAGAR DIRECTO" - Nueva funcionalidad solicitada
  useEffect(() => {
    if (isOpen && clickedButton === 'Pagar') {
      console.log("[PaymentModal.tsx] 🧹 CRÍTICO: Limpiando inputs porque se pulsó 'Pagar Directo'");
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
        selectedBankId: '',
      });
      
      // También limpiar estados locales del modal
      setPreviewUrl(null);
      setSelectedBankId(undefined);
      
      console.log("[PaymentModal.tsx] ✅ Inputs completamente limpiados para 'Pagar Directo'");
    }
  }, [isOpen, clickedButton, form]);

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
    else if (isOpen && clickedButton === "Pagar Apartados") {
      // Solo cargar datos del comprador para "Pagar Apartados" - NO para "Pagar Directo"
      console.log('[src/components/PaymentModal.tsx] Cargando datos del comprador para "Pagar Apartados"');
      if (buyerInfo) {
        fetchCompleteParticipantData(buyerInfo.id);
      }
    }
    // Para "Pagar Directo" NO cargar datos del comprador - la limpieza se maneja en el useEffect específico arriba
  }, [isOpen, clickedButton, buyerInfo]);

  // useEffect crítico para sincronizar selectedBankId con el form y disparar revalidación
  useEffect(() => {
    if (selectedBankId) {
      console.log('[PaymentModal.tsx] Banco seleccionado:', selectedBankId);
      form.setValue('selectedBankId', selectedBankId);
      // Disparar revalidación del formulario
      form.trigger('selectedBankId');
    } else {
      form.setValue('selectedBankId', '');
      form.trigger('selectedBankId');
    }
  }, [selectedBankId, form]);

  // Función personalizada para manejar la selección de banco
  const handleBankSelect = (bankId: string) => {
    console.log('[PaymentModal.tsx] handleBankSelect llamado con:', bankId);
    console.log('[PaymentModal.tsx] Guardando transferencia con banco:', bankId);
    setSelectedBankId(bankId);
  };
  
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
      selectedBankId: '',
    });
    setPreviewUrl(null);
    setSelectedBankId(undefined);
    console.log("[src/components/PaymentModal.tsx] Formulario completamente reseteado");
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('[PaymentModal.tsx] 📤 Comprobante recibido:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        participante: form.getValues('buyerName'),
        bancoSeleccionado: selectedBankId
      });
      
      form.setValue("paymentProof", file);
      // Disparar revalidación después de establecer el archivo
      form.trigger('paymentProof');
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      console.log('[PaymentModal.tsx]📎 PaymentProof establecido en formulario para participante:', form.getValues('buyerName'));
      console.log('[PaymentModal.tsx] 🏦 Con banco seleccionado:', selectedBankId);
    }
  };

  const onFileRemove = () => {
    console.log('[PaymentModal.tsx] 🗑️ Removiendo archivo de comprobante para participante:', form.getValues('buyerName'));
    form.setValue("paymentProof", null);
    form.trigger('paymentProof');
    setPreviewUrl(null);
  };

  const onSubmit = async (data: PaymentFormData) => {
    console.log('[PaymentModal.tsx] 🚨 CRÍTICO: onSubmit iniciado');
    console.log('[PaymentModal.tsx] 📋 Datos del formulario:', {
      buyerName: data.buyerName,
      paymentMethod: data.paymentMethod,
      hasPaymentProof: !!data.paymentProof,
      participantId: data.participantId,
      selectedBankId: data.selectedBankId,
      clickedButton
    });

    // IMPORTANTE: Asegurar que bank_id se incluya en los datos
    if (data.paymentMethod === 'transfer' && selectedBankId) {
      console.log('[PaymentModal.tsx] Guardando transferencia con banco:', selectedBankId);
      data.selectedBankId = selectedBankId;
    }

    if (!onCompletePayment) {
      console.error('[PaymentModal.tsx] ❌ CRÍTICO: onCompletePayment es null/undefined en onSubmit');
      return;
    }

    try {
      console.log('[PaymentModal.tsx] 📤 EJECUTANDO: onCompletePayment desde onSubmit');
      const result = await onCompletePayment(data);
      console.log('[PaymentModal.tsx] 📨 RESULTADO de onCompletePayment en onSubmit:', result);

      if (result && !result.success && result.conflictingNumbers?.length) {
        console.log('[PaymentModal.tsx] ⚠️ Conflicto detectado en onSubmit:', result.conflictingNumbers);
        return;
      }

      // 🧹 LIMPIEZA FINAL DESPUÉS DEL AUTO GUARDADO EXITOSO PARA "PAGAR DIRECTO"
      if (clickedButton === 'Pagar' && (!result || (result && typeof result === 'object' && 'success' in result && result.success))) {
        console.log('[PaymentModal.tsx] 🧹 LIMPIEZA FINAL: Ejecutando reset completo después del auto guardado para "Pagar Directo"');
        
        // Limpiar completamente el formulario
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
          selectedBankId: '',
        });
        
        // Limpiar estados locales
        setPreviewUrl(null);
        setSelectedBankId(undefined);
        
        console.log('[PaymentModal.tsx] ✅ Inputs completamente limpiados después del auto guardado para "Pagar Directo"');
      }

    } catch (error) {
      console.error('[PaymentModal.tsx] ❌ ERROR en onSubmit:', error);
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
        console.log('[PaymentModal.tsx] 🔐 Cerrando modal y reseteando formulario para participante:', form.getValues('buyerName'));
        onClose();
        resetForm(); // Restablecer formulario cuando se cierra el diálogo
      }
    }}>
      <DialogContent className="bg-white/20 backdrop-blur-md max-w-2xl">
        <Card className="bg-transparent border-0 shadow-none">
        <PaymentModalHeader onClose={() => {
          console.log('[PaymentModal.tsx] 🔐 Cerrando modal desde header y reseteando formulario para participante:', form.getValues('buyerName'));
          onClose();
          resetForm(); // Restablecer formulario al cerrarlo mediante el botón de encabezado
        }} onHeaderClick={handleHeaderClick} />
        <PaymentModalContent
          form={form}
          selectedNumbers={selectedNumbers}
          rafflePrice={rafflePrice}
          previewUrl={previewUrl}
          buyerData={buyerInfo}
          onFileUpload={onFileUpload}
          onFileRemove={onFileRemove}
          clickedButton={clickedButton}
          organization={organization}
          selectedBankId={selectedBankId}
          onBankSelect={handleBankSelect}
        />
        <PaymentModalActions
          isSubmitting={isSubmitting}
          isFormValid={form.formState.isValid}
          onClose={() => {
            console.log('[PaymentModal.tsx] 🔐 Cerrando modal desde acciones y reseteando formulario para participante:', form.getValues('buyerName'));
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
