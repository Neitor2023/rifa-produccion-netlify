
import React, { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form } from "@/components/ui/form";
import { UseFormReturn } from 'react-hook-form';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import PaymentSummary from './PaymentSummary';
import PaymentFormFields from './PaymentFormFields';
import { ValidatedBuyerInfo } from '@/types/participant';

interface PaymentModalContentProps {
  form: UseFormReturn<PaymentFormData>;
  selectedNumbers: string[];
  price: number;
  previewUrl: string | null;
  buyerData?: ValidatedBuyerInfo;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
  clickedButton?: string;
}

const PaymentModalContent: React.FC<PaymentModalContentProps> = ({
  form,
  selectedNumbers,
  price,
  previewUrl,
  buyerData,
  onFileUpload,
  onFileRemove,
  clickedButton
}) => {
  useEffect(() => {
    if (buyerData) {
      form.setValue('buyerName', buyerData.name || '');
      form.setValue('buyerPhone', buyerData.phone || '');
      form.setValue('buyerCedula', buyerData.cedula || '');
      if (buyerData.direccion) {
        form.setValue("direccion", buyerData.direccion);
      }
      if (buyerData.sugerencia_producto) {
        form.setValue("sugerenciaProducto", buyerData.sugerencia_producto);
      }
    }
  }, [buyerData, form]);
  
  return (
    <ScrollArea className="flex-1 overflow-y-auto px-1">
      <Form {...form}>
        <form 
          // Remove the onSubmit handler as we're handling submission via the action buttons
          className="space-y-6 py-4"
        >
          {/* PaymentSummary is still included but renders an empty div now */}
          <PaymentSummary 
            selectedNumbers={selectedNumbers}
            price={price}
            clickedButton={clickedButton}
          />
          <div className="space-y-6">
            <PaymentFormFields 
              form={form}
              readOnlyData={buyerData}
              previewUrl={previewUrl}
              onFileUpload={onFileUpload}
              onFileRemove={onFileRemove}
            />
          </div>
        </form>
      </Form>
    </ScrollArea>
  );
};

export default PaymentModalContent;
