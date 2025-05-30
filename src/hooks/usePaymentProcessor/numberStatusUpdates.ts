
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

    // Para "Pagar Apartados", validar que los números pertenezcan al participante específico
    if (clickedButtonType === "Pagar Apartados") {
      console.log("[numberStatusUpdates.ts] 🔍 Validando que los números pertenezcan al participante:", participantId);
      
      // Añadir logging detallado de la consulta
      console.log("[numberStatusUpdates.ts] 📋 Parámetros de consulta:", {
        raffleId,
        participantId,
        sellerId: raffleSeller?.seller_id,
        numerosSeleccionados: numbers,
        cantidadNumerosSeleccionados: numbers.length
      });
      
      const { data: participantNumbers, error: participantError } = await supabase
        .from('raffle_numbers')
        .select('number, participant_id, seller_id, status')
        .eq('raffle_id', raffleId)
        .eq('participant_id', participantId)
        .eq('seller_id', raffleSeller?.seller_id)
        .eq('status', 'reserved')
        .in('number', numbers.map(num => parseInt(num)));

      console.log("[numberStatusUpdates.ts] 🔍 Resultado de la consulta:", {
        encontrados: participantNumbers?.length || 0,
        esperados: numbers.length,
        datos: participantNumbers
      });

      if (participantError) {
        console.error('[numberStatusUpdates.ts] Error al validar números del participante:', participantError);
        throw new Error('Error al validar números del participante');
      }

      if (!participantNumbers || participantNumbers.length === 0) {
        console.warn('[numberStatusUpdates.ts] ⚠️ No se encontraron números reservados para este participante');
        return { 
          success: false, 
          message: 'No se encontraron números reservados para este participante. Por favor, verifique que los números estén correctamente apartados.'
        };
      }

      // CORRECCIÓN: Comparar con numbers.length (números seleccionados) en lugar de todos los números
      if (participantNumbers.length !== numbers.length) {
        console.warn('[numberStatusUpdates.ts] ⚠️ Algunos números seleccionados no pertenecen al participante o no están reservados:', {
          encontradosEnBD: participantNumbers.map(n => n.number),
          seleccionadosEnUI: numbers.map(n => parseInt(n)),
          cantidadEncontrada: participantNumbers.length,
          cantidadSeleccionada: numbers.length
        });
        return { 
          success: false, 
          message: `Solo ${participantNumbers.length} de ${numbers.length} números seleccionados están reservados para este participante`
        };
      }

      console.log("[numberStatusUpdates.ts] ✅ Validación exitosa: todos los números seleccionados pertenecen al participante");
    }

    // Obtener información de números que podrían tener conflicto
    const { data: existingData, error: existingError } = await supabase
      .from('raffle_numbers')
      .select('number, status, reservation_expires_at, seller_id, participant_id')
      .eq('raffle_id', raffleId)
      .in('number', numbers.map(num => parseInt(num)))
      .not('status', 'eq', 'available');

    if (existingError) {
      console.error('[numberStatusUpdates.ts] Error al verificar números existentes:', existingError);
      throw new Error('Error al verificar disponibilidad de números');
    }

    // Verificar conflictos: números que están vendidos o reservados por otros
    const conflictingNumbers: string[] = [];
    
    existingData?.forEach(item => {
      // Para "Pagar Apartados", verificar que el número pertenezca al participante correcto
      if (clickedButtonType === "Pagar Apartados") {
        if (item.status === 'sold' || 
            (item.status === 'reserved' && item.participant_id !== participantId)) {
          conflictingNumbers.push(item.number.toString());
        }
      } else {
        // Para "Pagar Directo", verificar conflictos normales
        if (item.status === 'sold' ||
            (item.status === 'reserved' && raffleSeller?.seller_id && 
             item.seller_id !== raffleSeller.seller_id)) {
          conflictingNumbers.push(item.number.toString());
        }
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
    
    // Realizar la actualización con upsert para manejar tanto nuevos números como existentes
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

    console.log("[numberStatusUpdates.ts] 🟢 Imagen del comprobante guardada correctamente");
    console.log("[numberStatusUpdates.ts] ✅ Números actualizados exitosamente a estado 'sold'");
    return { success: true };
    
  } catch (error) {
    console.error("[numberStatusUpdates.ts] ❌ Error en updateNumbersToSold:", error);
    throw error;
  }
};
