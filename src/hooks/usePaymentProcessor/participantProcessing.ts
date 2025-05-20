
import { supabase } from "@/integrations/supabase/client";
import { PaymentFormData } from "@/types/payment";
import { formatPhoneNumber } from "@/utils/phoneUtils";
import { getSellerUuidFromCedula } from "@/hooks/useRaffleData/useSellerIdMapping";

interface ProcessParticipantProps {
  data: PaymentFormData;
  raffleId: string;
  debugLog: (context: string, data: any) => void;
}

export const processParticipant = async ({
  data,
  raffleId,
  debugLog
}: ProcessParticipantProps): Promise<string | null> => {
  try {
    console.log("🔵 Processing participant with data:", data);
    debugLog('Processing participant', data);
    
    const formattedPhone = formatPhoneNumber(data.buyerPhone);
    
    // Validate and process the sellerId to ensure it's a valid UUID
    let validSellerId: string | null = null;
    
    if (data.sellerId) {
      // Check if the sellerId is already a UUID (contains hyphens and is long enough)
      const isUuid = data.sellerId.includes('-') && data.sellerId.length > 30;
      
      if (isUuid) {
        // Already a UUID, use it directly
        validSellerId = data.sellerId;
        debugLog('Using provided seller UUID', validSellerId);
      } else {
        // Looks like a cedula, try to get the UUID
        try {
          const uuid = await getSellerUuidFromCedula(data.sellerId);
          if (uuid) {
            validSellerId = uuid;
            debugLog('Converted seller cedula to UUID', { cedula: data.sellerId, uuid });
          } else {
            debugLog('Could not find UUID for seller cedula', data.sellerId);
          }
        } catch (err) {
          console.error("Error converting seller cedula to UUID:", err);
          debugLog('Error converting seller cedula', err);
        }
      }
    }
    
    // Verify we have a valid UUID before proceeding
    if (!validSellerId) {
      console.log("⚠️ No valid seller UUID found, participant will be created without seller association");
      debugLog('No valid seller UUID', { originalId: data.sellerId });
    } else {
      debugLog('Using seller_id (verified UUID)', validSellerId);
    }
    
    const { data: existingParticipant, error: searchError } = await supabase
      .from('participants')
      .select('id, name, phone, email, cedula, direccion, sugerencia_producto, nota')
      .eq('phone', formattedPhone)
      .eq('raffle_id', raffleId)
      .maybeSingle();

    if (searchError) {
      console.error("Error searching for existing participant:", searchError);
      debugLog('Search error', searchError);
    }

    let participantId: string | null = null;

    if (existingParticipant) {
      participantId = existingParticipant.id;
      console.log("✅ Found existing participant:", existingParticipant);
      debugLog('Using existing participant', existingParticipant);

      const updateData: any = {
        name: data.buyerName,
        phone: formattedPhone, // Ensuring phone is in international format
        nota: data.nota,
        email: data.buyerEmail || existingParticipant.email || '', // Ensure email is always set or preserved
        cedula: data.buyerCedula || existingParticipant.cedula || null,
        direccion: data.direccion || existingParticipant.direccion || null,
        sugerencia_producto: data.sugerenciaProducto || existingParticipant.sugerencia_producto || null
      };

      // Save seller_id on the participant record - CRITICAL
      if (validSellerId) {
        updateData.seller_id = validSellerId;
        debugLog('Adding seller_id to participant update', validSellerId);
      }

      // Add debug log for email specifically
      console.log("📧 Updating participant with email:", data.buyerEmail || existingParticipant.email || null);
      debugLog('Email being updated to', data.buyerEmail || existingParticipant.email || null);

      const { error: updateError } = await supabase
        .from('participants')
        .update(updateData)
        .eq('id', participantId);

      if (updateError) {
        console.error("Error updating participant:", updateError);
        debugLog('Update error', updateError);
        throw updateError;
      }
    } else {
      console.log("🆕 Creating new participant");
      debugLog('Creating new participant', { 
        name: data.buyerName, 
        phone: formattedPhone,
        email: data.buyerEmail || ''
      });

      const insertData = {
        name: data.buyerName,
        phone: formattedPhone, // Ensuring phone is in international format
        email: data.buyerEmail || '', // Make sure email is included in the insert
        cedula: data.buyerCedula || null,
        direccion: data.direccion || null,
        sugerencia_producto: data.sugerenciaProducto || null,
        nota: data.nota || null,
        raffle_id: raffleId,
        seller_id: validSellerId // Add validated seller_id when creating participant
      };
      
      // Add debug log for email specifically
      console.log("📧 Creating participant with email:", data.buyerEmail || '');
      debugLog('Email being set to', data.buyerEmail || '');
      
      debugLog('Inserting participant data', insertData);

      const { data: newParticipant, error: participantError } = await supabase
        .from('participants')
        .insert(insertData)
        .select('id')
        .single();

      if (participantError) {
        console.error("Error creating new participant:", participantError);
        debugLog('Creation error', participantError);
        throw participantError;
      }

      participantId = newParticipant.id;
      debugLog('New participant created', { id: participantId });
    }

    // Now save the suspicious activity report if provided
    if (data.reporteSospechoso) {
      try {
        console.log("🚨 Saving suspicious activity report:", data.reporteSospechoso);
        debugLog('Saving suspicious report', {
          mensaje: data.reporteSospechoso,
          participant_id: participantId,
          seller_id: validSellerId,
          raffle_id: raffleId
        });
        
        const { error: fraudReportError } = await supabase
          .from('fraud_reports')
          .insert({
            mensaje: data.reporteSospechoso,
            participant_id: participantId,
            seller_id: validSellerId,
            raffle_id: raffleId
          });
          
        if (fraudReportError) {
          console.error("Error saving fraud report:", fraudReportError);
          debugLog('Fraud report error', fraudReportError);
        } else {
          console.log("✅ Fraud report saved successfully");
        }
      } catch (fraudError) {
        console.error("Exception saving fraud report:", fraudError);
        debugLog('Fraud report exception', fraudError);
        // Don't throw here - we don't want to prevent participant creation/update if fraud report fails
      }
    }

    return participantId;
  } catch (error) {
    console.error('Error processing participant:', error);
    debugLog('Process error', error);
    throw error;
  }
};
