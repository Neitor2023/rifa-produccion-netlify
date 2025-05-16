
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

interface UpdateResult {
  success: boolean;
  conflictingNumbers?: string[];
}

export const updateNumbersToSold = async ({
  numbers,
  participantId,
  paymentProofUrl,
  raffleNumbers,
  raffleSeller,
  raffleId
}: UpdateNumbersToSoldProps): Promise<UpdateResult> => {
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

    // Verificar si algún número ya pertenece a otro participante con estado "sold"
    const conflictingNumbers = existingNumbers
      ?.filter(n => n.participant_id !== participantId && n.status === 'sold')
      .map(n => n.number.toString());

    if (conflictingNumbers && conflictingNumbers.length > 0) {
      console.error('❌ Números ya reservados por otro participante:', conflictingNumbers);
      return { success: false, conflictingNumbers };
    }

    // Para cada número especificado, actualizar o insertar según corresponda
    const updatePromises = numbers.map(async (numStr) => {
      const num = parseInt(numStr, 10);
      
      // Datos comunes para actualización o inserción
      const commonData: {
        status: 'sold';
        seller_id: any;
        participant_id: string;
        payment_approved: boolean;
        reservation_expires_at: null;
        participant_name: string;
        participant_phone: string;
        participant_cedula: string;
        payment_proof?: string;  // For the transfer proof image
        payment_receipt_url?: string;  // For the generated receipt
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

      // Store payment proof in the correct field if available
      if (paymentProofUrl) {
        commonData.payment_proof = paymentProofUrl;
      }
      
      // Check if this number already exists for this participant
      const existingNumber = existingNumbers?.find(n => 
        n.number === num && n.participant_id === participantId
      );
      
      if (existingNumber) {
        // Update existing record for this participant
        console.log(`🔄 Actualizando número ${numStr} para el participante ${participantId}:`, commonData);
        
        const { error } = await supabase
          .from('raffle_numbers')
          .update(commonData)
          .eq('raffle_id', raffleId)
          .eq('number', num)
          .eq('participant_id', participantId);
          
        if (error) {
          // If it's a unique constraint violation, the number might already exist
          if (error.code === '23505') {
            console.warn(`⚠️ Número ${numStr} ya existe, verificando propietario`);
            
            // Check if it's owned by another participant
            const { data: ownerCheck } = await supabase
              .from('raffle_numbers')
              .select('participant_id')
              .eq('raffle_id', raffleId)
              .eq('number', num)
              .single();
              
            if (ownerCheck && ownerCheck.participant_id !== participantId) {
              console.error(`❌ El número ${numStr} ya pertenece a otro participante: ${ownerCheck.participant_id}`);
              return { number: numStr, conflict: true };
            }
          } else {
            console.error(`❌ Error actualizando número ${numStr}:`, error);
            return { number: numStr, error };
          }
        }
      } else {
        // Insert new record if it didn't exist
        const insertData = {
          ...commonData,
          raffle_id: raffleId,
          number: num,
        };
        
        console.log(`🆕 Insertando nuevo número ${numStr}:`, insertData);
        
        try {
          const { error } = await supabase
            .from('raffle_numbers')
            .insert(insertData);
            
          if (error) {
            // If it's a unique constraint violation, the number might already exist
            if (error.code === '23505') {
              console.warn(`⚠️ Intento de inserción duplicada para número ${numStr}, verificando propietario`);
              
              // Check if it's owned by another participant
              const { data: ownerCheck } = await supabase
                .from('raffle_numbers')
                .select('participant_id')
                .eq('raffle_id', raffleId)
                .eq('number', num)
                .single();
                
              if (ownerCheck && ownerCheck.participant_id !== participantId) {
                console.error(`❌ El número ${numStr} ya pertenece a otro participante: ${ownerCheck.participant_id}`);
                return { number: numStr, conflict: true };
              } else if (ownerCheck && ownerCheck.participant_id === participantId) {
                // Already owned by this participant, update instead
                console.log(`🔄 El número ${numStr} ya pertenece a este participante, actualizando`);
                
                const { error: updateError } = await supabase
                  .from('raffle_numbers')
                  .update(commonData)
                  .eq('raffle_id', raffleId)
                  .eq('number', num);
                  
                if (updateError) {
                  console.error(`❌ Error actualizando número ${numStr}:`, updateError);
                  return { number: numStr, error: updateError };
                }
              }
            } else {
              console.error(`❌ Error insertando número ${numStr}:`, error);
              return { number: numStr, error };
            }
          }
        } catch (insertError) {
          console.error(`❌ Excepción al insertar número ${numStr}:`, insertError);
          return { number: numStr, error: insertError };
        }
      }
      
      return { number: numStr, success: true };
    });

    // Execute all updates and check for conflicts
    const results = await Promise.all(updatePromises);
    const conflicts = results.filter(r => r && 'conflict' in r && r.conflict).map(r => r.number);
    
    if (conflicts.length > 0) {
      return { success: false, conflictingNumbers: conflicts };
    }
    
    console.log("✅ Todos los números actualizados/insertados al estado vendido");
    return { success: true };
  } catch (error) {
    console.error("❌ Error en updateNumbersToSold:", error);
    throw error;
  }
};
