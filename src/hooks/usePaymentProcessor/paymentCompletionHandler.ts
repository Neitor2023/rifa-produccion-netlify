
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/components/PaymentModal';
import { toast } from 'sonner';
import { formatPhoneNumber } from '@/utils/phoneUtils';

export function usePaymentCompletionHandler({
  raffleSeller,
  raffleId,
  refetchRaffleNumbers,
  allowVoucherPrint,
  debugMode = false
}) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - PaymentCompletionHandler - ${context}]:`, data);
    }
  };

  const handleCompletePayment = async ({
    selectedNumbers,
    paymentData,
    buyerInfo,
    setIsPaymentModalOpen,
    setIsVoucherOpen,
    setPaymentData,
  }) => {
    console.log("🔄 handleCompletePayment called with data:", {
      buyerName: paymentData.buyerName,
      buyerPhone: paymentData.buyerPhone,
      buyerCedula: paymentData.buyerCedula,
      buyerEmail: paymentData.buyerEmail,
      paymentMethod: paymentData.paymentMethod,
      direccion: paymentData.direccion,
      sugerenciaProducto: paymentData.sugerenciaProducto,
      nota: paymentData.nota
    });
    
    if (!raffleSeller?.seller_id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    
    try {
      debugLog('Complete Payment - starting', {
        selectedNumbers,
        paymentData,
        sellerId: raffleSeller.seller_id
      });
      
      const paymentProofUrl = await uploadPaymentProof(paymentData.paymentProof);
      
      let participantId: string | null;
      
      if (buyerInfo?.id) {
        participantId = buyerInfo.id;
        console.log("Using existing participant ID:", participantId);
      } else {
        participantId = await processParticipant(paymentData);
      }
      
      if (!participantId) {
        toast.error('Error al procesar la información del participante');
        return;
      }
      
      // Modified logic to check for existing records and update or insert accordingly
      for (const number of selectedNumbers) {
        // Check if the number already exists in the raffle_numbers table
        const { data: existingNumber, error: queryError } = await supabase
          .from('raffle_numbers')
          .select('id')
          .eq('raffle_id', raffleId)
          .eq('number', parseInt(number))
          .eq('seller_id', raffleSeller.seller_id)
          .maybeSingle();
        
        if (queryError) {
          console.error('Error checking if number exists:', queryError);
          continue;
        }
        
        const updateData = {
          status: 'sold',
          participant_id: participantId,
          payment_proof: paymentProofUrl,
          participant_name: paymentData.buyerName,
          participant_phone: paymentData.buyerPhone,
          participant_cedula: paymentData.buyerCedula || null,
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
        ...paymentData,
        paymentProof: paymentProofUrl
      });
      
      if (paymentData.reporteSospechoso) {
        await handleFraudReport(participantId, paymentData.reporteSospechoso);
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

  const handleFraudReport = async (participantId: string, reportMessage: string) => {
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
      const { error: fraudError } = await supabase
        .from('fraud_reports')
        .insert({
          raffle_id: raffleId,
          seller_id: raffleSeller.seller_id,
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
  };

  const uploadPaymentProof = async (paymentProof: File | string | null): Promise<string | null> => {
    if (!paymentProof || !(paymentProof instanceof File)) {
      return typeof paymentProof === 'string' ? paymentProof : null;
    }
    
    try {
      const fileName = `${raffleId}_${Date.now()}_${paymentProof.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(fileName);
        
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      throw error;
    }
  };
  
  const processParticipant = async (data: PaymentFormData): Promise<string | null> => {
    try {
      console.log("🔵 Processing participant with data:", data);
      
      const formattedPhone = formatPhoneNumber(data.buyerPhone);
      
      const { data: existingParticipant, error: searchError } = await supabase
        .from('participants')
        .select('id, name, phone, cedula, direccion, sugerencia_producto, nota, email')
        .eq('phone', formattedPhone)
        .eq('raffle_id', raffleId)
        .maybeSingle();

      if (searchError) {
        console.error("Error searching for existing participant:", searchError);
      }

      let participantId: string | null = null;

      if (existingParticipant) {
        participantId = existingParticipant.id;
        console.log("✅ Found existing participant:", existingParticipant);

        // Enhanced update data to include all fields from the form
        const updateData: any = {
          name: data.buyerName,
          phone: formattedPhone,
          email: data.buyerEmail, // Added email field
          cedula: data.buyerCedula || null,
          direccion: data.direccion || null,
          sugerencia_producto: data.sugerenciaProducto || null,
          nota: data.nota || null // Added nota field
        };

        console.log("📝 Updating participant with data:", updateData);

        const { error: updateError } = await supabase
          .from('participants')
          .update(updateData)
          .eq('id', participantId);

        if (updateError) {
          console.error("Error updating participant:", updateError);
          throw updateError;
        }
      } else {
        console.log("🆕 Creating new participant");

        const { data: newParticipant, error: participantError } = await supabase
          .from('participants')
          .insert({
            name: data.buyerName,
            phone: formattedPhone,
            email: data.buyerEmail, // Added email field 
            cedula: data.buyerCedula,
            direccion: data.direccion || null,
            sugerencia_producto: data.sugerenciaProducto || null,
            nota: data.nota || null, // Added nota field
            raffle_id: raffleId,
            seller_id: raffleSeller.seller_id
          })
          .select('id')
          .single();

        if (participantError) {
          console.error("Error creating new participant:", participantError);
          throw participantError;
        }

        participantId = newParticipant.id;
      }

      return participantId;
    } catch (error) {
      console.error('Error processing participant:', error);
      throw error;
    }
  };

  return {
    handleCompletePayment
  };
}
