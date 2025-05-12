
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogClose,
  DialogHeader,
  DialogTitle,  
} from '@/components/ui/dialog';
import { X, LoaderCircle } from 'lucide-react';
import { Toaster } from 'sonner';
import { ValidatedBuyerInfo } from '@/types/participant';

import { PaymentModalActions } from './payment/PaymentModalActions';
import PaymentModalContent from './payment/PaymentModalContent';
import { NumberSelectionProvider } from '@/contexts/NumberSelectionContext';
import { usePaymentForm } from '@/hooks/usePaymentForm';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { Card, CardHeader } from "@/components/ui/card";
import { Organization } from '@/lib/constants/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  price: number;
  onComplete: (paymentData: PaymentFormData) => void;
  buyerData?: ValidatedBuyerInfo;
  debugMode?: boolean;
  clickedButton?: string;
  organization?: Organization | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedNumbers,
  price,
  onComplete,
  buyerData,
  debugMode = false,
  clickedButton,
  organization
}) => {
  const {
    form,
    isSubmitting,
    previewUrl,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit
  } = usePaymentForm({
    buyerData,
    onComplete,
    isOpen,
    debugMode,
    clickedButton
  });
  const [isSearching, setIsSearching] = useState(false);
  
  // Check if form is valid based on required fields
  const formValues = form.getValues();
  const isFormValid = () => {
    // Default required fields
    const requiredFields = ['buyerName', 'buyerPhone', 'buyerCedula', 'paymentMethod'];
    
    // Add fields based on button context
    if (clickedButton === 'Pagar') {
      // For "Pagar Directo" we need all fields
      requiredFields.push('buyerEmail', 'direccion');
    } else if (clickedButton === 'Pagar Apartados') {
      // For "Pagar Apartados" we need email and direccion
      requiredFields.push('buyerEmail', 'direccion');
    }
    
    // Check if payment method is transfer and needs proof
    if (formValues.paymentMethod === 'transfer' && !previewUrl) {
      return false;
    }
    
    // Check all required fields
    return requiredFields.every(field => 
      formValues[field as keyof PaymentFormData] && 
      String(formValues[field as keyof PaymentFormData]).trim() !== ''
    );
  };

  const submissionHandler = async () => {
    setIsSearching(true);
    try {
      if (!isFormValid()) {
        console.log("Form validation failed");
        form.trigger(); // Trigger validation to show error messages
        setIsSearching(false);
        return;
      }
      await handleSubmit();
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] flex flex-col bg-background dark:bg-gray-900 rounded-xl border-0 shadow-xl">
        <Card className="bg-background dark:bg-gray-900 border-0 shadow-none">
          <DialogHeader className="pt-1 pb-1">
            <Card className="bg-[#9b87f5] dark:bg-[#7E69AB] shadow-md border-0">
              <CardHeader className="py-3 px-4">

                <DialogTitle asChild>
                  <button
                    type="button"
                    className="w-full cursor-pointer text-lg text-white font-bold text-center flex items-center justify-center"
                    onClick={submissionHandler}
                    disabled={isSubmitting || isSearching}
                  >
                    {(isSubmitting || isSearching) && (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirma tu pago
                  </button>
                </DialogTitle>                
                
                <DialogClose className="absolute right-10 itens-center rounded-sm bg-[#3d3d3d] hover:bg-[#1a1a1a] opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-white">
                  <X className="h-4 w-4 pt-1 pb-1 itens-center"/>
                  <span className="sr-only">Close</span>
                </DialogClose>                                      
              </CardHeader>
            </Card>
          </DialogHeader>
          
          <PaymentModalContent
            form={form}
            selectedNumbers={selectedNumbers}
            price={price}
            previewUrl={previewUrl}
            buyerData={buyerData}
            onFileUpload={handleImageUpload}
            onFileRemove={handleRemoveImage}
            clickedButton={clickedButton}
            organization={organization}
          />
          
          <PaymentModalActions 
            isSubmitting={isSubmitting || isSearching}
            isFormValid={isFormValid()}
            onClose={onClose}
            onSubmit={submissionHandler}
          />
        </Card>
        
        <Toaster
          position="top-right"
          visibleToasts={10}
          gap={12}
          closeButton
        />
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
export type { PaymentFormData };
