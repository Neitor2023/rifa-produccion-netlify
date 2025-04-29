
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
    console.log("🔄 useCompletePayment: handleCompletePayment llamado con datos:", {
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
      
      let participantId: string | null;
      
      if (validatedBuyerData?.id) {
        participantId = validatedBuyerData.id;
        console.log("✅ useCompletePayment: Using existing participant ID:", participantId);
      } else {
        participantId = await processParticipant(data);
        console.log("🆕 useCompletePayment: Created new participant with ID:", participantId);
      }
      
      if (!participantId) {
        toast.error('Error al procesar la información del participante');
        return;
      }
      
      await updateNumbersToSold(selectedNumbers, participantId, paymentProofUrl);
      
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
          console.log("📝 useCompletePayment: Creando nuevo reporte de fraude");
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
            console.error('❌ Error saving fraud report:', fraudError);
          }
        } else {
          console.log("📝 useCompletePayment: Actualizando reporte de fraude existente");
          const { error: updateError } = await supabase
            .from('fraud_reports')
            .update({ 
              mensaje: data.reporteSospechoso,
              estado: 'pendiente'
            })
            .eq('id', existingReport.id);
            
          if (updateError) {
            console.error('❌ Error updating fraud report:', updateError);
          }
        }
      }
      
      setIsPaymentModalOpen(false);
      setIsVoucherOpen(true);
      resetSelection();
      
      toast.success('Pago completado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error al completar el pago:', error);
      toast.error('Error al completar el pago');
      throw error;
    }
  };
}
