
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RaffleNumber } from '@/lib/constants/types';

interface UpdateNumbersToSoldProps {
  numbers: string[];
  selectedNumbers: string[];
  participantId: string;
  paymentProofUrl: string | null;
  raffleNumbers: RaffleNumber[];
  raffleSeller: any;
  raffleId: string;
  paymentMethod?: string;
  clickedButtonType?: string;
  selectedBankId?: string;
  rafflePrice?: number;
}

export async function updateNumbersToSold({
  numbers,
  selectedNumbers,
  participantId,
  paymentProofUrl,
  raffleNumbers,
  raffleSeller,
  raffleId,
  paymentMethod = 'cash',
  clickedButtonType = 'Pagar',
  selectedBankId,
  rafflePrice
}: UpdateNumbersToSoldProps) {
  console.log("[numberStatusUpdates.ts] 🚀 INICIANDO: Actualización de números a vendidos");
  console.log("[numberStatusUpdates.ts] 📋 DATOS RECIBIDOS:", {
    numbersCount: numbers?.length || 0,
    participantId,
    paymentMethod,
    clickedButtonType,
    selectedBankId,
    rafflePrice,
    hasPaymentProofUrl: !!paymentProofUrl
  });

  if (!participantId || participantId.trim() === '') {
    console.error("[numberStatusUpdates.ts] ❌ ERROR CRÍTICO: participantId vacío:", participantId);
    throw new Error('participantId es requerido para actualizar números');
  }

  if (!numbers || numbers.length === 0) {
    console.error("[numberStatusUpdates.ts] ❌ ERROR CRÍTICO: No hay números para actualizar");
    throw new Error('No hay números para actualizar');
  }

  if (!raffleSeller?.seller_id) {
    console.error("[numberStatusUpdates.ts] ❌ ERROR CRÍTICO: seller_id no disponible");
    throw new Error('seller_id es requerido');
  }

  try {
    const updatedNumbers = [];
    
    // Array para almacenar los IDs de raffle_numbers que se actualicen exitosamente
    const updatedRaffleNumberIds: string[] = [];

    for (const numberStr of numbers) {
      const num = parseInt(numberStr);
      console.log(`[numberStatusUpdates.ts] 🔄 Procesando número ${numberStr}`);
      
      const existingNumber = raffleNumbers.find(n => n.number === numberStr);
      
      const updateData: any = {
        status: 'sold',
        participant_id: participantId,
        seller_id: raffleSeller.seller_id,
        payment_method: paymentMethod || 'cash',
        reservation_expires_at: null,
        payment_approved: false // CORRECCIÓN CRÍTICA: Establecer explícitamente en false
      };

      if (paymentProofUrl) {
        console.log(`[numberStatusUpdates.ts] 📎 PaymentProof URL disponible para número ${numberStr}: ${paymentProofUrl}`);
        console.log(`[numberStatusUpdates.ts] ℹ️ El comprobante se manejará en raffle_number_transfers, no en raffle_numbers`);
      }

      let result: any = null;

      if (existingNumber) {
        console.log(`[numberStatusUpdates.ts] 🔄 Actualizando número existente ${numberStr}`);
        const { data, error } = await supabase
          .from('raffle_numbers')
          .update(updateData)
          .eq('id', existingNumber.id)
          .select()
          .single();

        if (error) {
          console.error(`[numberStatusUpdates.ts] ❌ Error actualizando número ${numberStr}:`, error);
          throw error;
        }
        
        result = data;
        console.log(`[numberStatusUpdates.ts] ✅ Número ${numberStr} actualizado exitosamente con payment_approved: false`);
      } else {
        // CORREGIR LÓGICA: Si es "Pagar Apartados", el número debería existir
        if (clickedButtonType === 'Pagar Apartados') {
          console.error(`[numberStatusUpdates.ts] ❌ ERROR CRÍTICO: Número ${numberStr} no encontrado para "Pagar Apartados"`);
          
          // Buscar en base de datos directamente por si raffleNumbers no está actualizado
          const { data: dbNumber, error: searchError } = await supabase
            .from('raffle_numbers')
            .select('*')
            .eq('raffle_id', raffleId)
            .eq('number', num)
            .single();

          if (searchError || !dbNumber) {
            console.error(`[numberStatusUpdates.ts] ❌ Número ${numberStr} no existe en DB:`, searchError);
            throw new Error(`Número ${numberStr} no encontrado para pagar apartado`);
          }

          // Actualizar usando el número encontrado en DB
          const { data: updateResult, error: updateError } = await supabase
            .from('raffle_numbers')
            .update(updateData)
            .eq('id', dbNumber.id)
            .select()
            .single();

          if (updateError) {
            console.error(`[numberStatusUpdates.ts] ❌ Error actualizando número ${numberStr} desde DB:`, updateError);
            throw updateError;
          }
          
          result = updateResult;
          console.log(`[numberStatusUpdates.ts] ✅ Número ${numberStr} actualizado desde DB exitosamente con payment_approved: false`);
        } else {
          // Para "Pagar" directo, insertar nuevo número
          console.log(`[numberStatusUpdates.ts] 🆕 Insertando nuevo número ${numberStr}`);
          const insertData = {
            ...updateData,
            raffle_id: raffleId,
            number: num
          };

          const { data, error } = await supabase
            .from('raffle_numbers')
            .insert(insertData)
            .select()
            .single();

          if (error) {
            console.error(`[numberStatusUpdates.ts] ❌ Error insertando número ${numberStr}:`, error);
            throw error;
          }
          
          result = data;
          console.log(`[numberStatusUpdates.ts] ✅ Número ${numberStr} insertado exitosamente con payment_approved: false`);
        }
      }

      if (result?.id) {
        updatedNumbers.push(result);
        updatedRaffleNumberIds.push(result.id);
        console.log(`[numberStatusUpdates.ts] 📝 Agregado ID ${result.id} para actualización de reserva`);
        
        // NUEVO: Insertar en raffle_number_transfers si es transferencia
        if (paymentMethod === 'transfer' && paymentProofUrl && selectedBankId && rafflePrice) {
          try {
            console.log(`[numberStatusUpdates.ts] 💳 Registrando transferencia para número ${numberStr}`);
            
            const transferData = {
              raffle_number_id: result.id,
              bank_id: selectedBankId,
              price: rafflePrice,
              transfer_date: new Date().toISOString(),
              payment_proof: paymentProofUrl
            };

            const { error: transferError } = await supabase
              .from('raffle_number_transfers')
              .insert(transferData);

            if (transferError) {
              console.error(`[numberStatusUpdates.ts] ❌ Error al registrar transferencia para número ${numberStr}:`, transferError);
            } else {
              console.log(`[numberStatusUpdates.ts] ✅ Transferencia registrada para número ${numberStr}`);
            }
          } catch (transferErr) {
            console.error(`[numberStatusUpdates.ts] ❌ Error inesperado al registrar transferencia para número ${numberStr}:`, transferErr);
          }
        }
      }
    }

    // ACTUALIZAR ESTADOS DE RESERVA: Procesando números vendidos
    console.log(`[numberStatusUpdates.ts] 🎯 ACTUALIZANDO ESTADOS DE RESERVA: Procesando ${updatedRaffleNumberIds.length} números`);
    
    for (const raffleNumberId of updatedRaffleNumberIds) {
      try {
        console.log(`[numberStatusUpdates.ts] 🔄 Actualizando reservation_status a 'sold' para raffle_number_id: ${raffleNumberId}`);
        
        const { error: reservationUpdateError } = await supabase
          .from('raffle_number_reservations')
          .update({ reservation_status: 'sold' })
          .eq('raffle_number_id', raffleNumberId);

        if (reservationUpdateError) {
          console.error(`[numberStatusUpdates.ts] ❌ Error al actualizar reservation_status a sold para ID ${raffleNumberId}:`, reservationUpdateError);
          // No interrumpir el flujo, solo loggear el error
        } else {
          console.log(`[numberStatusUpdates.ts] ✅ reservation_status actualizado a 'sold' para raffle_number_id: ${raffleNumberId}`);
        }
      } catch (reservationError) {
        console.error(`[numberStatusUpdates.ts] ❌ Error inesperado al actualizar reserva para ID ${raffleNumberId}:`, reservationError);
        // No interrumpir el flujo, solo loggear el error
      }
    }

    console.log("[numberStatusUpdates.ts] ✅ PROCESO COMPLETADO: Todos los números actualizados exitosamente");
    console.log("[numberStatusUpdates.ts] 📊 RESUMEN FINAL:", {
      numerosActualizados: updatedNumbers.length,
      reservasActualizadas: updatedRaffleNumberIds.length,
      paymentMethod,
      clickedButtonType,
      paymentApprovedSetToFalse: true
    });

    return {
      success: true,
      updatedNumbers,
      message: `${updatedNumbers.length} números actualizados exitosamente`
    };

  } catch (error: any) {
    console.error("[numberStatusUpdates.ts] ❌ ERROR FATAL en updateNumbersToSold:", error);
    console.error("[numberStatusUpdates.ts] 📋 STACK TRACE:", error?.stack);
    throw new Error(`Error crítico actualizando números: ${error?.message || error}`);
  }
}
