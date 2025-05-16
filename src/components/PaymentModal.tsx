
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
import { 
  exportVoucherAsImage, 
  uploadVoucherToStorage, 
  updatePaymentReceiptUrlForNumbers, 
  updatePaymentReceiptUrlForParticipant,
  ensureReceiptSavedForParticipant 
} from './digital-voucher/utils/voucherExport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RAFFLE_ID, SELLER_ID } from '@/lib/constants';
import { getSellerUuidFromCedula } from '@/hooks/useRaffleData/useSellerIdMapping';

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
  
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { clearSelectionState } = useNumberSelection();
  const voucherRef = useRef<HTMLDivElement>(null);
  
  // Enhanced function for saving voucher for all numbers
  const saveVoucherForAllNumbers = async (paymentData: PaymentFormData): Promise<string | null> => {
    if (selectedNumbers.length === 0 || !paymentData.participantId) return null;
    
    try {
      console.log('[PaymentModal.tsx] Initiating automatic voucher saving for numbers:', selectedNumbers);
      
      // Get the seller UUID from the cedula if needed
      let sellerUuid = SELLER_ID;
      
      if (!SELLER_ID.includes('-')) { // Not a UUID format
        console.log('[PaymentModal.tsx] SELLER_ID appears to be a cedula, looking up UUID');
        const uuid = await getSellerUuidFromCedula(SELLER_ID);
        
        if (uuid) {
          console.log('[PaymentModal.tsx] Found seller UUID for cedula:', uuid);
          sellerUuid = uuid;
        } else {
          console.error('[PaymentModal.tsx] Failed to find seller UUID for cedula:', SELLER_ID);
          toast.error('Error: No se pudo encontrar el ID del vendedor');
        }
      }
      
      // 4. Prepare raffle details for voucher
      const raffleDetails = {
        title: organization?.organization_name || 'Rifa',
        price: price,
        lottery: '',
        dateLottery: new Date().toLocaleDateString()
      };
      
      // Create temporary div for receipt rendering
      const tempReceiptContainer = document.createElement('div');
      tempReceiptContainer.style.position = 'absolute';
      tempReceiptContainer.style.left = '-9999px';
      document.body.appendChild(tempReceiptContainer);
      
      // Generate receipt URL
      const domain = window.location.hostname || 'rifamax.com';
      const protocol = window.location.protocol || 'https:';
      const receiptBaseUrl = `${protocol}//${domain}/receipt/`;
      
      // Get numbers to display in the voucher
      let numbersToDisplay = selectedNumbers;
      
      // Calculate total payment amount
      const totalAmount = price * numbersToDisplay.length;
      
      // Format date for receipt
      const formattedDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // 7. Create temporary content for voucher
      tempReceiptContainer.innerHTML = `
        <div class="print-content p-1">
          <!-- HTML content for voucher -->
        </div>
      `;
      
      // 8. Generate receipt image
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(tempReceiptContainer, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Clean up temporary element
      document.body.removeChild(tempReceiptContainer);
      
      // 9. Upload the image if successful
      if (imgData && raffleDetails) {
        // Create a unique receipt ID
        const receiptId = `receipt_${new Date().getTime()}_${paymentData.participantId}`;
        
        console.log('[PaymentModal.tsx] Uploading voucher image with ID:', receiptId);
        const imageUrl = await uploadVoucherToStorage(
          imgData, 
          raffleDetails.title,
          receiptId
        );
        
        if (imageUrl) {
          console.log('[PaymentModal.tsx] Successfully uploaded receipt. URL:', imageUrl);
          
          // 10. Update the receipt URL for all numbers belonging to this participant
          const updateSuccess = await updatePaymentReceiptUrlForParticipant(
            imageUrl, 
            paymentData.participantId, 
            RAFFLE_ID,
            sellerUuid
          );
          
          if (updateSuccess) {
            toast.success("Comprobante guardado automáticamente.", { id: "auto-save-receipt" });
          }
          
          return imageUrl;
        }
      }
      
      return null;
    } catch (error) {
      console.error('[PaymentModal.tsx] Error in saveVoucherForAllNumbers:', error);
      return null;
    }
  };
  
  // Compruebe si el formulario es válido según los campos obligatorios
  const formValues = form.getValues();
  const isFormValid = (): boolean => {
    //Campos obligatorios predeterminados
    const requiredFields = ['buyerName', 'buyerPhone', 'buyerCedula', 'paymentMethod'];
    
    // Agregar campos según el contexto del botón
    if (clickedButton === 'Pagar') {
      // Para "Pagar Directo" necesitamos todos los campos
      requiredFields.push('buyerEmail', 'direccion');
    } else if (clickedButton === 'Pagar Apartados') {
      // Para "Pagar Apartados" necesitamos correo electrónico y dirección.
      requiredFields.push('buyerEmail', 'direccion');
    }
    
    // Verificar si el método de pago es transferencia y necesita comprobante
    if (formValues.paymentMethod === 'transfer' && !previewUrl) {
      return false;
    }
    
    // Verifique todos los campos obligatorios
    return requiredFields.every(field => 
      formValues[field as keyof PaymentFormData] && 
      String(formValues[field as keyof PaymentFormData]).trim() !== ''
    );
  };

  const submissionHandler = async (): Promise<void> => {
    setIsSearching(true);
    try {
      if (!isFormValid()) {
        console.log("Form validation failed");
        form.trigger(); // Validación de disparadores para mostrar mensajes de error
        setIsSearching(false);
        return;
      }
      
      // Obtener los datos del formulario
      const formData = form.getValues();
      
      console.log(`[PaymentModal.tsx] Processing submission with button type: ${clickedButton}`);
      
      // Store the button type in the form data for later use
      formData.clickedButtonType = clickedButton;
      
      // Ensure payment proof is included in the form data if it exists
      if (previewUrl && formData.paymentMethod === 'transfer') {
        formData.paymentProof = previewUrl;
      }

      // Store suspicious activity report in the form data
      const reporteSospechoso = form.getValues('reporteSospechoso');
      if (reporteSospechoso && reporteSospechoso.trim() !== '') {
        formData.reporteSospechoso = reporteSospechoso.trim();
        console.log("[PaymentModal.tsx] Suspicious activity report added to form data:", reporteSospechoso);
      }
      
      // Submit the form data first to complete the payment process
      await handleSubmit();
      
      // After payment is completed, ensure the receipt is saved automatically
      if (voucherRef.current && formData.participantId) {
        // Get the seller UUID from the cedula if needed
        let sellerUuid = SELLER_ID;
        
        if (!SELLER_ID.includes('-')) { // Not a UUID format
          console.log('[PaymentModal.tsx] SELLER_ID appears to be a cedula, looking up UUID');
          const uuid = await getSellerUuidFromCedula(SELLER_ID);
          
          if (uuid) {
            console.log('[PaymentModal.tsx] Found seller UUID for cedula:', uuid);
            sellerUuid = uuid;
          } else {
            console.error('[PaymentModal.tsx] Failed to find seller UUID for cedula:', SELLER_ID);
          }
        }
        
        const raffleDetails = {
          title: organization?.organization_name || 'Rifa',
          price: price
        };
        
        console.log('[PaymentModal.tsx] Ensuring receipt is saved automatically for participant:', formData.participantId);
        
        // Use our new function to ensure receipt is saved
        const receiptUrl = await ensureReceiptSavedForParticipant(
          voucherRef,
          raffleDetails,
          formData.participantId,
          RAFFLE_ID,
          sellerUuid
        );
        
        if (receiptUrl) {
          formData.paymentReceiptUrl = receiptUrl;
          console.log('[PaymentModal.tsx] Receipt saved automatically with URL:', receiptUrl);
        }
      } else {
        // Fallback to the existing method
        const imageUrl = await saveVoucherForAllNumbers(formData);
        
        if (imageUrl) {
          formData.paymentReceiptUrl = imageUrl;
        }
      }
      
      // Complete the payment process with updated form data
      onComplete(formData);
      
    } finally {
      setIsSearching(false);
    }
  };

  const handleCloseModal = (): void => {
    console.log("[PaymentModal.tsx] Cerrar modalidad de pago y compensar selecciones");
    clearSelectionState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
      <DialogContent className="sm:max-w-md md:max-w-xl min-h-[85vh] max-h-[90vh] flex flex-col bg-white/20 backdrop-blur-md rounded-xl border-0 shadow-xl">
        <Card className="bg-transparent border-0 shadow-none">
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
        <div ref={voucherRef} style={{ display: 'none' }}>
          {/* Hidden voucher container for automatic saving */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
export type { PaymentFormData };
