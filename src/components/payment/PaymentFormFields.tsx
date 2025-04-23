import React, { useEffect } from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from '../PaymentModal';
import { cn } from "@/lib/utils";
import { ValidatedBuyerInfo } from '@/types/participant';
import PaymentMethodFields from './PaymentMethodFields';

interface PaymentFormFieldsProps {
  form: UseFormReturn<PaymentFormData>;
  readOnlyData?: ValidatedBuyerInfo;
  previewUrl?: string | null;
}

const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({ 
  form, 
  readOnlyData, 
  previewUrl 
}) => {
  console.log("🔵 PaymentFormFields received readOnlyData:", readOnlyData);
  
  const readOnlyStyles = "bg-gray-100 text-gray-800 font-medium border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 cursor-not-allowed";

  // When readOnlyData changes, update the form values
  useEffect(() => {
    if (readOnlyData) {
      console.log("🔄 Updating form with readOnlyData:", readOnlyData);
      form.setValue('buyerName', readOnlyData.name || '');
      form.setValue('buyerPhone', readOnlyData.phone || '');
      form.setValue('buyerCedula', readOnlyData.cedula || '');
      
      if (readOnlyData.direccion) {
        form.setValue('direccion', readOnlyData.direccion);
      }
      
      if (readOnlyData.sugerencia_producto) {
        form.setValue('sugerenciaProducto', readOnlyData.sugerencia_producto);
      }
      
      console.log("🔄 Form values after update:", form.getValues());
    } else {
      console.log("⚠️ No readOnlyData provided to PaymentFormFields");
    }
  }, [readOnlyData, form]);

  // Using form.watch() for reactive updates to ensure the UI reflects the form values
  const buyerName = form.watch('buyerName');
  const buyerPhone = form.watch('buyerPhone');
  const buyerCedula = form.watch('buyerCedula');

  return (
    <div className="space-y-6">
      {/* Full width field - Buyer Name */}
      <FormField
        control={form.control}
        name="buyerName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre completo</FormLabel>
            <FormControl>
              <Input 
                {...field}
                value={buyerName || ''}
                readOnly
                className={cn(readOnlyStyles, "hover:bg-gray-100 dark:hover:bg-gray-800")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Two-column grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First column - Read-only fields */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="buyerCedula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cédula/DNI</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    value={buyerCedula || ''}
                    readOnly
                    className={cn(readOnlyStyles, "hover:bg-gray-100 dark:hover:bg-gray-800")}
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
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    value={buyerPhone || ''}
                    readOnly
                    className={cn(readOnlyStyles, "hover:bg-gray-100 dark:hover:bg-gray-800")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Second column - Email, Payment Method */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="buyerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="correo@ejemplo.com" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <PaymentMethodFields
            form={form}
            previewUrl={previewUrl || null}
            onFileUpload={() => {}}
            onFileRemove={() => {}}
          />
        </div>
      </div>
      {/* Additional fields */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección (opcional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ingrese su dirección"
                  {...field}
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
              <FormLabel>Sugerencia de producto (opcional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="¿Qué producto le gustaría ver en el futuro?"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nota"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nota (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Añada una nota para el organizador"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reporteSospechoso"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reporte sospechoso (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="¿Hay algo sospechoso que quiera reportar?"
                  className="resize-none"
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
};

export default PaymentFormFields;
