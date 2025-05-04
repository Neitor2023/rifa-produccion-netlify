
import { PaymentFormData } from '@/components/PaymentModal';
import { toast } from 'sonner';

interface UseCompletePaymentProps {
  raffleSeller: any;
  raffleId: string;
  selectedNumbers: string[];
  refetchRaffleNumbers: () => Promise<any>;
  setPaymentData: (data: any) => void;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  setIsVoucherOpen: (isOpen: boolean) => void;
  allowVoucherPrint: boolean;
  uploadPaymentProof: (paymentProof: any) => Promise<string | null>;
  processParticipant: (data: PaymentFormData) => Promise<string | null>;
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
  uploadPaymentProof,
  processParticipant,
  supabase,
  debugMode
}: UseCompletePaymentProps) => {

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
      
      // Create a new object with the sellerId property for process participant
      const enrichedFormData = {
        ...formData,
        sellerId: raffleSeller.seller_id
      };
      
      let participantId: string | null = await processParticipant(enrichedFormData);
      
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
      
      // Proceder con la actualización solo para los números disponibles
      for (const number of numbersToUpdate) {
        // Check if the number already exists in the raffle_numbers table
        const { data: existingNumber, error: queryError } = await supabase
          .from('raffle_numbers')
          .select('id, status')
          .eq('raffle_id', raffleId)
          .eq('number', parseInt(number))
          .eq('seller_id', raffleSeller.seller_id)
          .maybeSingle();
        
        if (queryError) {
          console.error('Error checking if number exists:', queryError);
          continue;
        }
        
        // Solo actualizar si el número no está vendido
        if (existingNumber && existingNumber.status === 'sold') {
          console.log(`Número ${number} ya está vendido, omitiendo actualización.`);
          continue;
        }
        
        const updateData = {
          status: 'sold',
          participant_id: participantId,
          payment_proof: paymentProofUrl,
          participant_name: formData.buyerName,
          participant_phone: formData.buyerPhone, 
          participant_cedula: formData.buyerCedula || null,
          payment_approved: true
        };
        
        if (existingNumber) {
          // Number exists and is not sold, update it
          console.log(`Number ${number} exists but not sold, updating record with ID: ${existingNumber.id}`);
          const { error: updateError } = await supabase
            .from('raffle_numbers')
            .update(updateData)
            .eq('id', existingNumber.id)
            .neq('status', 'sold'); // Condición adicional para evitar actualizar números vendidos
          
          if (updateError) {
            console.error(`Error updating number ${number}:`, updateError);
          }
        } else {
          // Number doesn't exist, insert it
          console.log(`Number ${number} doesn't exist, creating new record`);
          const { error: insertError } = await supabase
            .from('raffle_numbers')
            .insert({
              raffle_id: raffleId,
              number: parseInt(number),
              seller_id: raffleSeller.seller_id,
              ...updateData
            });
          
          if (insertError) {
            console.error(`Error inserting number ${number}:`, insertError);
          }
        }
      }
      
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
    } catch (error) {
      console.error('Error al completar el pago:', error);
      toast.error('Error al completar el pago');
    }
  };

  const handleFraudReport = async (reportMessage: string, participantId: string, raffleId: string, sellerId: string) => {
    try {
      const { data: existingReport } = await supabase
        .from('fraud_reports')
        .select('id')
        .match({
          participant_id: participantId,
          raffle_id: raffleId,
          seller_id: sellerId
        })
        .maybeSingle();
      
      if (!existingReport) {
        const { error: fraudError } = await supabase
          .from('fraud_reports')
          .insert({
            raffle_id: raffleId,
            seller_id: sellerId,
            participant_id: participantId,
            mensaje: reportMessage,
            estado: 'pendiente'
          });

        if (fraudError) {
          console.error('Error saving fraud report:', fraudError);
        }
      } else {
        console.log("⚠️ Fraud report already exists for this participant, skipping duplicate insert");
      }
    } catch (error) {
      console.error('Error handling fraud report:', error);
    }
  };

  return { handleCompletePayment };
}
