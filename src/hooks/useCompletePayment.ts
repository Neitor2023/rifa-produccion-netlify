
import { toast } from 'sonner';
import { handleError } from './usePaymentProcessor/errorHandling';
import { supabase } from '@/integrations/supabase/client';

export function useCompletePayment({
  raffleSeller,
  raffleId,
  selectedNumbers,
  validatedBuyerData,
  validateSellerMaxNumbers,
  setIsPaymentModalOpen,
  setIsVoucherOpen,
  setPaymentData,
  resetSelection,
  handleProofCheck,
  uploadPaymentProof,
  processParticipant,
  updateNumbersToSold,
  debugMode = false
}) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - CompletePayment - ${context}]:`, data);
    }
  };

  return async (formData) => {
    console.log("▶️ useCompletePayment.ts: handleCompletePayment llamado con datos:", formData);

    try {
      // First validate max numbers allowed
      if (!(await validateSellerMaxNumbers(selectedNumbers.length))) {
        return;
      }

      // Upload payment proof if provided
      let paymentProofUrl = null;
      if (formData.paymentMethod === 'transfer' && formData.paymentProof) {
        paymentProofUrl = await uploadPaymentProof(formData.paymentProof);
        debugLog('Payment proof uploaded', paymentProofUrl);
      }

      // Handle participant data
      const participantId = await processParticipant({
        validatedBuyerData,
        formData,
        raffleId,
        sellerId: raffleSeller.seller_id
      });

      if (!participantId) {
        throw new Error("No se pudo procesar el participante");
      }

      // Update numbers to sold status
      await updateNumbersToSold({
        numbers: selectedNumbers,
        raffleId,
        sellerId: raffleSeller.seller_id,
        participantId,
        formData,
        buyerData: validatedBuyerData,
        paymentProofUrl
      });
      
      // Process fraud report if provided
      if (formData.reporteSospechoso && formData.reporteSospechoso.trim() !== '') {
        await processFraudReport({
          participantId,
          raffleId,
          sellerId: raffleSeller.seller_id,
          mensaje: formData.reporteSospechoso
        });
      }

      // Success - complete payment flow
      console.log("▶️ useCompletePayment.ts: Pago completado exitosamente");
      toast.success("Pago completado exitosamente");
      
      // Set payment data
      if (paymentProofUrl) {
        formData.paymentProof = paymentProofUrl;
      }

      // Set payment data for voucher
      setPaymentData(formData);
      
      // Close payment modal and open voucher
      setIsPaymentModalOpen(false);
      setIsVoucherOpen(true);
      
      // Reset selected numbers in the grid
      resetSelection();
      
      return true;
    } catch (error: any) {
      handleError('Error al completar el pago:', error);
      return false;
    }
  };
  
  async function processFraudReport({ participantId, raffleId, sellerId, mensaje }) {
    try {
      console.log("▶️ useCompletePayment.ts: Procesando reporte de actividad sospechosa");
        
      // Check if a report already exists
      const { data: existingReport } = await supabase
        .from('fraud_reports')
        .select('id')
        .match({
          participant_id: participantId,
          raffle_id: raffleId,
          seller_id: sellerId,
          estado: 'pendiente'
        })
        .maybeSingle();
      
      if (existingReport) {
        console.log("▶️ useCompletePayment.ts: Actualizando reporte existente:", existingReport.id);
        
        // Update existing report
        const { error: updateError } = await supabase
          .from('fraud_reports')
          .update({
            mensaje: mensaje,
            estado: 'pendiente'
          })
          .eq('id', existingReport.id);
        
        if (updateError) {
          console.error("▶️ useCompletePayment.ts: Error al actualizar reporte de fraude:", updateError);
        }
      } else {
        console.log("▶️ useCompletePayment.ts: Creando nuevo reporte de fraude");
        
        // Create new fraud report
        const { error: fraudError } = await supabase
          .from('fraud_reports')
          .insert({
            raffle_id: raffleId,
            seller_id: sellerId,
            participant_id: participantId,
            mensaje: mensaje,
            estado: 'pendiente'
          });

        if (fraudError) {
          console.error('▶️ useCompletePayment.ts: Error al guardar reporte de fraude:', fraudError);
        }
      }
    } catch (error) {
      console.error("▶️ useCompletePayment.ts: Error en procesamiento de reporte:", error);
    }
  }
}
