
import { useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from '../PaymentModal';
import { ValidatedBuyerInfo } from '@/types/participant';
import PaymentMethodFields from './PaymentMethodFields';
import PaymentUploadZone from './PaymentUploadZone';

// Subcomponente: información de comprador
function BuyerSection({ form, readOnlyData }: { form: UseFormReturn<PaymentFormData>, readOnlyData?: ValidatedBuyerInfo | null }) {
  useEffect(() => {
    if (readOnlyData) {
      form.setValue("buyerName", readOnlyData.name || '');
      form.setValue("buyerPhone", readOnlyData.phone || '');
      form.setValue("buyerCedula", readOnlyData.cedula || '');
      form.setValue("direccion", readOnlyData.direccion || '');
      form.setValue("sugerenciaProducto", readOnlyData.sugerencia_producto || '');
    }
  }, [readOnlyData, form]);

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

// Subcomponente: información adicional
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

  return (
    <>
      <BuyerSection form={form} readOnlyData={readOnlyData} />
      <AdditionalInfoSection form={form} />
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
