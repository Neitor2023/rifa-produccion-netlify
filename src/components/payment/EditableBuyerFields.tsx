
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PaymentFormData } from '../PaymentModal';

interface EditableBuyerFieldsProps {
  form: UseFormReturn<PaymentFormData>;
}

const EditableBuyerFields: React.FC<EditableBuyerFieldsProps> = ({ form }) => {
  console.log("🔵 EditableBuyerFields: Rendering editable fields for complementary data");

  return (
    <div>
      <h3 className="font-medium mb-3">Información Complementaria</h3>
      <div className="grid grid-cols-1 gap-4">
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
                <Input 
                  placeholder="¿Qué productos le gustaría ver?" 
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
  );
};

export default EditableBuyerFields;
