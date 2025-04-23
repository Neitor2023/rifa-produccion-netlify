
import { useEffect, useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from '../PaymentModal';
import { ValidatedBuyerInfo } from '@/types/participant';
import PaymentMethodFields from './PaymentMethodFields';
import PaymentUploadZone from './PaymentUploadZone';

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
  // Log readOnlyData to debug
  useEffect(() => {
    console.log("PaymentFormFields readOnlyData:", readOnlyData);
    
    // If we have readOnlyData, set the form values
    if (readOnlyData) {
      form.setValue("buyerName", readOnlyData.name || '');
      form.setValue("buyerPhone", readOnlyData.phone || '');
      form.setValue("buyerCedula", readOnlyData.cedula || '');
      form.setValue("direccion", readOnlyData.direccion || '');
      form.setValue("sugerenciaProducto", readOnlyData.sugerencia_producto || '');
      
      console.log("Updated form values:", form.getValues());
    }
  }, [readOnlyData, form]);

  // Watch form values for validation status
  const watchedPhone = form.watch('buyerPhone');
  const watchedName = form.watch('buyerName');
  const watchedCedula = form.watch('buyerCedula');
  const watchedEmail = form.watch('buyerEmail');
  const watchedDireccion = form.watch('direccion');
  const watchedSugerencia = form.watch('sugerenciaProducto');
  const watchedPaymentMethod = form.watch('paymentMethod');

  return (
    <>
      {/* Buyer Information Section */}
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

      {/* Additional Information */}
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

      {/* Payment Method */}
      <PaymentMethodFields form={form} />
      
      {/* Upload Payment Proof */}
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
