
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form } from "@/components/ui/form";
import { UseFormReturn } from 'react-hook-form';
import { PaymentFormData } from '../PaymentModal';
import PaymentSummary from './PaymentSummary';
import PaymentFormFields from './PaymentFormFields';
import { ValidatedBuyerInfo } from '@/types/participant';

interface PaymentModalContentProps {
  form: UseFormReturn<PaymentFormData>;
  selectedNumbers: string[];
  price: number;
  previewUrl: string | null;
  buyerData?: ValidatedBuyerInfo;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
}

const PaymentModalContent: React.FC<PaymentModalContentProps> = ({
  form,
  selectedNumbers,
  price,
  previewUrl,
  buyerData,
  onFileUpload,
  onFileRemove
}) => {
  // We're not setting form values here anymore
  // This ensures that for direct purchase flow, no data is pre-filled
  // For reserved numbers flow, the BuyerInfoFields component will show read-only data
  
  return (
    <ScrollArea className="flex-1 overflow-y-auto px-1">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => {})} className="space-y-6 py-4">
          <PaymentSummary 
            selectedNumbers={selectedNumbers}
            price={price}
          />
          <div className="space-y-6">
            <PaymentFormFields 
              form={form}
              readOnlyData={buyerData}
              previewUrl={previewUrl}
              onFileUpload={onFileUpload}
              onFileRemove={onFileRemove}
            />
          </div>
        </form>
      </Form>
    </ScrollArea>
  );
};

export default PaymentModalContent;
