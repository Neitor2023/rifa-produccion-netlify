
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form } from "@/components/ui/form";
import { UseFormReturn } from 'react-hook-form';
import { PaymentFormData } from '../PaymentModal';
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
  // Fallback to empty string if participant data is present, never show N/A
  const showBuyerData = (v?: string) => (v != null && v !== undefined ? v : "");

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
              readOnlyData={{
                name: showBuyerData(buyerData?.name),
                cedula: showBuyerData(buyerData?.cedula),
                phone: showBuyerData(buyerData?.phone),
                direccion: showBuyerData(buyerData?.direccion),
                sugerencia_producto: showBuyerData(buyerData?.sugerencia_producto)
              }}
              previewUrl={previewUrl}
              onFileUpload={onFileUpload}
              onFileRemove={onFileRemove}
            />
          </div>
        </form>
      </Form>
      <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-50 text-sm">
        <strong>Información Importante:</strong>
        <br />
        Ahora se muestran automáticamente los datos del participante (<strong>Nombre</strong>: {buyerData?.name || ''}, <strong>Teléfono</strong>: {buyerData?.phone || ''}, <strong>Cédula</strong>: {buyerData?.cedula || ''}) vinculados al <strong>ID de Participante</strong> asociado a los números reservados.
        <br />
        Revise que estos datos corresponden efectivamente al titular del número seleccionado.
      </div>
    </ScrollArea>
  );
};

export default PaymentModalContent;
