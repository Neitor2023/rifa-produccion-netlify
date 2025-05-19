
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from '@/types/payment';

interface SuspiciousActivityReportProps {
  form: UseFormReturn<PaymentFormData>;
}

const SuspiciousActivityReport: React.FC<SuspiciousActivityReportProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-gray-800 dark:text-white">
        Reporte actitud sospechosa del vendedor o del sistema
      </h3>
      
      <FormField
        control={form.control}
        name="reporteSospechoso"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700 dark:text-gray-300">
              Reporte cualquier comportamiento sospechoso
            </FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describa cualquier comportamiento sospechoso" 
                {...field}
                className="resize-none text-foreground bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500">
              Su reporte será enviado de forma confidencial a los administradores del sistema.
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};

export default SuspiciousActivityReport;
