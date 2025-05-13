
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { toast } from 'sonner';

interface UpdateNumbersToSoldProps {
  numbers: string[];
  participantId: string;
  paymentProofUrl: string | null;
  raffleNumbers: any[];
  raffleSeller: any;
  raffleId: string;
}

export const updateNumbersToSold = async ({
  numbers,
  participantId,
  paymentProofUrl,
  raffleNumbers,
  raffleSeller,
  raffleId
}: UpdateNumbersToSoldProps) => {
  console.log("🔵 numberStatusUpdates.ts: Actualización de números a vendidos:", {
    numbers,
    participantId,
    paymentProofUrl
  });

  // Trae los datos del participante para rellenar los campos
  const { data: participantData } = await supabase
    .from('participants')
    .select('name, phone, email, cedula, direccion')
    .eq('id', participantId)
    .single();

  if (!participantData) {
    throw new Error('No se encontraron datos del participante');
  }

  // Ensure phone is in international format
  const formattedPhone = formatPhoneNumber(participantData.phone);

  // Track successful and failed operations
  const successfulNumbers: string[] = [];
  const failedNumbers: string[] = [];

  const updatePromises = numbers.map(async (numStr) => {
    try {
      // First check if the number already exists in the database
      // (even if not in our local raffleNumbers array)
      const { data: existingDbNumber, error: fetchError } = await supabase
        .from('raffle_numbers')
        .select('id, status')
        .eq('raffle_id', raffleId)
        .eq('number', parseInt(numStr, 10))
        .maybeSingle();

      if (fetchError) {
        console.error(`Error verificando existencia del número ${numStr}:`, fetchError);
        failedNumbers.push(numStr);
        return;
      }

      const existingNumber = raffleNumbers.find(n => n.number === numStr);

      const commonData = {
        status: 'sold' as const,
        seller_id: raffleSeller.seller_id,
        participant_id: participantId,
        payment_proof: paymentProofUrl || existingNumber?.payment_proof || null,
        payment_approved: true,
        reservation_expires_at: null,
        participant_name: participantData.name,
        participant_phone: formattedPhone, // Use formatted phone number
        participant_cedula: participantData.cedula
      };

      // If number exists in database
      if (existingDbNumber) {
        // Only update if it's not already sold
        if (existingDbNumber.status !== 'sold') {
          console.log(`🔄 Actualizando número ${numStr}:`, commonData);
          const { error } = await supabase
            .from('raffle_numbers')
            .update(commonData)
            .eq('id', existingDbNumber.id);
          
          if (error) {
            console.error(`Error actualizando número ${numStr}:`, error);
            failedNumbers.push(numStr);
            return;
          }
          successfulNumbers.push(numStr);
        } else {
          // Already sold by someone else
          console.warn(`⚠️ Número ${numStr} ya está vendido. Saltando.`);
          failedNumbers.push(numStr);
        }
      } else if (existingNumber) {
        // **Actualizar** registro existente en nuestro array local
        console.log(`🔄 Actualizando número ${numStr}:`, commonData);
        const { error } = await supabase
          .from('raffle_numbers')
          .update(commonData)
          .eq('id', existingNumber.id);
          
        if (error) {
          console.error(`Error actualizando número ${numStr}:`, error);
          failedNumbers.push(numStr);
          return;
        }
        successfulNumbers.push(numStr);
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
          failedNumbers.push(numStr);
          return;
        }
        successfulNumbers.push(numStr);
      }
    } catch (err) {
      console.error(`Error procesando número ${numStr}:`, err);
      failedNumbers.push(numStr);
    }
  });

  await Promise.all(updatePromises);
  
  // Show appropriate notifications
  if (successfulNumbers.length > 0) {
    console.log("✅ Números actualizados/insertados exitosamente:", successfulNumbers);
  }
  
  if (failedNumbers.length > 0) {
    console.error("❌ Algunos números no pudieron ser procesados:", failedNumbers);
    toast.error(`No se pudieron procesar ${failedNumbers.length} número(s): ${failedNumbers.join(', ')}`);
  }
  
  return {
    successful: successfulNumbers,
    failed: failedNumbers
  };
};
