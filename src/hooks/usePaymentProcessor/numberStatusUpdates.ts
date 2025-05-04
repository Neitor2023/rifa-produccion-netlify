
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { SELLER_ID } from '@/lib/constants'; // Import the constant SELLER_ID

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
  console.log("🔵 numberStatusUpdates.ts:21: Actualización de números a vendidos:", {
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
  
  // Asegurar formato internacional del teléfono
  const formattedPhone = formatPhoneNumber(participantData.phone);
  console.log("🔵 numberStatusUpdates.ts:38: Teléfono del participante formateado:", formattedPhone);
  
  // Usar el seller_id del raffleSeller en lugar del constante SELLER_ID
  console.log("🔵 numberStatusUpdates.ts:41: Usando seller_id del raffleSeller:", raffleSeller.seller_id);

  const updatePromises = numbers.map(async (numStr) => {
    const existingNumber = raffleNumbers.find(n => n.number === numStr);

    const commonData = {
      status: 'sold' as const,
      seller_id: raffleSeller.seller_id, // Usar el seller_id del raffleSeller
      participant_id: participantId,
      payment_proof: paymentProofUrl || existingNumber?.payment_proof || null,
      payment_approved: true,
      reservation_expires_at: null,
      participant_name: participantData.name,
      participant_phone: formattedPhone, // Usamos el teléfono formateado
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
