
import React, { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form } from "@/components/ui/form";
import { UseFormReturn } from 'react-hook-form';
import { PaymentFormData } from '../PaymentModal';
import PaymentSummary from './PaymentSummary';
import PaymentFormFields from './PaymentFormFields';
import { ValidatedBuyerInfo } from '@/types/participant';

// Nuevo: Subcomponente para mostrar datos validados limpios
const BuyerInfoPreview: React.FC<{ buyerData?: ValidatedBuyerInfo | null }> = ({ buyerData }) => (
  <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-50 text-sm">
    <strong>Información Importante:</strong>
    <br />
    Datos del participante:
    <br />
    <strong>Nombre:</strong> {buyerData?.name || ''}
    <br />
    <strong>Teléfono:</strong> {buyerData?.phone || ''}
    <br />
    <strong>Cédula:</strong> {buyerData?.cedula || ''}
  </div>
);

interface PaymentModalContentProps {
  form: UseFormReturn<PaymentFormData>;
  selectedNumbers: string[];
  price: number;
  previewUrl: string | null;
  buyerData?: ValidatedBuyerInfo;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
}

const PaymentModalContent: React.FC<PaymentModalContentProps> = ({
  form,
  selectedNumbers,
  price,
  previewUrl,
  buyerData,
  onFileUpload,
  onFileRemove
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
        <form onSubmit={form.handleSubmit(() => {})} className="space-y-6 py-4">
          <PaymentSummary 
            selectedNumbers={selectedNumbers}
            price={price}
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
      <BuyerInfoPreview buyerData={buyerData} />
    </ScrollArea>
  );
};

export default PaymentModalContent;
