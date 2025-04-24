import { useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from '../PaymentModal';
import { ValidatedBuyerInfo } from '@/types/participant';
import PaymentMethodFields from './PaymentMethodFields';
import PaymentUploadZone from './PaymentUploadZone';

interface BuyerSectionProps {
  form: UseFormReturn<PaymentFormData>;
  readOnlyData?: ValidatedBuyerInfo | null;
}

/**
 * BuyerSection
 * Se asegura que los campos se autocompleten SOLO cuando readOnlyData o datos validados estén presentes
 */
function BuyerSection({ form, readOnlyData }: BuyerSectionProps) {
  useEffect(() => {
    if (readOnlyData) {
      if (readOnlyData.name)
        form.setValue("buyerName", readOnlyData.name)
      if (readOnlyData.phone)
        form.setValue("buyerPhone", readOnlyData.phone)
      if (readOnlyData.cedula)
        form.setValue("buyerCedula", readOnlyData.cedula)
      if (readOnlyData.direccion)
        form.setValue("direccion", readOnlyData.direccion)
      if (readOnlyData.sugerencia_producto)
        form.setValue("sugerenciaProducto", readOnlyData.sugerencia_producto)
    }
    // Solo reaccionar ante cambios de readOnlyData, para no sobrescribir tipeos
    // eslint-disable-next-line
  }, [readOnlyData]);

  return (
    <div>
      <h3 className="font-medium mb-3">Información del Comprador</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="buyerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre completo <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej. Juan Pérez"
                  className="bg-gray-50 dark:bg-gray-800"
                  {...field}
                  value={field.value || readOnlyData?.name || ''}
                  readOnly={!!readOnlyData}
                  disabled={!!readOnlyData}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="buyerPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Teléfono <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej. +1234567890"
                  className="bg-gray-50 dark:bg-gray-800"
                  {...field}
                  value={field.value || readOnlyData?.phone || ''}
                  readOnly={!!readOnlyData}
                  disabled={!!readOnlyData}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="buyerCedula"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cédula/DNI</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej. 12345678"
                  className="bg-gray-50 dark:bg-gray-800"
                  {...field}
                  value={field.value || readOnlyData?.cedula || ''}
                  readOnly={!!readOnlyData}
                  disabled={!!readOnlyData}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="buyerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="nombre@ejemplo.com"
                  type="email"
                  {...field}
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

// Información adicional (sin cambios)
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

/**
 * PaymentFormFields
 * Ajusta entrega de props a subcomponentes según sus definiciones.
 */
const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({
  form,
  readOnlyData,
  previewUrl,
  onFileUpload,
  onFileRemove
}) => {
  const watchedPaymentMethod = form.watch('paymentMethod');

  return (
    <>
      <BuyerSection form={form} readOnlyData={readOnlyData} />
      <AdditionalInfoSection form={form} />
      <PaymentMethodFields
        form={form}
        previewUrl={previewUrl}
        onFileUpload={onFileUpload}
        onFileRemove={onFileRemove}
      />
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
