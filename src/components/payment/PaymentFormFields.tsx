
import React from 'react';
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
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove?: () => void;
}

const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({
  form,
  readOnlyData,
  previewUrl,
  onFileUpload,
  onFileRemove,
}) => {
  const readOnlyStyles = "bg-gray-100 text-gray-800 font-medium border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 cursor-not-allowed";
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
                readOnly
                className={cn(readOnlyStyles, "hover:bg-gray-100 dark:hover:bg-gray-800")}
                value={readOnlyData?.name || ""}
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
                    readOnly
                    className={cn(readOnlyStyles, "hover:bg-gray-100 dark:hover:bg-gray-800")}
                    value={readOnlyData?.cedula || ""}
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
                    readOnly
                    className={cn(readOnlyStyles, "hover:bg-gray-100 dark:hover:bg-gray-800")}
                    value={readOnlyData?.phone || ""}
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
            onFileUpload={onFileUpload || (() => {})}
            onFileRemove={onFileRemove || (() => {})}
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
                  defaultValue={readOnlyData?.direccion || ""}
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
                  defaultValue={readOnlyData?.sugerencia_producto || ""}
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
