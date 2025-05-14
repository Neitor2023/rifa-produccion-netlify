
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
      
      // Cargue el comprobante de pago si lo hay
      const paymentProofUrl = await uploadPaymentProof(formData.paymentProof);
      
      // Cree un nuevo objeto con la propiedad sellerId para el participante del proceso
      const enrichedFormData = {
        ...formData,
        sellerId: raffleSeller.seller_id
      };
      
      // Procesar información del participante
      let participantId: string | null = await processParticipant(enrichedFormData);
      
      if (!participantId) {
        toast.error('Error al procesar la información del participante');
        return;
      }

      // MEJORADO: Verifique la disponibilidad nuevamente antes de actualizar para evitar condiciones de carrera
      console.log("Verificando disponibilidad de números antes de actualizar:", selectedNumbers);
      
      // Convertir a números enteros para una comparación adecuada de bases de datos
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
      
      // Comprueba si hay números vendidos por otros vendedores.
      const soldByOtherSellers = currentNumberStatus?.filter(n => 
        n.status === 'sold' && n.seller_id !== raffleSeller.seller_id
      ) || [];
      
      if (soldByOtherSellers.length > 0) {
        const unavailableList = soldByOtherSellers.map(item => item.number.toString()).join(', ');
        toast.error(`Número(s) ${unavailableList} ya han sido vendidos por otro vendedor. Por favor elija otros números.`);
        return;
      }
      
      // Proceder con la actualización solo para los números que no se venden o son vendidos por este vendedor
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
      
      // Proceder con la actualización de los números disponibles
      for (const number of availableNumbers) {
        const numberInt = parseInt(number, 10);
        // Comprueba si el número ya existe en la tabla raffle_numbers
        const { data: existingNumber, error: queryError } = await supabase
          .from('raffle_numbers')
          .select('id, status, seller_id')
          .eq('raffle_id', raffleId)
          .eq('number', numberInt)
          .maybeSingle();
        
        if (queryError) {
          console.error(`Error comprobando si el número ${number} exists:`, queryError);
          continue;
        }
        
        // Solo actualizar si el número no es vendido por otro vendedor
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
          // El número existe, actualízalo
          console.log(`Number ${number} exists, updating record with ID: ${existingNumber.id}`);
          const { error: updateError } = await supabase
            .from('raffle_numbers')
            .update(updateData)
            .eq('id', existingNumber.id);
          
          if (updateError) {
            console.error(`Error updating number ${number}:`, updateError);
          }
        } else {
          // El número no existe, insértelo
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
            console.error(`Error insertando numero ${number}:`, insertError);
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
          console.error('Error guardar informe de fraude:', fraudError);
        }
      } else {
        console.log("⚠️ Ya existe un informe de fraude para este participante, omitiendo la inserción duplicada");
      }
    } catch (error) {
      console.error('Error manejo de informe de fraude:', error);
    }
  };

  return { handleCompletePayment };
}
