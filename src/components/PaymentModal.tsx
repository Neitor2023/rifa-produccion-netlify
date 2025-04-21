
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Toaster, toast } from 'sonner';
import PaymentModalContainer from './payment/PaymentModalContainer';
import { PaymentModalHeader } from './payment/PaymentModalHeader';
import PaymentModalContent from './payment/PaymentModalContent';
import PaymentModalForm from './payment/PaymentModalForm';
import { PaymentModalActions } from './payment/PaymentModalActions';
import { ValidatedBuyerInfo } from '@/types/participant';

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
  direccion: z.string().optional(),
  sugerenciaProducto: z.string().optional(),
  reporteSospechoso: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  price: number;
  onComplete: (paymentData: PaymentFormData) => void;
  buyerData?: ValidatedBuyerInfo;
  debugMode?: boolean;
}

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
      buyerCedula: buyerData?.cedula || "",
      buyerEmail: "",
      paymentMethod: undefined,
      paymentProof: undefined,
      nota: "",
      direccion: buyerData?.direccion || "",
      sugerenciaProducto: buyerData?.sugerencia_producto || "",
      reporteSospechoso: "",
    },
  });

  useEffect(() => {
    // Always update form fields with latest buyerData when modal opens or data changes
    if (buyerData) {
      form.setValue('buyerName', buyerData.name || "");
      form.setValue('buyerPhone', buyerData.phone || "");
      form.setValue('buyerCedula', buyerData.cedula || "");
      if (buyerData.direccion) form.setValue("direccion", buyerData.direccion);
      if (buyerData.sugerencia_producto) form.setValue("sugerenciaProducto", buyerData.sugerencia_producto);
    }
  }, [buyerData, isOpen, form]);

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
    form.reset();
    setUploadedImage(null);
    setPreviewUrl(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setPreviewUrl(null);
  };

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setUploadedImage(null);
      setPreviewUrl(null);
    }
  }, [isOpen, form]);

  return (
    <PaymentModalContainer open={isOpen} onClose={onClose}>
      <PaymentModalHeader />
      <PaymentModalForm form={form} onSubmit={onSubmit}>
        <PaymentModalContent
          form={form}
          selectedNumbers={selectedNumbers}
          price={price}
          previewUrl={previewUrl}
          // pass the correct buyerData for proper field fill
          buyerData={buyerData}
          onFileUpload={handleImageUpload}
          onFileRemove={handleRemoveImage}
        />
        <PaymentModalActions
          isSubmitting={isSubmitting}
          onClose={onClose}
          onSubmit={form.handleSubmit(onSubmit)}
        />
      </PaymentModalForm>
    </PaymentModalContainer>
  );
};
export default PaymentModal;
