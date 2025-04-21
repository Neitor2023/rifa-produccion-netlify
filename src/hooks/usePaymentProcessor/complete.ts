
import { toast } from "sonner";

export function usePaymentComplete({
  raffleSeller,
  selectedNumbers,
  validateSellerMaxNumbers,
  uploadPaymentProof,
  processParticipant,
  updateNumbersToSold,
  refetchRaffleNumbers,
  setPaymentData,
  setIsPaymentModalOpen,
  setIsVoucherOpen,
  debugMode,
  raffleNumbers
}) {
  const handleCompletePayment = async (data) => {
    if (!raffleSeller?.seller_id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    try {
      if (!(await validateSellerMaxNumbers(selectedNumbers.length))) return;
      const paymentProofUrl = await uploadPaymentProof(data.paymentProof);
      const participantId = await processParticipant(data);
      if (!participantId) {
        toast.error('Error al procesar la información del participante');
        return;
      }
      await updateNumbersToSold(selectedNumbers, participantId, paymentProofUrl, raffleNumbers);
      await refetchRaffleNumbers();
      setPaymentData({
        ...data,
        paymentProof: paymentProofUrl
      });
      setIsPaymentModalOpen(false);
      setIsVoucherOpen(true);
      toast.success('Pago completado exitosamente');
    } catch (error) {
      toast.error('Error al completar el pago');
    }
  };
  return { handleCompletePayment };
}
