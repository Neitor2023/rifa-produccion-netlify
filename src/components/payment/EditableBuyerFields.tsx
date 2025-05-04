
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PaymentFormData } from '../PaymentModal';

interface EditableBuyerFieldsProps {
  form: UseFormReturn<PaymentFormData>;
}

const EditableBuyerFields: React.FC<EditableBuyerFieldsProps> = ({ form }) => {
  console.log("EditableBuyerFields.tsx:10 - Rendering with form values:", form.getValues());
  
  return (
    <div>
      <h3 className="font-medium mb-3">Información del Comprador</h3>
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="buyerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese su nombre" {...field} />
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
                <Input placeholder="Ingrese su teléfono" type="tel" {...field} />
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
              <FormLabel>Cédula</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese su cédula" {...field} value={field.value || ''} />
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
                <Input placeholder="Ingrese su email" type="email" {...field} />
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
