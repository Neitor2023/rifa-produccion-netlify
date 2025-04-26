import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/components/PaymentModal';
import { ValidatedBuyerInfo } from '@/types/participant';

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

  const uploadPaymentProof = async (paymentProof: File | string | null): Promise<string | null> => {
    if (!paymentProof || !(paymentProof instanceof File)) {
      return typeof paymentProof === 'string' ? paymentProof : null;
    }
    
    try {
      const fileName = `${raffleId}_${Date.now()}_${paymentProof.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(fileName);
        
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      throw error;
    }
  };

  const processParticipant = async (data: PaymentFormData): Promise<string | null> => {
    try {
      console.log("🔵 Processing participant with data:", data);

      // Check for existing participant
      const { data: existingParticipant, error: searchError } = await supabase
        .from('participants')
        .select('id, name, phone, cedula, direccion, sugerencia_producto')
        .eq('phone', data.buyerPhone)
        .eq('raffle_id', raffleId)
        .maybeSingle();

      if (searchError) {
        console.error("Error searching for existing participant:", searchError);
      }

      let participantId: string | null = null;

      if (existingParticipant) {
        participantId = existingParticipant.id;
        console.log("✅ Found existing participant:", existingParticipant);

        const updateData: any = {
          name: data.buyerName
        };

        if (data.buyerCedula) updateData.cedula = data.buyerCedula;
        if (data.direccion) updateData.direccion = data.direccion;
        if (data.sugerenciaProducto) updateData.sugerencia_producto = data.sugerenciaProducto;

        const { error: updateError } = await supabase
          .from('participants')
          .update(updateData)
          .eq('id', participantId);

        if (updateError) {
          console.error("Error updating participant:", updateError);
          throw updateError;
        }
      } else {
        console.log("🆕 Creating new participant");

        const { data: newParticipant, error: participantError } = await supabase
          .from('participants')
          .insert({
            name: data.buyerName,
            phone: data.buyerPhone,
            email: data.buyerEmail || '',
            cedula: data.buyerCedula,
            direccion: data.direccion || null,
            sugerencia_producto: data.sugerenciaProducto || null,
            raffle_id: raffleId,
            seller_id: raffleSeller.seller_id
          })
          .select('id')
          .single();

        if (participantError) {
          console.error("Error creating new participant:", participantError);
          throw participantError;
        }

        participantId = newParticipant.id;
      }

      // Handle suspicious activity report if present and participantId exists
      if (data.reporteSospechoso && participantId) {
        // Check if a report already exists for this participant and raffle
        const { data: existingReport } = await supabase
          .from('fraud_reports')
          .select('id')
          .match({
            participant_id: participantId,
            raffle_id: raffleId,
            seller_id: raffleSeller.seller_id
          })
          .maybeSingle();

        if (!existingReport) {
          const { error: fraudError } = await supabase
            .from('fraud_reports')
            .insert({
              raffle_id: raffleId,
              seller_id: raffleSeller.seller_id,
              participant_id: participantId,
              mensaje: data.reporteSospechoso,
              estado: 'pendiente'
            });

          if (fraudError) {
            console.error('Error saving fraud report:', fraudError);
          } else {
            console.log("✅ Saved fraud report for participant:", participantId);
          }
        }
      }

      return participantId;
    } catch (error) {
      console.error('Error processing participant:', error);
      throw error;
    }
  };

  const updateNumbersToSold = async (
    numbers: string[],
    participantId: string,
    paymentProofUrl: string | null,
    raffleNumbers: any[]
  ) => {
    console.log("🔵 Updating numbers to sold:", {
      numbers,
      participantId,
      paymentProofUrl
    });

    const { data: participantData } = await supabase
      .from('participants')
      .select('name, phone, cedula, direccion, sugerencia_producto')
      .eq('id', participantId)
      .single();

    const updatePromises = numbers.map(async (numStr) => {
      const existingNumber = raffleNumbers?.find(n => n.number === numStr);

      if (existingNumber) {
        const proofToUse = paymentProofUrl || existingNumber.payment_proof;
        
        const updateData = {
          status: 'sold',
          seller_id: raffleSeller.seller_id,
          participant_id: participantId,
          payment_proof: proofToUse,
          payment_approved: true,
          reservation_expires_at: null,
          participant_name: participantData?.name,
          participant_phone: participantData?.phone,
          participant_cedula: participantData?.cedula
        };

        console.log(`🔄 Updating number ${numStr} with data:`, updateData);

        const { error } = await supabase
          .from('raffle_numbers')
          .update(updateData)
          .eq('id', existingNumber.id);

        if (error) {
          console.error(`Error updating number ${numStr}:`, error);
          throw error;
        }
      }
    });

    await Promise.all(updatePromises);
    console.log("✅ All numbers updated to sold status");
  };

  return {
    uploadPaymentProof,
    processParticipant,
    updateNumbersToSold
  };
}
