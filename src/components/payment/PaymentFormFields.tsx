
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from '../PaymentModal';
import { ValidatedBuyerInfo } from '@/types/participant';
import PaymentMethodFields from './PaymentMethodFields';
import PaymentUploadZone from './PaymentUploadZone';
import PaymentNotes from './PaymentNotes';
import SuspiciousActivityReport from './SuspiciousActivityReport';
import BuyerInfoFields from './BuyerInfoFields';
import EditableBuyerFields from './EditableBuyerFields';

interface PaymentFormFieldsProps {
  form: UseFormReturn<PaymentFormData>;
  readOnlyData?: ValidatedBuyerInfo | null;
  previewUrl: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
}

const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({
  form,
  readOnlyData,
  previewUrl,
  onFileUpload,
  onFileRemove
}) => {
  return (
    <>
      {readOnlyData ? (
        <>
          <BuyerInfoFields buyerData={readOnlyData} />
          <FormField
            control={form.control}
            name="buyerName"
            render={({ field }) => (
              <input type="hidden" {...field} value={readOnlyData.name || ''} />
            )}
          />
          <FormField
            control={form.control}
            name="buyerPhone"
            render={({ field }) => (
              <input type="hidden" {...field} value={readOnlyData.phone || ''} />
            )}
          />
          <FormField
            control={form.control}
            name="buyerCedula"
            render={({ field }) => (
              <input type="hidden" {...field} value={readOnlyData.cedula || ''} />
            )}
          />
        </>
      ) : (
        <EditableBuyerFields form={form} />
      )}

      <div>
        <h3 className="font-medium mb-3">Información Adicional</h3>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="direccion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ingrese su dirección"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sugerenciaProducto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sugerencia de Producto</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="¿Qué productos le gustaría ver en futuras rifas?"
                    className="resize-none"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <PaymentNotes form={form} />
      <SuspiciousActivityReport form={form} />
      <PaymentMethodFields form={form} />
      
      {form.watch('paymentMethod') === "transfer" && (
        <PaymentUploadZone
          previewUrl={previewUrl}
          onFileUpload={onFileUpload}
          onFileRemove={onFileRemove}
        />
      )}
    </>
  );
};

export default PaymentFormFields;
