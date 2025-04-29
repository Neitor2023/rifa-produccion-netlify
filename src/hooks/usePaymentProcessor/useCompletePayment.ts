
import { PaymentFormData } from '@/components/PaymentModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  return async (data: PaymentFormData) => {
    console.log("▶️ useCompletePayment.ts: handleCompletePayment llamado con datos:", {
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      buyerCedula: data.buyerCedula,
      paymentMethod: data.paymentMethod
    });
    
    if (!raffleSeller?.seller_id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    
    try {
      debugLog('Complete Payment - starting', {
        selectedNumbers,
        data,
        sellerId: raffleSeller.seller_id
      });
      
      if (!(await validateSellerMaxNumbers(selectedNumbers.length))) {
        return;
      }
      
      const paymentProofUrl = await uploadPaymentProof(data.paymentProof);
      console.log("▶️ useCompletePayment.ts: URL del comprobante de pago:", paymentProofUrl);
      
      let participantId: string | null;
      
      if (validatedBuyerData?.id) {
        participantId = validatedBuyerData.id;
        console.log("▶️ useCompletePayment.ts: Usando ID de participante existente:", participantId);
      } else {
        participantId = await processParticipant(data);
        console.log("▶️ useCompletePayment.ts: Creado nuevo participante con ID:", participantId);
      }
      
      if (!participantId) {
        toast.error('Error al procesar la información del participante');
        return;
      }
      
      await updateNumbersToSold(selectedNumbers, participantId, paymentProofUrl);
      console.log("▶️ useCompletePayment.ts: Números actualizados a estado vendido");
      
      setPaymentData({
        ...data,
        paymentProof: paymentProofUrl
      });
      
      if (data.reporteSospechoso) {
        const { data: existingReport } = await supabase
          .from('fraud_reports')
          .select('id')
          .match({
            participant_id: participantId,
            raffle_id: raffleId,
            seller_id: raffleSeller.seller_id
          })
          .maybeSingle();
        
        if (!existingReport) {
          console.log("▶️ useCompletePayment.ts: Creando nuevo reporte de fraude");
          const { error: fraudError } = await supabase
            .from('fraud_reports')
            .insert({
              raffle_id: raffleId,
              seller_id: raffleSeller.seller_id,
              participant_id: participantId,
              mensaje: data.reporteSospechoso,
              estado: 'pendiente'
            });

          if (fraudError) {
            console.error('▶️ useCompletePayment.ts: Error al guardar reporte de fraude:', fraudError);
          }
        } else {
          console.log("▶️ useCompletePayment.ts: Actualizando reporte de fraude existente:", existingReport.id);
          const { error: updateError } = await supabase
            .from('fraud_reports')
            .update({ 
              mensaje: data.reporteSospechoso,
              estado: 'pendiente'
            })
            .eq('id', existingReport.id);
            
          if (updateError) {
            console.error('▶️ useCompletePayment.ts: Error al actualizar reporte de fraude:', updateError);
          }
        }
      }
      
      setIsPaymentModalOpen(false);
      setIsVoucherOpen(true);
      resetSelection();
      
      console.log("▶️ useCompletePayment.ts: Proceso de pago completado exitosamente");
      toast.success('Pago completado exitosamente');
      return true;
    } catch (error) {
      console.error('▶️ useCompletePayment.ts: Error al completar el pago:', error);
      toast.error('Error al completar el pago');
      throw error;
    }
  };
}
