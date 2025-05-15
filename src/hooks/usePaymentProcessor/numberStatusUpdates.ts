
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

    // Primero, verifica si alguno de los números ya existe y pertenece a otro participante
    const numbersInts = numbers.map(numStr => parseInt(numStr, 10));
    const { data: existingNumbers, error: checkError } = await supabase
      .from('raffle_numbers')
      .select('number, participant_id, status')
      .eq('raffle_id', raffleId)
      .in('number', numbersInts);

    if (checkError) {
      console.error('❌ Error al verificar la existencia de números:', checkError);
      throw new Error('Error al verificar la disponibilidad de números');
    }

    // Verificar si algún número ya pertenece a otro participante
    const conflictingNumbers = existingNumbers
      ?.filter(n => n.participant_id !== participantId && n.status === 'sold')
      .map(n => n.number.toString());

    if (conflictingNumbers && conflictingNumbers.length > 0) {
      console.error('❌ Números ya reservados por otro participante:', conflictingNumbers);
      toast(`Error: Los números ${conflictingNumbers.join(', ')} ya han sido reservados o vendidos por otro participante. Por favor elija otros números.`);
      // Devuelve los números conflictivos para que la UI pueda manejar apropiadamente
      return { success: false, conflictingNumbers };
    }

    // Preparar conjunto de números ya existentes para el participante actual (para evitar duplicados)
    const existingParticipantNumbers = existingNumbers
      ?.filter(n => n.participant_id === participantId)
      .map(n => n.number.toString()) || [];
    
    const existingParticipantNumbersSet = new Set(existingParticipantNumbers);

    console.log(`✅ Números ya existentes para el participante ${participantId}:`, existingParticipantNumbers);

    // Para los números especificados, procesar según corresponda
    const updatePromises = numbers.map(async (numStr) => {
      const num = parseInt(numStr, 10);
      
      // Si el número ya existe para este participante con status "sold", omitir la actualización
      if (existingParticipantNumbersSet.has(num.toString()) && 
          existingNumbers.find(n => n.number.toString() === num.toString() && n.status === 'sold')) {
        console.log(`✅ Número ${numStr} ya vendido al participante ${participantId}, omitiendo actualización`);
        return;
      }
      
      const commonData: {
        status: 'sold';
        seller_id: any;
        participant_id: string;
        payment_approved: boolean;
        reservation_expires_at: null;
        participant_name: string;
        participant_phone: string;
        participant_cedula: string;
        payment_proof?: string;
      } = {
        status: 'sold',
        seller_id: raffleSeller.seller_id,
        participant_id: participantId,
        payment_approved: true,
        reservation_expires_at: null,
        participant_name: participantData.name,
        participant_phone: formattedPhone, 
        participant_cedula: participantData.cedula
      };

      // Store payment proof in the correct field
      if (paymentProofUrl) {
        commonData.payment_proof = paymentProofUrl;
      }

      // Buscar si el número existe en la base de datos para este participante
      const existingNumber = existingNumbers?.find(n => 
        n.number.toString() === numStr && n.participant_id === participantId
      );

      if (existingNumber) {
        // Actualizar registro existente
        console.log(`🔄 Actualizando número ${numStr} para el participante ${participantId}:`, commonData);
        
        const { error } = await supabase
          .from('raffle_numbers')
          .update(commonData)
          .eq('raffle_id', raffleId)
          .eq('number', num)
          .eq('participant_id', participantId);
          
        if (error) {
          console.error(`Error actualizando número ${numStr}:`, error);
          throw error;
        }
      } else {
        // Insertar nuevo registro si no existía
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
    return { success: true };
  } catch (error) {
    console.error("❌ Error en updateNumbersToSold:", error);
    throw error;
  }
};
