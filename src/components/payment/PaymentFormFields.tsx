
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from '../PaymentModal';
import { cn } from "@/lib/utils";
import { ValidatedBuyerInfo } from '@/types/participant';

interface PaymentFormFieldsProps {
  form: UseFormReturn<PaymentFormData>;
  readOnlyData?: ValidatedBuyerInfo;
}

const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({ form, readOnlyData }) => {
  const readOnlyStyles = "bg-gray-50 text-gray-700 font-medium cursor-not-allowed border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Información personal</h3>
        
        <FormField
          control={form.control}
          name="buyerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  readOnly
                  className={cn(readOnlyStyles, "hover:bg-gray-50 dark:hover:bg-gray-800")}
                  value={readOnlyData?.name || field.value}
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
                  className={cn(readOnlyStyles, "hover:bg-gray-50 dark:hover:bg-gray-800")}
                  value={readOnlyData?.phone || field.value}
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
                  {...field}
                  readOnly
                  className={cn(readOnlyStyles, "hover:bg-gray-50 dark:hover:bg-gray-800")}
                  value={readOnlyData?.cedula || field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {readOnlyData?.direccion && (
          <FormItem>
            <FormLabel>Dirección</FormLabel>
            <FormControl>
              <Input 
                readOnly
                className={cn(readOnlyStyles, "hover:bg-gray-50 dark:hover:bg-gray-800")}
                value={readOnlyData.direccion}
              />
            </FormControl>
          </FormItem>
        )}
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Información adicional</h3>
        
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

        {readOnlyData?.sugerencia_producto && (
          <FormItem>
            <FormLabel>Sugerencia de producto</FormLabel>
            <FormControl>
              <Input 
                readOnly
                className={cn(readOnlyStyles, "hover:bg-gray-50 dark:hover:bg-gray-800")}
                value={readOnlyData.sugerencia_producto}
              />
            </FormControl>
          </FormItem>
        )}
      </div>
    </div>
  );
};

export default PaymentFormFields;
