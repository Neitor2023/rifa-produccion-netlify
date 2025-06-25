
import React, { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form } from "@/components/ui/form";
import { UseFormReturn } from 'react-hook-form';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import PaymentSummary from './PaymentSummary';
import PaymentFormFields from './PaymentFormFields';
import { ValidatedBuyerInfo } from '@/types/participant';
import { Card, CardContent } from "@/components/ui/card";
import PromotionalImage from '@/components/raffle/PromotionalImage';
import { Organization } from '@/lib/constants/types';

interface PaymentModalContentProps {
  form: UseFormReturn<PaymentFormData>;
  selectedNumbers: string[];
  rafflePrice: number;
  previewUrl: string | null;
  buyerData?: ValidatedBuyerInfo;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
  clickedButton?: string;
  organization?: Organization | null;
  selectedBankId?: string;
  onBankSelect?: (bankId: string) => void;
}

const PaymentModalContent: React.FC<PaymentModalContentProps> = ({
  form,
  selectedNumbers,
  rafflePrice,
  previewUrl,
  buyerData,
  onFileUpload,
  onFileRemove,
  clickedButton,
  organization,
  selectedBankId,
  onBankSelect
}) => {
  useEffect(() => {
    if (buyerData) {
      form.setValue('buyerName', buyerData.name || '');
      form.setValue('buyerPhone', buyerData.phone || '');
      form.setValue('buyerCedula', buyerData.cedula || '');
      if (buyerData.direccion) {
        form.setValue("direccion", buyerData.direccion);
      }
      if (buyerData.sugerencia_producto) {
        form.setValue("sugerenciaProducto", buyerData.sugerencia_producto);
      }
    }
  }, [buyerData, form]);
  
  return (
    <Card className="border-0 shadow-sm mt-4 bg-transparent">
      <CardContent className="p-1">
        <ScrollArea className="max-h-[59vh] overflow-y-auto pt-1 px-1 bg-gray-400 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
          <div className="p-4">
            <Form {...form}>
              <form className="space-y-6">
                {/* PaymentSummary todavía está incluido, pero ahora muestra un div vacío */}
                <PaymentSummary 
                  selectedNumbers={selectedNumbers}
                  price={rafflePrice}
                  clickedButton={clickedButton}
                />
                <div className="space-y-6">
                  <PaymentFormFields 
                    form={form}
                    readOnlyData={buyerData}
                    previewUrl={previewUrl}
                    onFileUpload={onFileUpload}
                    onFileRemove={onFileRemove}
                    paymentMethod={form.watch("paymentMethod")}
                    selectedBankId={selectedBankId}
                    onBankSelect={onBankSelect}                    
                  />
                </div>
              </form>
            </Form>
            
            {/* Mostrar imagen promocional al final si está disponible */}
            {organization?.imagen_publicitaria && (
              <PromotionalImage imageUrl={organization.imagen_publicitaria} />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PaymentModalContent;
