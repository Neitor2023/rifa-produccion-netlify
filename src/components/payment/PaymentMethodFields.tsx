
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
import PaymentUploadZone from './PaymentUploadZone';

interface PaymentMethodFieldsProps {
  form: UseFormReturn<PaymentFormData>;
  previewUrl: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
}

const PaymentMethodFields: React.FC<PaymentMethodFieldsProps> = ({ 
  form, 
  previewUrl, 
  onFileUpload, 
  onFileRemove 
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-800">Método de pago</h3>
      
      <FormField
        control={form.control}
        name="paymentMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Selecciona el método</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método de pago" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia bancaria</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {form.watch("paymentMethod") === "transfer" && (
        <PaymentUploadZone
          previewUrl={previewUrl}
          onFileUpload={onFileUpload}
          onFileRemove={onFileRemove}
        />
      )}
    </div>
  );
};

export default PaymentMethodFields;
