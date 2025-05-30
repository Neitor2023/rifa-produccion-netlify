
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
  selectedNumbers: string[]; // Nuevo parámetro para números seleccionados
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
  clickedButtonType,
  selectedNumbers // Recibiendo números seleccionados
}: UpdateNumbersParams): Promise<UpdateResult> => {
  try {
    console.log("[numberStatusUpdates.ts] 🎯 Iniciando actualización con datos clave:", { 
      participantId,
      raffleId,
      sellerId: raffleSeller?.seller_id,
      tipoBoton: clickedButtonType,
      numerosSeleccionados: selectedNumbers,
      cantidadSeleccionada: selectedNumbers.length
    });

    // Validar el raffleId
    if (!raffleId) {
      console.error("[numberStatusUpdates.ts] ❌ Error: raffleId no está definido");
      throw new Error("El ID de la rifa no está definido");
    }

    // Para "Pagar Apartados", validar que los números pertenezcan al participante específico
    if (clickedButtonType === "Pagar Apartados") {
      console.log("[numberStatusUpdates.ts] 🔍 Validando números apartados para participante:", {
        participantId,
        numerosSeleccionados: selectedNumbers,
        cantidadSeleccionada: selectedNumbers.length
      });
      
      const { data: participantNumbers, error: participantError } = await supabase
        .from('raffle_numbers')
        .select('number, participant_id, seller_id, status')
        .eq('raffle_id', raffleId)
        .eq('participant_id', participantId)
        .eq('seller_id', raffleSeller?.seller_id)
        .eq('status', 'reserved')
        .in('number', selectedNumbers.map(num => parseInt(num)));

      console.log("[numberStatusUpdates.ts] 📊 Resultado de consulta BD:", {
        encontradosEnBD: participantNumbers?.length || 0,
        esperadosSeleccionados: selectedNumbers.length,
        datosEncontrados: participantNumbers?.map(n => n.number) || []
      });

      if (participantError) {
        console.error('[numberStatusUpdates.ts] ❌ Error al consultar BD:', participantError);
        throw new Error('Error al validar números del participante');
      }

      // CORRECCIÓN PRINCIPAL: Comparar con selectedNumbers.length
      if (!participantNumbers || participantNumbers.length === 0) {
        console.warn('[numberStatusUpdates.ts] ⚠️ No se encontraron números reservados para este participante');
        return { 
          success: false, 
          message: 'No se encontraron números reservados para este participante. Verifique que los números estén correctamente apartados.'
        };
      }

      if (participantNumbers.length !== selectedNumbers.length) {
        console.warn('[numberStatusUpdates.ts] ⚠️ Inconsistencia entre números seleccionados y encontrados:', {
          encontradosEnBD: participantNumbers.map(n => n.number),
          seleccionadosEnUI: selectedNumbers.map(n => parseInt(n)),
          cantidadEncontrada: participantNumbers.length,
          cantidadSeleccionada: selectedNumbers.length
        });
        return { 
          success: false, 
          message: `Solo ${participantNumbers.length} de ${selectedNumbers.length} números seleccionados están reservados para este participante`
        };
      }

      console.log("[numberStatusUpdates.ts] ✅ Validación exitosa: todos los números seleccionados están en la BD");
    }

    // Obtener información de números que podrían tener conflicto
    const { data: existingData, error: existingError } = await supabase
      .from('raffle_numbers')
      .select('number, status, reservation_expires_at, seller_id, participant_id')
      .eq('raffle_id', raffleId)
      .in('number', selectedNumbers.map(num => parseInt(num)))
      .not('status', 'eq', 'available');

    if (existingError) {
      console.error('[numberStatusUpdates.ts] ❌ Error al verificar números existentes:', existingError);
      throw new Error('Error al verificar disponibilidad de números');
    }

    console.log("[numberStatusUpdates.ts] 🔎 Verificación de conflictos:", {
      numerosEncontrados: existingData?.length || 0,
      datosExistentes: existingData
    });

    // Verificar conflictos: números que están vendidos o reservados por otros
    const conflictingNumbers: string[] = [];
    
    existingData?.forEach(item => {
      if (clickedButtonType === "Pagar Apartados") {
        if (item.status === 'sold' || 
            (item.status === 'reserved' && item.participant_id !== participantId)) {
          conflictingNumbers.push(item.number.toString());
        }
      } else {
        if (item.status === 'sold' ||
            (item.status === 'reserved' && raffleSeller?.seller_id && 
             item.seller_id !== raffleSeller.seller_id)) {
          conflictingNumbers.push(item.number.toString());
        }
      }
    });

    if (conflictingNumbers.length > 0) {
      console.warn('[numberStatusUpdates.ts] ⚠️ Números en conflicto detectados:', conflictingNumbers);
      return { 
        success: false, 
        conflictingNumbers,
        message: 'Algunos números ya no están disponibles'
      };
    }

    // Preparar datos para actualización usando selectedNumbers
    const updateData = selectedNumbers.map(num => {
      if (clickedButtonType === "Pagar Apartados") {
        console.log("[numberStatusUpdates.ts] 🔒 Preservando reservation_expires_at para número:", num);
        
        const existingNumber = existingData?.find(item => item.number === parseInt(num));
        
        if (existingNumber?.reservation_expires_at) {
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
            // Preservar reservation_expires_at
          };
        }
      }
      
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

    console.log("[numberStatusUpdates.ts] 💾 Preparando actualización para números:", {
      cantidadNumeros: updateData.length,
      numerosAProcesar: updateData.map(d => d.number)
    });
    
    // Realizar la actualización con upsert
    const { error: updateError } = await supabase
      .from('raffle_numbers')
      .upsert(updateData, {
        onConflict: 'raffle_id,number',
        ignoreDuplicates: false
      });

    if (updateError) {
      console.error("[numberStatusUpdates.ts] ❌ Error al actualizar en Supabase:", updateError);
      throw new Error('Error al actualizar estado de números en la base de datos');
    }

    console.log("[numberStatusUpdates.ts] ✅ Actualización exitosa completada");
    return { success: true };
    
  } catch (error) {
    console.error("[numberStatusUpdates.ts] ❌ Error general en updateNumbersToSold:", error);
    throw error;
  }
};
