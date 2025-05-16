import React from 'react';
import {
  FormField,
  FormItem,
  FormControl,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from '@/schemas/paymentFormSchema';

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
            <FormControl>
              <Textarea 
                placeholder="Describa cualquier comportamiento sospechoso" 
                {...field}
                className="resize-none"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};

export default SuspiciousActivityReport;
