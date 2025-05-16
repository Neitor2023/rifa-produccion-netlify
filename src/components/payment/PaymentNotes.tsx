import React from 'react';
import {
  FormField,
  FormItem,
  FormControl,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from '@/schemas/paymentFormSchema';

interface PaymentNotesProps {
  form: UseFormReturn<PaymentFormData>;
}

const PaymentNotes: React.FC<PaymentNotesProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-gray-800 dark:text-white">
        Comentarios adicionales (opcional)
      </h3>
      
      <FormField
        control={form.control}
        name="nota"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea 
                placeholder={`¿Alguna nota o comentarioQ adicional?\n¿Comenta si quieres ser vendedor(a)?\n¿Si quieres publicar?`}
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

export default PaymentNotes;
