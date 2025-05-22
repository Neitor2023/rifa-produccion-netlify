
import { supabase } from "@/integrations/supabase/client";

interface UpdateNumbersParams {
  numbers: string[];
  participantId: string;
  paymentProofUrl: string | null;
  raffleNumbers: any[];
  raffleSeller: any;
  raffleId: string;
  paymentMethod: string;
  clickedButtonType: string;
}

export interface UpdateResult {
  success: boolean;
  conflictingNumbers?: string[];
  message?: string;
}

export const updateNumbersToSold = async ({
  numbers,
  participantId,
  paymentProofUrl,
  raffleNumbers,
  raffleSeller,
  raffleId,
  paymentMethod,
  clickedButtonType
}: UpdateNumbersParams): Promise<UpdateResult> => {
  try {
    console.log("[numberStatusUpdates.ts] Iniciando actualización de números a estado vendido:", { 
      cantidad: numbers.length, 
      participantId, 
      tipoBoton: clickedButtonType 
    });

    // Validar el raffleId
    if (!raffleId) {
      console.error("[numberStatusUpdates.ts] Error: raffleId no está definido");
      throw new Error("El ID de la rifa no está definido");
    }

    // Obtener información de números que podrían tener conflicto
    const { data: existingData, error: existingError } = await supabase
      .from('raffle_numbers')
      .select('number, status, reservation_expires_at, seller_id')
      .eq('raffle_id', raffleId)
      .in('number', numbers.map(num => parseInt(num)))
      .not('status', 'in', '(available,returned)'); // Agregar 'returned' como estado no conflictivo

    if (existingError) {
      console.error('[numberStatusUpdates.ts] Error al verificar números existentes:', existingError);
      throw new Error('Error al verificar disponibilidad de números');
    }

    // Verificar conflictos: números que están vendidos o reservados por otros vendedores
    const conflictingNumbers: string[] = [];
    
    existingData?.forEach(item => {
      if (
        item.status === 'sold' ||
        (item.status === 'reserved' && raffleSeller?.seller_id && 
         item.seller_id !== raffleSeller.seller_id)
      ) {
        conflictingNumbers.push(item.number.toString());
      }
    });

    if (conflictingNumbers.length > 0) {
      console.warn('[numberStatusUpdates.ts] Números en conflicto detectados:', conflictingNumbers);
      return { 
        success: false, 
        conflictingNumbers,
        message: 'Algunos números ya no están disponibles'
      };
    }

    // Identificar números con estado 'returned' para tratarlos de forma especial
    const returnedNumbers = raffleNumbers
      .filter(n => numbers.includes(n.number) && n.status === 'returned')
      .map(n => n.number);
    
    if (returnedNumbers.length > 0) {
      console.log("[numberStatusUpdates.ts] 🔄 Números con estado 'returned' que serán tratados como nuevos:", returnedNumbers);
    }

    // Preparar datos para actualización
    const updateData = numbers.map(num => {
      // Caso especial para "Pagar Apartados": Preservar el campo reservation_expires_at
      if (clickedButtonType === "Pagar Apartados") {
        console.log("[numberStatusUpdates.ts] 🔒 Detectado botón 'Pagar Apartados' - Preservando campo reservation_expires_at");
        
        // Buscar si el número ya tiene una reserva para mantener su fecha de expiración
        const existingNumber = existingData?.find(item => item.number === parseInt(num));
        
        if (existingNumber?.reservation_expires_at) {
          console.log(`[numberStatusUpdates.ts] ✅ Preservando reservation_expires_at para el número ${num}:`, 
            existingNumber.reservation_expires_at);
          
          return {
            raffle_id: raffleId,
            number: parseInt(num),
            status: 'sold',
            participant_id: participantId,
            seller_id: raffleSeller?.seller_id || null,
            payment_method: paymentMethod,
            payment_receipt_url: paymentProofUrl,
            payment_proof: paymentProofUrl,
            payment_approved: false,
            // NO MODIFICAMOS reservation_expires_at para preservar su valor
          };
        }
      }
      
      // Para otros casos (Pagar Directo, etc.)
      return {
        raffle_id: raffleId,
        number: parseInt(num),
        status: 'sold',
        participant_id: participantId,
        seller_id: raffleSeller?.seller_id || null,
        payment_method: paymentMethod,
        payment_receipt_url: paymentProofUrl,
        payment_proof: paymentProofUrl,
        payment_approved: false,
        reservation_expires_at: null
      };
    });

    console.log("[numberStatusUpdates.ts] 📸 Inicio del guardado de imagen del comprobante");
    console.log("[numberStatusUpdates.ts] URL del comprobante a guardar:", paymentProofUrl);

    // Verificar si hay números con estado 'returned'
    if (returnedNumbers.length > 0) {
      // Para cada número 'returned', forzamos la creación de un nuevo registro
      // sin modificar el registro existente con estado 'returned'
      for (const num of returnedNumbers) {
        const intNum = parseInt(num);
        console.log(`[numberStatusUpdates.ts] 🆕 Guardando como nuevo registro para número returned: ${num}`);
        
        // Agregamos este número como un nuevo registro (insert) en vez de actualizar
        const { data, error } = await supabase
          .from('raffle_numbers')
          .insert({
            raffle_id: raffleId,
            number: intNum,
            status: 'sold',
            participant_id: participantId,
            seller_id: raffleSeller?.seller_id || null,
            payment_method: paymentMethod,
            payment_receipt_url: paymentProofUrl,
            payment_proof: paymentProofUrl,
            payment_approved: false,
            reservation_expires_at: null
          });
        
        if (error) {
          console.error(`[numberStatusUpdates.ts] ❌ Error al insertar nuevo registro para número returned ${num}:`, error);
          throw new Error(`Error al crear nuevo registro para número ${num}`);
        } else {
          console.log(`[numberStatusUpdates.ts] ✅ Nuevo registro creado exitosamente para número returned ${num}`);
        }
      }
      
      // Filtrar los números 'returned' del updateData para que no se procesen con upsert
      const filteredUpdateData = updateData.filter(item => 
        !returnedNumbers.includes(item.number.toString().padStart(2, '0'))
      );
      
      // Si aún hay números para actualizar (que no sean 'returned')
      if (filteredUpdateData.length > 0) {
        const { error: updateError } = await supabase
          .from('raffle_numbers')
          .upsert(filteredUpdateData, {
            onConflict: 'raffle_id,number',
            ignoreDuplicates: false
          });

        if (updateError) {
          console.error("[numberStatusUpdates.ts] 🔴 Error al actualizar números no returned:", updateError);
          throw new Error('Error al actualizar estado de números en la base de datos');
        }
      }
    } else {
      // Si no hay números 'returned', procedemos con el upsert normal
      const { error: updateError } = await supabase
        .from('raffle_numbers')
        .upsert(updateData, {
          onConflict: 'raffle_id,number',
          ignoreDuplicates: false
        });

      if (updateError) {
        console.error("[numberStatusUpdates.ts] 🔴 Error al guardar imagen del comprobante:", updateError);
        console.error("[numberStatusUpdates.ts] Error al actualizar números:", updateError);
        throw new Error('Error al actualizar estado de números en la base de datos');
      }
    }

    console.log("[numberStatusUpdates.ts] 🟢 Imagen del comprobante guardada correctamente");
    console.log("[numberStatusUpdates.ts] ✅ Números actualizados exitosamente a estado 'sold'");
    return { success: true };
    
  } catch (error) {
    console.error("[numberStatusUpdates.ts] ❌ Error en updateNumbersToSold:", error);
    throw error;
  }
};
