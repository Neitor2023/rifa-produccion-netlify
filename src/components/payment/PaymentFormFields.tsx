
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

interface PaymentFormFieldsProps {
  form: UseFormReturn<PaymentFormData>;
  readOnlyData?: {
    name: string;
    phone: string;
    cedula?: string;
  };
}

const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({ form, readOnlyData }) => {
  console.log("📋 PaymentFormFields receiving readOnlyData:", readOnlyData);
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-800">Información personal</h3>
      
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
                className="bg-gray-50 text-gray-700 font-medium cursor-not-allowed"
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
                className="bg-gray-50 text-gray-700 font-medium cursor-not-allowed"
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
                readOnly={!!readOnlyData?.cedula}
                className={readOnlyData?.cedula ? "bg-gray-50 text-gray-700 font-medium cursor-not-allowed" : ""}
                value={readOnlyData?.cedula || field.value}
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
  );
};

export default PaymentFormFields;
