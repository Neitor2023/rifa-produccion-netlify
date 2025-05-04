
import { useEffect } from 'react';
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

function AdditionalInfoSection({ form }: { form: UseFormReturn<PaymentFormData> }) {
  return (
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
  );
}

function HiddenBuyerFields({ form, readOnlyData }: { form: UseFormReturn<PaymentFormData>; readOnlyData?: ValidatedBuyerInfo | null }) {
  useEffect(() => {
    console.log("PaymentFormFields.tsx:68 - HiddenBuyerFields - readOnlyData:", readOnlyData);
    if (readOnlyData) {
      if (readOnlyData.name)
        form.setValue("buyerName", readOnlyData.name);
      if (readOnlyData.phone)
        form.setValue("buyerPhone", readOnlyData.phone);
      if (readOnlyData.cedula)
        form.setValue("buyerCedula", readOnlyData.cedula);
      if (readOnlyData.direccion)
        form.setValue("direccion", readOnlyData.direccion);
      if (readOnlyData.email) {
        console.log("PaymentFormFields.tsx:78 - HiddenBuyerFields - Estableciendo email:", readOnlyData.email);
        form.setValue("buyerEmail", readOnlyData.email);
      }
      if (readOnlyData.sugerencia_producto)
        form.setValue("sugerenciaProducto", readOnlyData.sugerencia_producto);
    }
  }, [readOnlyData, form]);

  return null;
}

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
  const watchedPaymentMethod = form.watch('paymentMethod');

  useEffect(() => {
    console.log("PaymentFormFields.tsx:107 - Rendering with readOnlyData:", readOnlyData);
    if (readOnlyData && form) {
      console.log("PaymentFormFields.tsx:109 - Setting form values with readOnlyData:", readOnlyData);
      if (readOnlyData.name)
        form.setValue("buyerName", readOnlyData.name);
      if (readOnlyData.phone)
        form.setValue("buyerPhone", readOnlyData.phone);
      if (readOnlyData.cedula)
        form.setValue("buyerCedula", readOnlyData.cedula);
      if (readOnlyData.direccion)
        form.setValue("direccion", readOnlyData.direccion);
      if (readOnlyData.email) {
        console.log("PaymentFormFields.tsx:119 - Estableciendo email:", readOnlyData.email);
        form.setValue("buyerEmail", readOnlyData.email);
      }
      if (readOnlyData.sugerencia_producto)
        form.setValue("sugerenciaProducto", readOnlyData.sugerencia_producto);
    }
  }, [readOnlyData, form]);

  return (
    <>
      {readOnlyData ? (
        <>
          <BuyerInfoFields buyerData={readOnlyData} />
          <HiddenBuyerFields form={form} readOnlyData={readOnlyData} />
        </>
      ) : (
        <EditableBuyerFields form={form} />
      )}

      <AdditionalInfoSection form={form} />
      <PaymentNotes form={form} />
      <SuspiciousActivityReport form={form} />
      <PaymentMethodFields form={form} />
      
      {watchedPaymentMethod === "transfer" && (
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
