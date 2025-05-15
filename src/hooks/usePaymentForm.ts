import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PaymentFormSchema, PaymentFormData } from '@/schemas/paymentFormSchema';
import { ValidatedBuyerInfo } from '@/types/participant';
import { toast } from 'sonner';

interface UsePaymentFormProps {
  buyerData?: ValidatedBuyerInfo;
  onComplete: (data: PaymentFormData) => void;
  isOpen: boolean;
  debugMode?: boolean;
  clickedButton?: string;
}

export const usePaymentForm = ({
  buyerData,
  onComplete,
  isOpen,
  debugMode = false,
  clickedButton
}: UsePaymentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(PaymentFormSchema),
    defaultValues: {
      buyerName: "",
      buyerPhone: "",
      buyerCedula: "",
      buyerEmail: "",
      paymentMethod: undefined,
      paymentProof: undefined,
      nota: "",
      direccion: "",
      sugerenciaProducto: "",
      reporteSospechoso: "",
    },
    mode: "onChange" // Validar el cambio para obtener mejores comentarios de los usuarios
  });

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PaymentModal - ${context}]:`, data);
    }
  };
  
  // Actualizar los valores del formulario cuando cambian los datos del comprador
  useEffect(() => {
    debugLog("Modal is open", { isOpen, buyerData });
    
    if (buyerData && isOpen) {
      debugLog("Updating form with buyer data", buyerData);
      form.setValue('buyerName', buyerData.name || "");
      form.setValue('buyerPhone', buyerData.phone || "");
      form.setValue('buyerCedula', buyerData.cedula || "");
      form.setValue('buyerEmail', buyerData.email || "");
      
      if (buyerData.direccion) {
        form.setValue("direccion", buyerData.direccion);
      }
      
      if (buyerData.sugerencia_producto) {
        form.setValue("sugerenciaProducto", buyerData.sugerencia_producto);
      }
      
      debugLog("Form values after update", form.getValues());
    }
  }, [buyerData, form, isOpen]);

  // Restablecer formulario e imagen cuando se abre o se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else {
      debugLog('Modal opened', { buyerData, clickedButton });
      
      // Imagen clara al abrir el modal con el botón "Pagar"
      if (clickedButton === "Pagar") {
        console.log("PaymentModal - Modal abierto con el botón Pagar, borrando la imagen anterior");
        setUploadedImage(null);
        setPreviewUrl(null);
      }
      
      // Actualizar el formulario con los datos del comprador cuando se abre el modal
      if (buyerData) {
        debugLog("Modal opened, updating form with buyer data", buyerData);
        form.setValue('buyerName', buyerData.name || "");
        form.setValue('buyerPhone', buyerData.phone || "");
        form.setValue('buyerCedula', buyerData.cedula || "");
        form.setValue('buyerEmail', buyerData.email || "");
        
        if (buyerData.direccion) {
          form.setValue("direccion", buyerData.direccion);
        }
        
        if (buyerData.sugerencia_producto) {
          form.setValue("sugerenciaProducto", buyerData.sugerencia_producto);
        }
      }
    }
  }, [isOpen, buyerData, form, clickedButton]);
  
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

  const handleSubmit = async () => {
    console.log('PaymentModal - Botón Completar pago pulsado');
    console.log('PaymentModal - Valor actual del comprobante de pago:', uploadedImage ? {
      name: uploadedImage.name,
      size: uploadedImage.size,
      type: uploadedImage.type
    } : 'No hay imagen cargada');
    
    // Obtener los valores del formulario actual
    const data = form.getValues();
    
    setIsSubmitting(true);
    debugLog('Form submit - data', data);
    
    // Validar los campos obligatorios según el contexto del botón
    const requiredFields = ['buyerName', 'buyerPhone', 'buyerCedula', 'paymentMethod'];
    
    // Agregar campos según el contexto del botón
    if (clickedButton === 'Pagar') {
      // Para "Pagar Directo" necesitamos todos los campos
      requiredFields.push('buyerEmail', 'direccion');
    } else if (clickedButton === 'Pagar Apartados') {
      // Para "Pagar Apartados" necesitamos correo electrónico y dirección.
      requiredFields.push('buyerEmail', 'direccion');
    }
    
    // Verifique todos los campos obligatorios
    const missingFields = requiredFields.filter(field => 
      !data[field as keyof PaymentFormData] || 
      String(data[field as keyof PaymentFormData]).trim() === ''
    );
    
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => {
        switch(field) {
          case 'buyerName': return 'Nombre';
          case 'buyerPhone': return 'Teléfono';
          case 'buyerCedula': return 'Cédula';
          case 'buyerEmail': return 'Email';
          case 'direccion': return 'Dirección';
          case 'paymentMethod': return 'Método de pago';
          default: return field;
        }
      }).join(', ');
      
      toast.error(`Por favor complete los siguientes campos: ${fieldNames}`);
      await form.trigger(missingFields as any); // Validación de activadores para campos específicos
      setIsSubmitting(false);
      return;
    }
    
    // Verificar si el método de pago es transferencia y necesita comprobante
    if (data.paymentMethod === "transfer" && !uploadedImage) {
      toast.error("Por favor suba un comprobante de pago");
      debugLog('Validation error', 'Missing payment proof for transfer');
      setIsSubmitting(false);
      return;
    }
    
    // Verifique los datos del comprador y complételos con los datos del formulario
    let completeData = { ...data };
    
    if (uploadedImage) {
      completeData.paymentProof = uploadedImage;
      debugLog('Payment proof attached', {
        name: uploadedImage.name,
        size: uploadedImage.size,
        type: uploadedImage.type
      });
    }
    
    debugLog('Sending payment data to parent component', completeData);
    console.log("🔄 Submitting payment with data:", {
      buyerName: completeData.buyerName,
      buyerPhone: completeData.buyerPhone,
      buyerCedula: completeData.buyerCedula,
      buyerEmail: completeData.buyerEmail,
      paymentMethod: completeData.paymentMethod
    });
    
    try {
      await onComplete(completeData);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    uploadedImage,
    previewUrl,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit,
    resetForm
  };
};
