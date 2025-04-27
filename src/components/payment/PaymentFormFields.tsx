
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

  // Only set form values for reserved numbers payment (Pagar Apartados)
  useEffect(() => {
    if (readOnlyData) {
      console.log("🔵 PaymentFormFields: Setting form values with readOnlyData:", {
        name: readOnlyData.name,
        phone: readOnlyData.phone,
        cedula: readOnlyData.cedula || 'No disponible'
      });
      
      // Only set these values if we're in "Pagar Apartados" flow
      form.setValue("buyerName", readOnlyData.name);
      form.setValue("buyerPhone", readOnlyData.phone);
      form.setValue("buyerCedula", readOnlyData.cedula || '');
      
      // Set additional data if available
      if (readOnlyData.direccion) {
        form.setValue("direccion", readOnlyData.direccion);
      }
      if (readOnlyData.sugerencia_producto) {
        form.setValue("sugerenciaProducto", readOnlyData.sugerencia_producto);
      }
    } else {
      console.log("🔵 PaymentFormFields: Direct purchase - no pre-existing data to show");
    }
  }, [readOnlyData, form]);

  // Clear validation errors for read-only fields in "Pagar Apartados" flow
  useEffect(() => {
    if (readOnlyData) {
      form.clearErrors(["buyerName", "buyerPhone", "buyerCedula"]);
    }
  }, [readOnlyData, form]);

  return (
    <>
      {readOnlyData ? (
        <>
          <BuyerInfoFields buyerData={readOnlyData} />
          <EditableBuyerFields form={form} />
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
