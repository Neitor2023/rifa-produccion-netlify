
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PaymentFormData } from '../PaymentModal';

interface EditableBuyerFieldsProps {
  form: UseFormReturn<PaymentFormData>;
}

// This component shows editable buyer data fields when we don't have validated information
const EditableBuyerFields: React.FC<EditableBuyerFieldsProps> = ({ form }) => {
  console.log("▶️ EditableBuyerFields.tsx: Mostrando campos editables para el comprador");

  return (
    <div className="mb-6">
      <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Información del Comprador</h3>
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="buyerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre completo"
                  {...field}
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
                  type="tel"
                  placeholder="Ej: 0991234567"
                  {...field}
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
                  placeholder="Número de documento"
                  {...field}
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
    </div>
  );
};

export default EditableBuyerFields;
