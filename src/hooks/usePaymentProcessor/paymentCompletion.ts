import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/components/PaymentModal';
import { ValidatedBuyerInfo } from '@/types/participant';
import { formatPhoneNumber } from '@/utils/phoneUtils';

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
      console.log("🔵 Processing participant with data:", {
        name: data.buyerName,
        phone: data.buyerPhone,
        cedula: data.buyerCedula
      });
      
      const formattedPhone = formatPhoneNumber(data.buyerPhone);
      
      const { data: newParticipant, error: participantError } = await supabase
        .from('participants')
        .insert({
          name: data.buyerName,
          phone: formattedPhone,
          email: data.buyerEmail,
          cedula: data.buyerCedula,
          direccion: data.direccion || null,
          sugerencia_producto: data.sugerenciaProducto || null,
          nota: data.nota || null,
          raffle_id: raffleId,
          seller_id: raffleSeller.seller_id
        })
        .select('id')
        .single();

      if (participantError) {
        console.error("Error creating new participant:", participantError);
        throw participantError;
      }

      return newParticipant.id;
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
    console.log("🔵 hooks/usePaymentProcessor/paymentCompletion.ts: Actualización de números a vendidos:", {
      numbers,
      participantId,
      paymentProofUrl
    });
  
    // Trae los datos del participante para rellenar los campos
    const { data: participantData } = await supabase
      .from('participants')
      .select('name, phone, cedula, direccion')
      .eq('id', participantId)
      .single();
  
    if (!participantData) {
      throw new Error('No se encontraron datos del participante');
    }
  
    const updatePromises = numbers.map(async (numStr) => {
      const existingNumber = raffleNumbers.find(n => n.number === numStr);
  
      const commonData = {
        status: 'sold' as const,
        seller_id: raffleSeller.seller_id,
        participant_id: participantId,
        payment_proof: paymentProofUrl || existingNumber?.payment_proof || null,
        payment_approved: true,
        reservation_expires_at: null,
        participant_name: participantData.name,
        participant_phone: participantData.phone,
        participant_cedula: participantData.cedula
      };
  
      if (existingNumber) {
        // **Actualizar** registro existente
        console.log(`🔄 Actualizando número ${numStr}:`, commonData);
        const { error } = await supabase
          .from('raffle_numbers')
          .update(commonData)
          .eq('id', existingNumber.id);
        if (error) {
          console.error(`Error actualizando número ${numStr}:`, error);
          throw error;
        }
  
      } else {
        // **Insertar** nuevo registro si no existía
        const insertData = {
          ...commonData,
          raffle_id: raffleId,
          number: parseInt(numStr, 10),
        };
        console.log(`🆕 Insertando nuevo número ${numStr}:`, insertData);
        const { error } = await supabase
          .from('raffle_numbers')
          .insert(insertData);
        if (error) {
          console.error(`Error insertando número ${numStr}:`, error);
          throw error;
        }
      }
    });
  
    await Promise.all(updatePromises);
    console.log("✅ Todos los números actualizados/insertados al estado vendido");
  };

  return {
    uploadPaymentProof,
    processParticipant,
    updateNumbersToSold
  };
}
