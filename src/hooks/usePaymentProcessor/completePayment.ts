
import { PaymentFormData } from '@/schemas/paymentFormSchema';
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

  // Función de verificación de números mejorada que utiliza consistentemente la comparación numérica
  const verifyNumbersAvailability = async (numbers: string[]): Promise<{
    available: boolean;
    unavailableNumbers: { number: string; sellerId: string }[];
  }> => {
    try {
      console.log("🔍 Verificando disponibilidad de números en TODOS los vendedores:", numbers);
      
      if (!numbers || numbers.length === 0) {
        return { available: true, unavailableNumbers: [] };
      }
      
      // Convertir cadenas en números enteros para consultas de bases de datos
      const numberInts = numbers.map(num => parseInt(num, 10));
      
      // Comprueba si alguno de los números ya está vendido por algún vendedor
      const { data: existingNumbers, error } = await supabase
        .from('raffle_numbers')
        .select('number, seller_id, status')
        .eq('raffle_id', raffleId)
        .in('number', numberInts)
        .eq('status', 'sold');
      
      if (error) {
        console.error('Error verificando disponibilidad de números:', error);
        throw error;
      }
      
      // Filtrar solo los números vendidos por otros vendedores
      const soldByOtherSellers = existingNumbers?.filter(
        item => item.seller_id !== raffleSeller?.seller_id
      ) || [];
      
      // Si algún número es vendido por otros vendedores, devuelve falso y la lista
      if (soldByOtherSellers.length > 0) {
        const unavailableNumbers = soldByOtherSellers.map(n => ({ 
          number: n.number.toString(), 
          sellerId: n.seller_id 
        }));
        
        console.log("❌ Números ya vendidos por otros vendedores:", unavailableNumbers);
        return { available: false, unavailableNumbers };
      }
      
      console.log("✅ Todos los números están disponibles");
      return { available: true, unavailableNumbers: [] };
    } catch (error) {
      console.error('Error en verifyNumbersAvailability:', error);
      throw error;
    }
  };

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
        console.log('Pago completo - comenzando', {
          selectedNumbers,
          formData,
          sellerId: raffleSeller.seller_id
        });
      }
      
      // Primero, verifique la disponibilidad del número entre todos los vendedores
      const { available, unavailableNumbers } = await verifyNumbersAvailability(selectedNumbers);
      
      if (!available) {
        // Formatear la lista de números no disponibles para su visualización
        const unavailableList = unavailableNumbers.map(item => item.number).join(', ');
        
        // Mostrar mensaje de error con un mensaje claro
        toast.error(`Número(s) ${unavailableList} ya han sido vendidos por otro vendedor. Por favor elija otros números.`);
        
        // Regrese temprano para evitar un mayor procesamiento
        return;
      }
      
      // Upload payment proof if provided
      const paymentProofUrl = await uploadPaymentProof(formData.paymentProof);
      
      // Create a new object with the sellerId property for process participant
      const enrichedFormData = {
        ...formData,
        sellerId: raffleSeller.seller_id
      };
      
      // Process participant information
      let participantId: string | null = await processParticipant(enrichedFormData);
      
      if (!participantId) {
        toast.error('Error al procesar la información del participante');
        return;
      }

      // IMPROVED: Verify availability again before updating to prevent race conditions
      console.log("Verificando disponibilidad de números antes de actualizar:", selectedNumbers);
      
      // Convert to integers for proper database comparison
      const numberInts = selectedNumbers.map(num => parseInt(num, 10));
      
      const { data: currentNumberStatus, error: statusError } = await supabase
        .from('raffle_numbers')
        .select('number, status, seller_id')
        .eq('raffle_id', raffleId)
        .in('number', numberInts);
      
      if (statusError) {
        console.error('Error al verificar el estado de los números:', statusError);
        toast.error('Error al verificar disponibilidad de números');
        return;
      }
      
      // Check if any numbers are sold by other sellers
      const soldByOtherSellers = currentNumberStatus?.filter(n => 
        n.status === 'sold' && n.seller_id !== raffleSeller.seller_id
      ) || [];
      
      if (soldByOtherSellers.length > 0) {
        const unavailableList = soldByOtherSellers.map(item => item.number.toString()).join(', ');
        toast.error(`Número(s) ${unavailableList} ya han sido vendidos por otro vendedor. Por favor elija otros números.`);
        return;
      }
      
      // Proceed with update only for numbers that are not sold or are sold by this seller
      const availableNumbers = selectedNumbers.filter(num => {
        const numInt = parseInt(num, 10);
        const existingNumber = currentNumberStatus?.find(n => n.number === numInt);
        return !existingNumber || 
              (existingNumber.status !== 'sold') || 
              (existingNumber.status === 'sold' && existingNumber.seller_id === raffleSeller.seller_id);
      });
      
      console.log("Números disponibles para actualizar:", availableNumbers);
      
      if (availableNumbers.length === 0) {
        toast.error('Todos los números seleccionados ya están vendidos');
        return;
      }
      
      // Proceed with the update for available numbers
      for (const number of availableNumbers) {
        const numberInt = parseInt(number, 10);
        // Check if the number already exists in the raffle_numbers table
        const { data: existingNumber, error: queryError } = await supabase
          .from('raffle_numbers')
          .select('id, status, seller_id')
          .eq('raffle_id', raffleId)
          .eq('number', numberInt)
          .maybeSingle();
        
        if (queryError) {
          console.error(`Error checking if number ${number} exists:`, queryError);
          continue;
        }
        
        // Only update if the number is not sold by another seller
        if (existingNumber && existingNumber.status === 'sold' && existingNumber.seller_id !== raffleSeller.seller_id) {
          console.log(`Número ${number} ya está vendido por otro vendedor, omitiendo actualización.`);
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
          // Number exists, update it
          console.log(`Number ${number} exists, updating record with ID: ${existingNumber.id}`);
          const { error: updateError } = await supabase
            .from('raffle_numbers')
            .update(updateData)
            .eq('id', existingNumber.id);
          
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
              number: numberInt,
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
