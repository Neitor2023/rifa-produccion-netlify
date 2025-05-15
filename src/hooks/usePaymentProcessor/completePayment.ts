
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { updateRaffleNumbersToSold } from './numberStatusUpdates';

interface UseCompletePaymentProps {
  raffleSeller: {
    id: string;
    seller_id: string;
    active: boolean;
    cant_max: number;
  };
  raffleId: string;
  selectedNumbers: string[];
  refetchRaffleNumbers: () => Promise<any>;
  setPaymentData: (data: PaymentFormData | null) => void;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  setIsVoucherOpen: (isOpen: boolean) => void;
  allowVoucherPrint: boolean;
  uploadPaymentProof: (paymentProof: File | string | null) => Promise<string | null>;
  processParticipant: (data: PaymentFormData) => Promise<string | null>;
  supabase: any;
  debugMode?: boolean;
}

export function useCompletePayment({
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
  debugMode = false
}: UseCompletePaymentProps) {
  
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - CompletePayment - ${context}]:`, data);
    }
  };

  // Function to save suspicious activity report
  const saveSuspiciousActivityReport = async (
    reportMessage: string,
    participantId: string,
    sellerId: string
  ): Promise<void> => {
    try {
      if (!reportMessage || reportMessage.trim() === '') {
        return; // Don't save if empty
      }

      console.log('📝 Saving suspicious activity report:', {
        message: reportMessage,
        participantId,
        sellerId,
        raffleId
      });

      const { error } = await supabase
        .from('fraud_reports')
        .insert({
          mensaje: reportMessage.trim(),
          participant_id: participantId,
          seller_id: sellerId,
          raffle_id: raffleId,
          estado: 'pendiente'
        });

      if (error) {
        console.error('❌ Error saving fraud report:', error);
      } else {
        console.log('✅ Fraud report saved successfully');
      }
    } catch (error) {
      console.error('❌ Exception in saveSuspiciousActivityReport:', error);
    }
  };

  const handleCompletePayment = async (data: PaymentFormData) => {
    console.log("✅ usePaymentProcessor: handleCompletePayment iniciado con datos:", {
      numbers: selectedNumbers?.length || 0,
      paymentMethod: data.paymentMethod,
    });

    try {
      // Validar que raffleId esté definido
      if (!raffleId) {
        console.error("❌ Error: raffleId está undefined en handleCompletePayment. Abortando ejecución.");
        toast.error("Error de validación: ID de rifa no disponible.");
        return;
      }
      
      // Validar que tengamos números seleccionados
      if (!selectedNumbers || selectedNumbers.length === 0) {
        toast.error("No hay números seleccionados para completar el pago");
        return;
      }

      debugLog('handleCompletePayment', { data, selectedNumbers });

      // 1. Verify numbers are still available
      const unavailableNumbers = await verifyNumbersAvailability(selectedNumbers, raffleId);
      if (unavailableNumbers.length > 0) {
        toast.error(`Algunos números ya no están disponibles: ${unavailableNumbers.join(', ')}`);
        await refetchRaffleNumbers();
        return;
      }
      
      // 2. Upload payment proof if payment method is transfer
      let paymentProofUrl: string | null = null;
      if (data.paymentMethod === 'transfer') {
        console.log("💸 Subiendo comprobante de pago por transferencia");
        paymentProofUrl = await uploadPaymentProof(data.paymentProof);
        if (!paymentProofUrl && data.paymentProof) {
          toast.error("Error al subir comprobante de pago");
          return;
        }
      }
      
      // 3. Process participant data
      // Ensure seller_id is set (fix for issue 2.1)
      data.sellerId = raffleSeller.seller_id;
      debugLog('handleCompletePayment - Setting seller_id', { sellerId: data.sellerId });
      
      console.log("👤 Procesando datos del participante");
      const participantId = await processParticipant(data);
      if (!participantId) {
        toast.error("Error al procesar datos del participante");
        return;
      }
      
      debugLog('handleCompletePayment - Participant processed', { participantId });

      // 4. Update numbers to sold - only for current participant's numbers or new numbers
      // Fix for issue 1.4 and 2.2
      console.log("🔢 Actualizando números a estado 'vendido'");
      const clickedButton = data.clickedButtonType || "";
      
      // For "Pagar Apartados" flow, only update numbers of current participant
      if (clickedButton === "Pagar Apartados") {
        console.log("🔍 'Pagar Apartados' flow - updating only current participant numbers");
        // Get numbers that are reserved by this participant
        const { data: reservedNumbers, error } = await supabase
          .from('raffle_numbers')
          .select('number')
          .eq('participant_id', participantId)
          .eq('status', 'reserved')
          .eq('raffle_id', raffleId);
          
        if (error) {
          console.error("❌ Error fetching reserved numbers:", error);
          toast.error("Error al obtener números reservados del participante");
          return;
        }
        
        // Use only the numbers actually reserved by this participant
        const validNumbersToUpdate = reservedNumbers.map(item => item.number.toString());
        
        // If no reserved numbers found, warn user
        if (validNumbersToUpdate.length === 0) {
          console.warn("⚠️ No reserved numbers found for this participant");
          toast.warning("No se encontraron números reservados para este participante");
        } else {
          console.log("✅ Updating payment status for numbers:", validNumbersToUpdate);
          await updateRaffleNumbersToSold(validNumbersToUpdate, participantId, paymentProofUrl, raffleId, raffleSeller.seller_id);
        }
      } else {
        // For "Pagar Directo", proceed with selected numbers
        console.log("💵 'Pagar Directo' flow - using selected numbers:", selectedNumbers);
        await updateRaffleNumbersToSold(selectedNumbers, participantId, paymentProofUrl, raffleId, raffleSeller.seller_id);
      }
      
      // 5. Save suspicious activity report if provided (fix for issues 1.1 and 2.3)
      if (data.reporteSospechoso && data.reporteSospechoso.trim() !== '') {
        console.log("🚨 Guardando reporte de actividad sospechosa");
        await saveSuspiciousActivityReport(
          data.reporteSospechoso,
          participantId,
          raffleSeller.seller_id
        );
      }

      // 6. Refresh the data and show success
      await refetchRaffleNumbers();
      
      // Set payment data for the voucher and close payment modal
      const completePaymentData = {
        ...data,
        participantId // Add participantId to the payment data (fix for TypeScript error)
      };
      
      setPaymentData(completePaymentData);
      setIsPaymentModalOpen(false);
      
      // Show digital voucher if allowed
      if (allowVoucherPrint) {
        console.log("📝 Mostrando comprobante digital");
        setIsVoucherOpen(true);
      } else {
        toast.success("Pago completado exitosamente");
      }
    } catch (error) {
      console.error("❌ Error al completar el pago:", error);
      toast.error("Error al procesar el pago. Por favor intente nuevamente.");
    }
  };

  const verifyNumbersAvailability = async (numbers: string[], raffleId: string): Promise<string[]> => {
    try {
      // Validar que raffleId esté definido
      if (!raffleId) {
        console.error("❌ Error crítico: raffleId está undefined en verifyNumbersAvailability");
        return numbers; // Return all numbers as unavailable if raffleId is missing
      }

      debugLog('verifyNumbersAvailability', { numbers, raffleId });
      
      const numbersInts = numbers.map(num => parseInt(num, 10));
      
      const { data: existingNumbers, error } = await supabase
        .from('raffle_numbers')
        .select('number, status, seller_id')
        .eq('raffle_id', raffleId)
        .in('number', numbersInts);
      
      if (error) {
        console.error('Error verificando disponibilidad:', error);
        return [];
      }
      
      // Check which numbers are unavailable (not available or not sold by current seller)
      const unavailableNumbers = existingNumbers
        .filter(n => n.status === 'sold' || (n.status === 'reserved' && n.seller_id !== raffleSeller.seller_id))
        .map(n => n.number.toString());
      
      return unavailableNumbers;
    } catch (error) {
      console.error('Error en verifyNumbersAvailability:', error);
      return [];
    }
  };
  
  const updateRaffleNumbersToSold = async (
    numbers: string[],
    participantId: string,
    paymentProofUrl: string | null,
    raffleId: string,
    sellerId: string
  ): Promise<void> => {
    try {
      console.log("🔵 Actualizando números a vendidos:", {
        numbers,
        participantId,
        hasProof: !!paymentProofUrl
      });

      // Get participant data to fill fields
      const { data: participantData } = await supabase
        .from('participants')
        .select('name, phone, email, cedula, direccion')
        .eq('id', participantId)
        .single();

      if (!participantData) {
        throw new Error('No se encontraron datos del participante');
      }

      const updatePromises = numbers.map(async (numStr) => {
        // First check if this number exists
        const { data: existingNumber, error: checkError } = await supabase
          .from('raffle_numbers')
          .select('id, status')
          .eq('raffle_id', raffleId)
          .eq('number', parseInt(numStr, 10))
          .maybeSingle();

        if (checkError) {
          console.error(`Error verificando número ${numStr}:`, checkError);
          throw checkError;
        }

        const commonData = {
          status: 'sold' as const,
          seller_id: sellerId,
          participant_id: participantId,
          payment_proof: paymentProofUrl,
          payment_approved: true,
          reservation_expires_at: null,
          participant_name: participantData.name,
          participant_phone: participantData.phone,
          participant_cedula: participantData.cedula
        };

        if (existingNumber) {
          // Update existing record
          console.log(`🔄 Actualizando número ${numStr}:`, commonData);
          const { error } = await supabase
            .from('raffle_numbers')
            .update(commonData)
            .eq('id', existingNumber.id);
            
          if (error) {
            console.error(`Error actualizando número ${numStr}:`, error);
            throw error;
          }
        } else {
          // Insert new record if it didn't exist
          const insertData = {
            ...commonData,
            raffle_id: raffleId,
            number: parseInt(numStr, 10),
          };
          console.log(`🆕 Insertando nuevo número ${numStr}:`, insertData);
          const { error } = await supabase
            .from('raffle_numbers')
            .insert(insertData);
            
          if (error) {
            console.error(`Error insertando número ${numStr}:`, error);
            throw error;
          }
        }
      });

      await Promise.all(updatePromises);
      console.log("✅ Todos los números actualizados/insertados al estado vendido");
    } catch (error) {
      console.error("❌ Error in updateRaffleNumbersToSold:", error);
      throw error;
    }
  };

  return {
    handleCompletePayment
  };
}
