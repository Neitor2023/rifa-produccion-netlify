
import { supabase } from '@/integrations/supabase/client';

interface UpdateNumbersToSoldProps {
  numbers: string[];
  participantId: string;
  paymentProofUrl: string | null;
  raffleNumbers: any[];
  raffleSeller: any;
  raffleId: string; // Added missing raffleId parameter
}

export const updateNumbersToSold = async ({
  numbers,
  participantId,
  paymentProofUrl,
  raffleNumbers,
  raffleSeller,
  raffleId // Added missing raffleId parameter
}: UpdateNumbersToSoldProps) => {
  console.log("🔵 numberStatusUpdates.ts: Actualización de números a vendidos:", {
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
