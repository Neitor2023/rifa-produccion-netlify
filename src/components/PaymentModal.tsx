
import React, { useState, useRef, useEffect } from 'react';
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
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import { exportVoucherAsImage, uploadVoucherToStorage } from './digital-voucher/utils/voucherExport';
import { supabase } from '@/integrations/supabase/client';

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
  const { clearSelectionState } = useNumberSelection();
  const voucherRef = useRef<HTMLDivElement>(null);
  
  // Function to automatically save the voucher for all purchased numbers
  const saveVoucherForAllNumbers = async (paymentData: PaymentFormData): Promise<void> => {
    if (selectedNumbers.length === 0) return;
    
    try {
      console.log('[PaymentModal.tsx] Starting automatic voucher saving for numbers:', selectedNumbers);
      
      // 1. First, get the IDs for all selected numbers
      const promises = selectedNumbers.map(async (numStr) => {
        const num = parseInt(numStr, 10);
        const { data, error } = await supabase
          .from('raffle_numbers')
          .select('id')
          .eq('number', num)
          .single();
          
        if (error) {
          console.error(`[PaymentModal.tsx] Error fetching ID for number ${numStr}:`, error);
          return null;
        }
        
        return data?.id || null;
      });
      
      const numberIds = (await Promise.all(promises)).filter(Boolean) as string[];
      
      if (numberIds.length === 0) {
        console.error('[PaymentModal.tsx] No valid number IDs found');
        return;
      }
      
      // 2. Generate a receipt URL based on the first number
      const domain = window.location.hostname || 'rifamax.com';
      const protocol = window.location.protocol || 'https:';
      const mainReceiptUrl = `${protocol}//${domain}/receipt/${numberIds[0]}`;
      
      // 3. Prepare raffle details for the voucher
      const raffleDetails = {
        title: organization?.organization_name || 'Rifa',
        price: price,
        lottery: '',
        dateLottery: new Date().toLocaleDateString()
      };
      
      // 4. Generate receipt image and save it for each number
      // We'll just generate it once and upload the same image URL to all numbers
      console.log('[PaymentModal.tsx] Generating voucher image');
      
      // We don't have the actual voucher DOM element yet, 
      // so we'll do a batch update to all raffle_numbers once payment is complete
      console.log('[PaymentModal.tsx] Will save receipt URL for all numbers:', numberIds);
      
      // This function will be called by the payment completion handler
      return;
      
    } catch (error) {
      console.error('[PaymentModal.tsx] Error in saveVoucherForAllNumbers:', error);
    }
  };
  
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
      
      // Get the form data
      const formData = form.getValues();
      
      // We'll save this voucher during the payment completion process
      await saveVoucherForAllNumbers(formData);
      
      // Submit the form
      await handleSubmit();
    } finally {
      setIsSearching(false);
    }
  };

  // Handle the modal close to clear selections
  const handleCloseModal = () => {
    console.log("[PaymentModal.tsx] Closing payment modal and clearing selections");
    clearSelectionState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
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
                
                <DialogClose 
                  className="absolute right-10 top-9 rounded-sm bg-[#3d3d3d] hover:bg-[#1a1a1a] opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-white"
                  onClick={handleCloseModal}
                >
                  <X className="h-4 w-4"/>
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
            onClose={handleCloseModal}
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
