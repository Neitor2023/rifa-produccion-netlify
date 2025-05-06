
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from '../PaymentModal';

interface PaymentMethodFieldsProps {
  form: UseFormReturn<PaymentFormData>;
}

const PaymentMethodFields: React.FC<PaymentMethodFieldsProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-gray-800 dark:text-white mb-2">Método de Pago</h3>
      <FormField
        control={form.control}
        name="paymentMethod"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <SelectTrigger className="
                  bg-gray-50 dark:bg-gray-900
                  border-gray-300 dark:border-gray-700
                  
                  transition-colors
                  [&_[data-placeholder]]:text-black
                  dark:[&_[data-placeholder]]:text-white                  
                  ">
                  <SelectValue placeholder="Seleccione un método de pago MMMM" />
                </SelectTrigger>
                <SelectContent className="text-foreground bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default PaymentMethodFields;
