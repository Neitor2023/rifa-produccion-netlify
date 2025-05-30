
import { supabase } from "@/integrations/supabase/client";
import { getSellerUuidFromCedula, isValidUuid } from "@/hooks/useRaffleData/useSellerIdMapping";

interface ProcessFraudReportProps {
  participantId: string;
  sellerId: string | null;
  raffleId: string;
  reporteSospechoso: string;
  debugLog: (context: string, data: any) => void;
}

export const processFraudReport = async ({
  participantId,
  sellerId,
  raffleId,
  reporteSospechoso,
  debugLog
}: ProcessFraudReportProps): Promise<void> => {
  try {
    // Solo procesar si hay un reporte de actividad sospechosa
    if (!reporteSospechoso || reporteSospechoso.trim() === '') {
      console.log("[fraudReportProcessing.ts] + No hay reporte de actividad sospechosa para procesar");
      return;
    }

    console.log("[fraudReportProcessing.ts] + Iniciando procesamiento de reporte de actividad sospechosa:", {
      participantId,
      sellerIdOriginal: sellerId,
      raffleId,
      mensaje: reporteSospechoso.substring(0, 50) + '...'
    });

    debugLog('Procesando reporte de fraude', {
      participantId,
      sellerId,
      raffleId,
      reporteLength: reporteSospechoso.length
    });

    // CORRECCIÓN CRÍTICA: Validar y convertir sellerId si es necesario
    let validSellerId: string | null = sellerId;
    
    if (sellerId) {
      // Verificar si el sellerId ya es un UUID válido
      if (!isValidUuid(sellerId)) {
        console.log("[fraudReportProcessing.ts] + sellerId no es UUID válido, buscando conversión:", sellerId);
        try {
          // Intentar convertir cédula a UUID
          const uuidFromCedula = await getSellerUuidFromCedula(sellerId);
          if (uuidFromCedula) {
            validSellerId = uuidFromCedula;
            console.log("[fraudReportProcessing.ts] + Cédula convertida a UUID exitosamente:", {
              cedula: sellerId,
              uuid: validSellerId
            });
          } else {
            console.warn("[fraudReportProcessing.ts] + No se pudo convertir cédula a UUID:", sellerId);
            validSellerId = null;
          }
        } catch (conversionError) {
          console.error("[fraudReportProcessing.ts] + Error al convertir cédula a UUID:", conversionError);
          validSellerId = null;
        }
      } else {
        console.log("[fraudReportProcessing.ts] + sellerId ya es un UUID válido:", sellerId);
      }
    } else {
      console.log("[fraudReportProcessing.ts] + No se proporcionó sellerId");
    }

    const fraudReportData = {
      participant_id: participantId,
      seller_id: validSellerId,
      raffle_id: raffleId,
      mensaje: reporteSospechoso.trim(),
      estado: 'pendiente'
    };

    console.log("[fraudReportProcessing.ts] + Insertando reporte en tabla fraud_reports:", {
      participant_id: fraudReportData.participant_id,
      seller_id: fraudReportData.seller_id,
      raffle_id: fraudReportData.raffle_id,
      estado: fraudReportData.estado,
      mensajeLength: fraudReportData.mensaje.length
    });

    const { data: insertedReport, error: fraudError } = await supabase
      .from('fraud_reports')
      .insert(fraudReportData)
      .select('id')
      .single();

    if (fraudError) {
      console.error("[fraudReportProcessing.ts] + Error al insertar reporte de fraude:", fraudError.message);
      debugLog('Error al insertar reporte', fraudError);
      throw new Error("Error al registrar reporte de actividad sospechosa: " + fraudError.message);
    }

    console.log("[fraudReportProcessing.ts] + Reporte de actividad sospechosa registrado correctamente:", {
      reportId: insertedReport.id,
      participantId,
      sellerId: validSellerId
    });

    debugLog('Reporte de fraude creado exitosamente', {
      reportId: insertedReport.id,
      participantId
    });

  } catch (error) {
    console.error('[fraudReportProcessing.ts] + Error al procesar reporte de fraude:', error);
    debugLog('Error de procesamiento de reporte', error);
    throw error;
  }
};
