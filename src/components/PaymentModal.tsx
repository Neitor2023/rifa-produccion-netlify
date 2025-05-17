
import React, { useState, useEffect } from 'react';
import { Card, Dialog, DialogContent } from "@/components/ui/dialog";
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
      participantId: '',
      clickedButtonType: '',
      paymentReceiptUrl: '',
    },
    mode: "onChange"
  });

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
      
      // Log the form data for debugging purposes
      if (debugMode) {
        console.log("Form Data to Submit:", data);
      }
      
      // Store the clicked button type in form data
      data.clickedButtonType = clickedButton;
      
      const result = await onCompletePayment(data);
      
      // If the result has conflictingNumbers, the modal handling will be done by parent components
      // Only handle the case where we need to close the payment modal
      if (!result || (result && result.success)) {
        onClose();
        clearSelectionState();
      }
      
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      toast.error("Error al procesar el pago. Por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/20 backdrop-blur-md max-w-2xl">
        <Card className="bg-transparent border-0 shadow-none">
        <PaymentModalHeader onClose={onClose} />
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
          onClose={onClose}
          onSubmit={form.handleSubmit(onSubmit)}
        />
      </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
