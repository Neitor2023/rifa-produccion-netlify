
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentFormSchema, PaymentFormData } from '@/schemas/paymentFormSchema';
import { ValidatedBuyerInfo } from '@/types/participant';
import { toast } from 'sonner';

interface UsePaymentFormProps {
  buyerData?: ValidatedBuyerInfo;
  onComplete: (data: PaymentFormData) => Promise<void>;
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
    resolver: zodResolver(paymentFormSchema),
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
  });

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PaymentModal - ${context}]:`, data);
    }
  };
  
  // Update form values when buyerData changes
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

  // Reset form and image when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else {
      debugLog('Modal opened', { buyerData, clickedButton });
      
      // Clear image when modal is opened with "Pagar" button
      if (clickedButton === "Pagar") {
        console.log("PaymentModal - Modal opened with Pagar button, clearing previous image");
        setUploadedImage(null);
        setPreviewUrl(null);
      }
      
      // Update form with buyerData when modal opens
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
    
    // Get the current form values
    const data = form.getValues();
    
    setIsSubmitting(true);
    debugLog('Form submit - data', data);
    
    // Check buyerData and complete with form data
    let completeData = { ...data };
    
    if (data.paymentMethod === "transfer" && !uploadedImage) {
      toast.error("Por favor suba un comprobante de pago");
      debugLog('Validation error', 'Missing payment proof for transfer');
      setIsSubmitting(false);
      return;
    }
    
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
    } catch (error) {
      console.error("Error completing payment:", error);
      toast.error("Error al procesar el pago");
    } finally {
      setIsSubmitting(false);
      resetForm();
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
