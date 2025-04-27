import { useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from '../PaymentModal';
import { ValidatedBuyerInfo } from '@/types/participant';
import PaymentMethodFields from './PaymentMethodFields';
import PaymentUploadZone from './PaymentUploadZone';
import PaymentNotes from './PaymentNotes';
import SuspiciousActivityReport from './SuspiciousActivityReport';
import BuyerInfoFields from './BuyerInfoFields';
import EditableBuyerFields from './EditableBuyerFields';

interface PaymentFormFieldsProps {
  form: UseFormReturn<PaymentFormData>;
  readOnlyData?: ValidatedBuyerInfo | null;
  previewUrl: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
}

const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({
  form,
  readOnlyData,
  previewUrl,
  onFileUpload,
  onFileRemove
}) => {
  const watchedPaymentMethod = form.watch('paymentMethod');

  useEffect(() => {
    if (readOnlyData) {
      console.log("🔵 PaymentFormFields: Reserved numbers flow - showing read-only participant data:", {
        name: readOnlyData.name,
        phone: readOnlyData.phone,
        cedula: readOnlyData.cedula || 'No disponible'
      });
    } else {
      console.log("🔵 PaymentFormFields: Direct purchase flow - no pre-existing data to show");
    }
  }, [readOnlyData]);

  return (
    <>
      {readOnlyData ? (
        // "Pagar Apartados" flow - show read-only participant data and editable fields for complementary data
        <>
          <BuyerInfoFields buyerData={readOnlyData} />
          <EditableBuyerFields form={form} />
        </>
      ) : (
        // Direct purchase flow - all fields are editable, nothing is pre-filled
        <div className="grid grid-cols-1 gap-4">
          <h3 className="font-medium mb-3">Información de Contacto</h3>
          <FormField
            control={form.control}
            name="buyerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ingrese su nombre completo" {...field} />
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
                  <Input placeholder="Ingrese su número de teléfono" type="tel" {...field} />
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
                  <Input placeholder="Ingrese su número de cédula o documento" {...field} />
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
                    placeholder="Ingrese su email" 
                    type="email" 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
      
      <div>
        <h3 className="font-medium mb-3">Información Adicional</h3>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="direccion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ingrese su dirección"
                    {...field}
                    value={field.value || ''}
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
                <FormLabel>Sugerencia de Producto</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="¿Qué productos le gustaría ver en futuras rifas?"
                    className="resize-none"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <PaymentNotes form={form} />
      <SuspiciousActivityReport form={form} />
      <PaymentMethodFields form={form} />
      
      {watchedPaymentMethod === "transfer" && (
        <PaymentUploadZone
          previewUrl={previewUrl}
          onFileUpload={onFileUpload}
          onFileRemove={onFileRemove}
        />
      )}
    </>
  );
};

export default PaymentFormFields;
