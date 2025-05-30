
import { supabase } from "@/integrations/supabase/client";

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
      sellerId,
      raffleId,
      mensaje: reporteSospechoso.substring(0, 50) + '...'
    });

    debugLog('Procesando reporte de fraude', {
      participantId,
      sellerId,
      raffleId,
      reporteLength: reporteSospechoso.length
    });

    const fraudReportData = {
      participant_id: participantId,
      seller_id: sellerId,
      raffle_id: raffleId,
      mensaje: reporteSospechoso.trim(),
      estado: 'pendiente'
    };

    console.log("[fraudReportProcessing.ts] + Insertando reporte en tabla fraud_reports:", fraudReportData);

    const { data: insertedReport, error: fraudError } = await supabase
      .from('fraud_reports')
      .insert(fraudReportData)
      .select('id')
      .single();

    if (fraudError) {
      console.error("[fraudReportProcessing.ts] + Error al insertar reporte de fraude:", fraudError.message);
      debugLog('Error al insertar reporte', fraudError);
      throw new Error("Error al registrar reporte de actividad sospechosa");
    }

    console.log("[fraudReportProcessing.ts] + Reporte de actividad sospechosa registrado correctamente para participante:", {
      reportId: insertedReport.id,
      participantId
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
