
import { toast } from 'sonner';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { UpdateResult, updateNumbersToSold } from './numberStatusUpdates';
import { uploadFile } from '@/lib/utils'; 
import { ValidatedBuyerInfo } from '@/types/participant';
import { createParticipant, getParticipantByPhoneAndRaffle } from '@/utils/participantUtils';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { DEFAULT_ORGANIZATION_ID, STORAGE_BUCKET_RECEIPTS } from '@/lib/constants/ids';
import { supabase } from '@/integrations/supabase/client';

interface HandleCompletePaymentProps {
  raffleSeller: any;
  raffleId: string;
  selectedNumbers: string[];
  refetchRaffleNumbers: () => Promise<any>;
  setPaymentData: (data: PaymentFormData) => void;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  setIsVoucherOpen: (isOpen: boolean) => void;
  allowVoucherPrint: boolean;
  uploadPaymentProof: (file: File) => Promise<string | null>;
  processParticipant: ({ buyerName, buyerPhone, buyerEmail, buyerCedula, direccion, sugerencia_producto, nota }: { buyerName: string; buyerPhone: string; buyerEmail: string; buyerCedula: string; direccion: string; sugerencia_producto: string; nota: string; }) => Promise<{ participantId: string | null; validatedBuyerData: ValidatedBuyerInfo; }>;
  supabase: any;
  debugMode?: boolean;
}

export interface ConflictResult {
  success: boolean;
  conflictingNumbers?: string[];
  message?: string;
}

export const handleCompletePayment = ({ 
  raffleSeller, 
  raffleId, 
  selectedNumbers, 
  refetchRaffleNumbers, 
  setPaymentData, 
  setIsPaymentModalOpen, 
  setIsVoucherOpen,
  allowVoucherPrint,
  uploadPaymentProof, 
  processParticipant,
  supabase,
  debugMode = false 
}) => {
  return async (
    formData: PaymentFormData
  ): Promise<ConflictResult | void> => {
    const debugLog = (context: string, data: any) => {
      if (debugMode) {
        console.log(`[DEBUG - completePayment - ${context}]:`, data);
      }
    };

    if (selectedNumbers.length === 0) {
      toast.error('Please select at least one number');
      return { success: false };
    }

    debugLog('Starting payment completion process', { 
      formData, 
      selectedNumbers 
    });

    try {
      // Upload payment proof if present
      let paymentProofUrl = null;
      if (formData.paymentProof) {
        paymentProofUrl = await uploadPaymentProof(formData.paymentProof);
      }

      debugLog('Payment proof upload result', paymentProofUrl);

      // Process or create participant
      const { participantId, validatedBuyerData } = await processParticipant({
        buyerName: formData.buyerName,
        buyerPhone: formData.buyerPhone,
        buyerEmail: formData.buyerEmail || "",
        buyerCedula: formData.buyerCedula,
        direccion: formData.direccion || "",
        sugerencia_producto: formData.sugerenciaProducto || "",
        nota: formData.nota || "",
      });

      debugLog('Participant processing result', { 
        participantId, 
        validatedBuyerData 
      });

      if (!participantId) {
        throw new Error('Failed to create participant record');
      }

      // Update the numbers to sold status
      const result = await updateNumbersToSold({
        numbers: selectedNumbers,
        participantId,
        paymentProofUrl,
        raffleNumbers: [],
        raffleSeller,
        raffleId,
        paymentMethod: formData.paymentMethod,
        clickedButtonType: formData.clickedButtonType // Pass clickedButtonType here
      });

      debugLog('Update numbers result', result);

      if (!result.success) {
        if (result.conflictingNumbers) {
          debugLog('Conflict detected during number update', result.conflictingNumbers);
          return result;
        }
        throw new Error('Failed to update numbers in database');
      }

      // Refresh raffle numbers data
      await refetchRaffleNumbers();

      // Prepare payment data for the receipt/voucher
      const paymentDataForReceipt: PaymentFormData = {
        ...formData,
        participantId,
        sellerId: raffleSeller.seller_id,
        // Include validated data for display
        buyerName: validatedBuyerData.name,
        buyerPhone: validatedBuyerData.phone,
        buyerCedula: validatedBuyerData.cedula,
        buyerEmail: validatedBuyerData.email || "",
        direccion: validatedBuyerData.direccion || "",
        sugerenciaProducto: validatedBuyerData.sugerencia_producto || "",
        // Set payment receipt URL if generated
        paymentReceiptUrl: formData.paymentReceiptUrl || ""
      };

      debugLog('Payment data prepared for receipt', paymentDataForReceipt);

      // Set payment data for receipt generation
      setPaymentData(paymentDataForReceipt);

      // Close payment modal
      setIsPaymentModalOpen(false);

      // Show the voucher modal only if allowed
      setTimeout(() => {
        debugLog('Opening voucher modal', { allowVoucherPrint });
        setIsVoucherOpen(true);
      }, 500);

      // Return success
      return { success: true };
    } catch (error) {
      debugLog('Error in handleCompletePayment', error);
      console.error('Error in completePayment:', error);
      toast.error('Error processing payment. Please try again.');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };
};

// Create utility function for payment proof upload
export const uploadPaymentProof = async (file: File): Promise<string | null> => {
  if (!file) return null;
  
  try {
    console.log('Uploading payment proof:', file.name);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment_proofs')
      .upload(`${Date.now()}_${file.name}`, file);
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage
      .from('payment_proofs')
      .getPublicUrl(uploadData.path);
    
    console.log('Payment proof uploaded:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    return null;
  }
};
