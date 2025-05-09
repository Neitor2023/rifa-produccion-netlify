
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';

interface UseNumberValidationProps {
  numbers: any[];
  selectedNumbers: string[];
  raffleSeller: {
    id: string;
    raffle_id: string;
    seller_id: string;
  };
  onProceedToPayment: (numbers: string[], participantData?: ValidatedBuyerInfo, clickedButton?: string) => Promise<void>;
  debugMode?: boolean;
  clickedPaymentButton?: string;
  setClickedPaymentButton: (button: string | undefined) => void;
}

export const useNumberValidation = ({
  numbers,
  selectedNumbers,
  raffleSeller,
  onProceedToPayment,
  debugMode = false,
  clickedPaymentButton,
  setClickedPaymentButton
}: UseNumberValidationProps) => {
  console.log("🔄 useNumberValidation: Entry point with selected numbers:", selectedNumbers.length);
  
  // Context hooks
  const { setBuyerInfo } = useBuyerInfo();
  
  const handleProceedToPayment = async (buttonType: string) => {
    if (debugMode) {
      console.log(`useNumberValidation: handleProceedToPayment called with button type: ${buttonType}`);
    }
    
    setClickedPaymentButton(buttonType);
    
    if (selectedNumbers.length === 0) {
      toast.error('Select at least one number to pay');
      return;
    }
    await onProceedToPayment(selectedNumbers, undefined, buttonType);
  };
  
  const handleValidationSuccess = async (
    validatedNumber: string,
    participantId: string,
    buyerInfo?: ValidatedBuyerInfo
  ) => {
    console.log("🔄 useNumberValidation: handleValidationSuccess called", {
      validatedNumber,
      participantId,
      buyerInfo: buyerInfo ? { id: buyerInfo.id, name: buyerInfo.name } : null
    });
    
    if (buyerInfo) {
      if (debugMode) {
        console.log("useNumberValidation: Received validated buyer information:", {
          name: buyerInfo.name,
          phone: buyerInfo.phone,
          cedula: buyerInfo.cedula,
          id: buyerInfo.id,
          email: buyerInfo.email // Log email
        });
      }
      
      // Update context state
      setBuyerInfo(buyerInfo);
    }
    
    if (participantId && buyerInfo) {
      await onProceedToPayment(selectedNumbers, buyerInfo, clickedPaymentButton);
    } else {
      await handleNumberValidation(validatedNumber);
    }
    
    console.log("✅ useNumberValidation: handleValidationSuccess completed");
  };
  
  const handleParticipantValidation = async (participantId: string) => {
    console.log("🔄 useNumberValidation: handleParticipantValidation called", { participantId });
    
    if (debugMode) {
      console.log('useNumberValidation: Querying Supabase for reserved numbers with participant ID:', participantId);
    }
    
    const { data: reservedNumbers, error } = await supabase
      .from('raffle_numbers')
      .select('number')
      .eq('participant_id', participantId)
      .eq('status', 'reserved')
      .eq('raffle_id', raffleSeller.raffle_id)
      .eq('seller_id', raffleSeller.seller_id);
    
    if (error) {
      console.error('useNumberValidation: Error getting reserved numbers:', error);
      toast.error('Error looking up reserved numbers');
      return;
    }
    
    if (reservedNumbers && reservedNumbers.length > 0) {
      const allReservedNumbers = reservedNumbers.map(n => 
        n.number.toString().padStart(2, '0')
      );
      
      if (debugMode) {
        console.log('useNumberValidation: Reserved numbers found:', allReservedNumbers);
      }
      
      toast.success(`${allReservedNumbers.length} number(s) found`);
      await onProceedToPayment(allReservedNumbers);
    } else {
      if (debugMode) {
        console.log('useNumberValidation: No reserved numbers found with direct query');
      }
      
      toast.error('❗ No reserved numbers found for this participant.');
    }
    
    console.log("✅ useNumberValidation: handleParticipantValidation completed");
  };
  
  const handleNumberValidation = async (validatedNumber: string) => {
    console.log("🔄 useNumberValidation: handleNumberValidation called", { validatedNumber });
    
    const number = numbers.find(n => n.number === validatedNumber && n.status === 'reserved');
    
    if (!number) {
      toast.error('Number not found');
      return;
    }
    
    toast.success('Validation successful');
    await onProceedToPayment([validatedNumber]);
    
    console.log("✅ useNumberValidation: handleNumberValidation completed");
  };
  
  console.log("✅ useNumberValidation: Exit");
  
  return {
    handleProceedToPayment,
    handleValidationSuccess,
    handleParticipantValidation,
    handleNumberValidation
  };
};
