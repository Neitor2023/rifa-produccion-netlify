
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { ValidatedBuyerInfo } from '@/types/participant';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PaymentUploadZone from './PaymentUploadZone';

interface PaymentFormFieldsProps {
  form: UseFormReturn<PaymentFormData>;
  readOnlyData?: ValidatedBuyerInfo | null;
  previewUrl: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
  paymentMethod?: "cash" | "transfer";
  selectedBankId?: string;
  onBankSelect?: (bankId: string) => void;
}

const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({ 
  form, 
  readOnlyData,
  previewUrl,
  onFileUpload,
  onFileRemove,
  paymentMethod,
  selectedBankId,
  onBankSelect
}) => {
  // Determine if buyer information is pre-filled and should be read-only
  const hasReadOnlyData = Boolean(readOnlyData);
  const { watch } = form;
  const currentPaymentMethod = watch('paymentMethod');
  
  return (
    <>
      <div className="space-y-4 bg-white/50 dark:bg-gray-400/50 p-4 rounded-md shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Información del Comprador</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="buyerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium text-gray-800 dark:text-white">
                  Nombre <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre completo"
                    className="border-gray-300 dark:border-gray-600"
                    {...field}
                    readOnly={hasReadOnlyData}
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
                <FormLabel className="text-base font-medium text-gray-800 dark:text-white">
                  Teléfono <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Número de teléfono"
                    className="border-gray-300 dark:border-gray-600"
                    {...field}
                    readOnly={hasReadOnlyData}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
                
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="buyerCedula"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium text-gray-800 dark:text-white">
                  Cédula <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Número de cédula"
                    className="border-gray-300 dark:border-gray-600"
                    {...field}
                    readOnly={hasReadOnlyData}
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
                <FormLabel className="text-base font-medium text-gray-800 dark:text-white">
                  Correo electrónico <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    className="border-gray-300 dark:border-gray-600"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium text-gray-800 dark:text-white">
                Dirección <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ingrese su dirección completa"
                  className="resize-none border-gray-300 dark:border-gray-600"
                  {...field}
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
              <FormLabel className="text-base font-medium text-gray-800 dark:text-white">
                Sugerencia de Producto
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="¿Hay algún producto que le gustaría ver en nuestra próxima rifa?"
                  className="resize-none border-gray-300 dark:border-gray-600"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Added: reporteSospechoso field */}
        <FormField
          control={form.control}
          name="reporteSospechoso"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium text-gray-800 dark:text-white">
                Reporte de actividad sospechosa
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Indique aquí si notó alguna actividad sospechosa o irregularidad con la pagina web o vendedores(as)"
                  className="resize-none border-gray-300 dark:border-gray-600"
                  {...field}
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
              <FormLabel className="text-base font-medium text-gray-800 dark:text-white">
                Nota adicional
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`¿Alguna nota o comentario adicional?\n¿Comenta si quieres ser vendedor(a)?\n¿O si quieres publicar?`}
                  className="resize-none border-gray-300 dark:border-gray-600"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
                
      </div>

      <div className="space-y-4 bg-white/50 dark:bg-gray-400/50 p-4 rounded-md shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Método de Pago</h3>
        
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="transfer" id="transfer" />
                    <Label htmlFor="transfer" className="text-base text-gray-800 dark:text-white">Transferencia bancaria</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="text-base text-gray-800 dark:text-white">Efectivo</Label>
                  </div>                  
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {currentPaymentMethod === 'transfer' && (
          <PaymentUploadZone
            previewUrl={previewUrl}
            onFileUpload={onFileUpload}
            onFileRemove={onFileRemove}
            paymentMethod={currentPaymentMethod}
            selectedBankId={selectedBankId}
            onBankSelect={onBankSelect}
          />
        )}             
      </div>
    </>
  );
};

export default PaymentFormFields;
