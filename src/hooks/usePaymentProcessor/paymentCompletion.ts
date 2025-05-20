
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/types/payment';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { uploadPaymentProof } from './fileUpload';
import { processParticipant } from './participantProcessing';
import { updateNumbersToSold } from './numberStatusUpdates';
import { RaffleNumber } from '@/lib/constants/types';

interface UsePaymentCompletionProps {
  raffleSeller: any;
  raffleId: string;
  setValidatedBuyerData?: (data: ValidatedBuyerInfo) => void;
  debugMode?: boolean;
}

export function usePaymentCompletion({
  raffleSeller,
  raffleId,
  setValidatedBuyerData,
  debugMode = false
}: UsePaymentCompletionProps) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PaymentCompletion - ${context}]:`, data);
    }
  };

  return {
    uploadPaymentProof: (paymentProof: File | string | null): Promise<string | null> => 
      uploadPaymentProof({ paymentProof, raffleId, debugLog }),
    processParticipant: (data: PaymentFormData): Promise<string | null> => 
      processParticipant({ data, raffleId, debugLog }),
    updateNumbersToSold: (
      numbers: string[],
      participantId: string,
      paymentProofUrl: string | null,
      raffleNumbers: RaffleNumber[]
    ) => updateNumbersToSold({ 
      numbers, 
      participantId, 
      paymentProofUrl, 
      raffleNumbers, 
      raffleSeller,
      raffleId 
    })
  };
}
