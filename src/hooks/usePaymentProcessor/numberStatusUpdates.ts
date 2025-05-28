
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
      .not('status', 'eq', 'available');

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
            payment_proof: paymentProofUrl, // Restaurado: Se vuelve a guardar el comprobante aquí
            payment_approved: false, // Restaurado: Se establece como no aprobado inicialmente
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
        payment_proof: paymentProofUrl, // Restaurado: Se guarda el comprobante aquí
        payment_approved: false, // Restaurado: Se establece como no aprobado inicialmente
        reservation_expires_at: null
      };
    });

    console.log("[numberStatusUpdates.ts] 📸 Inicio del guardado de imagen del comprobante");
    console.log("[numberStatusUpdates.ts] URL del comprobante a guardar:", paymentProofUrl);
    console.log("[numberStatusUpdates.ts] actualización con upsert para manejar tanto nuevos números como existentes:", updateError);
    
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
