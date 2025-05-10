
import { PostgrestResponse } from '@supabase/supabase-js';

interface UseFraudReportingProps {
  supabase: any;
  debugMode?: boolean;
}

export const useFraudReporting = ({
  supabase,
  debugMode = false
}: UseFraudReportingProps) => {
  console.log("🔄 useFraudReporting: Entry point");
  
  const handleFraudReport = async (
    reportMessage: string, 
    participantId: string,
    raffleId: string,
    sellerId: string
  ) => {
    console.log("🔄 handleFraudReport: Processing report", {
      participantId,
      raffleId,
      sellerId,
      hasMessage: !!reportMessage
    });
    
    try {
      // Check if a report already exists for this participant
      const { data: existingReport }: PostgrestResponse<any> = await supabase
        .from('fraud_reports')
        .select('id')
        .match({
          participant_id: participantId,
          raffle_id: raffleId,
          seller_id: sellerId
        })
        .maybeSingle();
      
      if (!existingReport) {
        // No existing report found, create a new one
        if (debugMode) {
          console.log('Creating new fraud report:', {
            raffleId,
            sellerId,
            participantId,
            reportMessage
          });
        }
        
        const { error: fraudError } = await supabase
          .from('fraud_reports')
          .insert({
            raffle_id: raffleId,
            seller_id: sellerId,
            participant_id: participantId,
            mensaje: reportMessage,
            estado: 'pendiente'
          });

        if (fraudError) {
          console.error('Error saving fraud report:', fraudError);
        } else {
          console.log("✅ Fraud report created successfully");
        }
      } else {
        console.log("⚠️ Fraud report already exists for this participant, skipping duplicate insert");
      }
    } catch (error) {
      console.error('Error handling fraud report:', error);
    }
    
    console.log("✅ handleFraudReport: Report processing completed");
  };
  
  console.log("✅ useFraudReporting: Exit");
  
  return { handleFraudReport };
};
