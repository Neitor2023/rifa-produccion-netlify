
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

interface PaymentFormFieldsProps {
  form: UseFormReturn<PaymentFormData>;
  readOnlyData?: ValidatedBuyerInfo;
  previewUrl?: string | null;
}

const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({ form, readOnlyData, previewUrl }) => {
  // Enhanced styling for read-only fields with better contrast
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
                value={readOnlyData?.name || field.value}
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
                    value={readOnlyData?.cedula || field.value}
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
                    value={readOnlyData?.phone || field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Second column - Editable fields */}
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
        </div>
      </div>
      
      {/* Full width additional fields */}
      <div className="space-y-4">
        {/* Address field */}
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
        
        {/* Product suggestion field */}
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
        
        {/* Note field */}
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
        
        {/* Suspicious report field */}
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
