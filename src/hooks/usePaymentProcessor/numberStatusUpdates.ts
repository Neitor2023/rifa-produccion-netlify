
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumber } from '@/utils/phoneUtils';

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

  // Validación de parámetros críticos
  if (!participantId) {
    console.error('❌ Error: participantId no está definido');
    throw new Error('No se puede actualizar números sin ID de participante');
  }

  if (!raffleSeller?.seller_id) {
    console.error('❌ Error: seller_id no está definido');
    throw new Error('No se puede actualizar números sin ID de vendedor');
  }

  if (!raffleId) {
    console.error('❌ Error: raffleId no está definido');
    throw new Error('No se puede actualizar números sin ID de rifa');
  }

  if (!numbers || numbers.length === 0) {
    console.error('❌ Error: No hay números para actualizar');
    throw new Error('No se han proporcionado números para actualizar');
  }

  try {
    // Trae los datos del participante para rellenar los campos
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .select('name, phone, email, cedula, direccion')
      .eq('id', participantId)
      .single();

    if (participantError) {
      console.error('❌ Error obteniendo datos del participante:', participantError);
      throw new Error('No se encontraron datos del participante');
    }

    if (!participantData) {
      console.error('❌ No se encontraron datos del participante con ID:', participantId);
      throw new Error('No se encontraron datos del participante');
    }

    // Asegúrese de que el teléfono esté en formato internacional
    const formattedPhone = formatPhoneNumber(participantData.phone);

    // Para los números especificados, solo actualizar los que pertenecen al participante actual
    // o los que son nuevos para este participante
    const updatePromises = numbers.map(async (numStr) => {
      const num = parseInt(numStr, 10);
      // Buscar si el número existe en la base de datos
      const existingNumber = raffleNumbers.find(n => n.number === numStr);

      const commonData = {
        status: 'sold' as const,
        seller_id: raffleSeller.seller_id,
        participant_id: participantId,
        payment_approved: true,
        reservation_expires_at: null,
        participant_name: participantData.name,
        participant_phone: formattedPhone, // Use formatted phone number
        participant_cedula: participantData.cedula
      };

      // Fix for issue 2.2: Correctly handle proof vs. receipt
      if (paymentProofUrl) {
        // Store the payment proof in the payment_proof field, not payment_receipt_url
        commonData.payment_proof = paymentProofUrl;
      }

      if (existingNumber) {
        // **Actualizar** registro existente
        console.log(`🔄 Actualizando número ${numStr}:`, commonData);
        
        // Check if the number belongs to the current participant if in "Pagar Apartados" flow
        if (existingNumber.status === 'reserved' && existingNumber.participant_id !== participantId) {
          console.warn(`⚠️ Número ${numStr} está reservado por otro participante, se omite la actualización`);
          return; // Skip updating this number
        }

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
          number: num,
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
  } catch (error) {
    console.error("❌ Error en updateNumbersToSold:", error);
    throw error;
  }
};
