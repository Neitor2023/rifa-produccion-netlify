
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { toast } from 'sonner';
import { usePaymentCompletion } from './paymentCompletion';
import { useFraudReporting } from './fraudReporting';

interface UseCompletePaymentProps {
  raffleSeller: any;
  raffleId: string;
  selectedNumbers: string[];
  refetchRaffleNumbers: () => Promise<any>;
  setPaymentData: (data: any) => void;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  setIsVoucherOpen: (isOpen: boolean) => void;
  allowVoucherPrint: boolean;
  supabase: any;
  debugMode?: boolean;
}

export const useCompletePayment = ({
  raffleSeller,
  raffleId,
  selectedNumbers,
  refetchRaffleNumbers,
  setPaymentData,
  setIsPaymentModalOpen,
  setIsVoucherOpen,
  allowVoucherPrint,
  supabase,
  debugMode
}: UseCompletePaymentProps) => {
  console.log("🔄 useCompletePayment: Entry point with", {
    raffleId, 
    selectedNumbersCount: selectedNumbers.length
  });

  // Get helper functions from sub-hooks
  const {
    uploadPaymentProof,
    processParticipant,
    updateNumbersToSold
  } = usePaymentCompletion({
    raffleSeller,
    raffleId,
    debugMode
  });
  
  // Get fraud reporting functionality
  const { handleFraudReport } = useFraudReporting({
    supabase,
    debugMode
  });

  const handleCompletePayment = async (formData: PaymentFormData) => {
    console.log("🔄 handleCompletePayment called with data:", {
      buyerName: formData.buyerName,
      buyerPhone: formData.buyerPhone,
      buyerEmail: formData.buyerEmail,
      buyerCedula: formData.buyerCedula,
      paymentMethod: formData.paymentMethod,
      sellerId: raffleSeller?.seller_id,
      selectedNumbers: selectedNumbers
    });
    
    if (!raffleSeller?.seller_id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    
    try {
      if (debugMode) {
        console.log('Complete Payment - starting', {
          selectedNumbers,
          formData,
          sellerId: raffleSeller.seller_id
        });
      }
      
      const paymentProofUrl = await uploadPaymentProof(formData.paymentProof);
      
      // Create a complete PaymentFormData object with all required fields
      // Ensure all required fields are properly assigned as non-optional
      const participantData: PaymentFormData = {
        buyerName: formData.buyerName,
        buyerPhone: formData.buyerPhone,
        buyerCedula: formData.buyerCedula,
        paymentMethod: formData.paymentMethod || "cash", // Default to cash if undefined
        paymentProof: paymentProofUrl,
        buyerEmail: formData.buyerEmail || "",  // Ensure it's not undefined
        direccion: formData.direccion || "",
        nota: formData.nota || "",
        sugerenciaProducto: formData.sugerenciaProducto || "",
        reporteSospechoso: formData.reporteSospechoso || "",
        sellerId: raffleSeller.seller_id
      };
      
      let participantId: string | null = await processParticipant(participantData);
      
      if (!participantId) {
        toast.error('Error al procesar la información del participante');
        return;
      }

      // CAMBIO IMPORTANTE: Primero verificar qué números realmente están disponibles 
      // para prevenir sobrescribir números ya vendidos
      console.log("Verificando disponibilidad de números antes de actualizar:", selectedNumbers);
      
      const { data: currentNumberStatus, error: statusError } = await supabase
        .from('raffle_numbers')
        .select('number, status')
        .eq('raffle_id', raffleId)
        .eq('seller_id', raffleSeller.seller_id)
        .in('number', selectedNumbers.map(num => parseInt(num)));
      
      if (statusError) {
        console.error('Error al verificar el estado de los números:', statusError);
        toast.error('Error al verificar disponibilidad de números');
        return;
      }
      
      // Filtrar para excluir números ya vendidos
      const soldNumbers = currentNumberStatus?.filter(n => n.status === 'sold').map(n => n.number.toString()) || [];
      const numbersToUpdate = selectedNumbers.filter(num => !soldNumbers.includes(num));
      
      console.log("Números ya vendidos (se excluirán):", soldNumbers);
      console.log("Números que se actualizarán:", numbersToUpdate);
      
      if (numbersToUpdate.length === 0) {
        toast.error('Todos los números seleccionados ya están vendidos');
        return;
      }
      
      // Update the raffle numbers to sold status
      await updateNumbersToSold(
        numbersToUpdate,
        participantId,
        paymentProofUrl,
        {
          name: formData.buyerName,
          phone: formData.buyerPhone,
          cedula: formData.buyerCedula
        }
      );
      
      await refetchRaffleNumbers();
      
      setPaymentData({
        ...formData,
        paymentProof: paymentProofUrl
      });
      
      if (formData.reporteSospechoso) {
        await handleFraudReport(formData.reporteSospechoso, participantId, raffleId, raffleSeller.seller_id);
      }
      
      setIsPaymentModalOpen(false);
      
      if (allowVoucherPrint) {
        setIsVoucherOpen(true);
      } else {
        toast.success('Pago completado exitosamente. El comprobante de pago está en revisión.');
        toast.info('Es importante que le exija su comprobante de pago a su vendedor, este es su constancia de reclamo de premios.');
      }
      
      toast.success('Pago completado exitosamente');
      
      console.log("✅ handleCompletePayment: Payment completed successfully");
    } catch (error) {
      console.error('Error al completar el pago:', error);
      toast.error('Error al completar el pago');
    }
  };

  console.log("✅ useCompletePayment: Exit");

  return { handleCompletePayment };
};
