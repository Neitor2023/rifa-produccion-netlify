
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { updateNumbersToSold } from './numberStatusUpdates';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
      clickedButtonType: data.clickedButtonType
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
      // Ensure seller_id is set
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
        const validNumbersToUpdate = reservedNumbers.map(item => 
          item.number.toString().padStart(2, '0')
        );
        
        // If no reserved numbers found, warn user
        if (validNumbersToUpdate.length === 0) {
          console.warn("⚠️ No reserved numbers found for this participant");
          toast.warning("No se encontraron números reservados para este participante");
          return;
        } else {
          console.log("✅ Updating payment status for numbers:", validNumbersToUpdate);
          const result = await updateNumbersToSold({
            numbers: validNumbersToUpdate, 
            participantId, 
            paymentProofUrl, 
            raffleNumbers: [], // Passing empty array as it's not used in this context
            raffleSeller,
            raffleId
          });
          
          // Handle conflict cases
          if (result && !result.success && result.conflictingNumbers && result.conflictingNumbers.length > 0) {
            handleNumberConflict(result.conflictingNumbers);
            return;
          }
        }
      } else {
        // For "Pagar Directo", proceed with selected numbers
        console.log("💵 'Pagar Directo' flow - using selected numbers:", selectedNumbers);
        const result = await updateNumbersToSold({
          numbers: selectedNumbers, 
          participantId, 
          paymentProofUrl, 
          raffleNumbers: [], // Passing empty array as it's not used in this context
          raffleSeller,
          raffleId
        });
        
        // Handle conflict cases
        if (result && !result.success && result.conflictingNumbers && result.conflictingNumbers.length > 0) {
          handleNumberConflict(result.conflictingNumbers);
          return;
        }
      }
      
      // 5. Save suspicious activity report if provided
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
        participantId
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

  const handleNumberConflict = (conflictingNumbers: string[]) => {
    toast.error(
      `Estos números ya pertenecen a otro participante: ${conflictingNumbers.join(', ')}. Por favor elija otros números.`,
      {
        duration: 6000,
        action: {
          label: "Entendido",
          onClick: () => {
            // Close any open modals and reset state
            setIsPaymentModalOpen(false);
            refetchRaffleNumbers();
          }
        }
      }
    );
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
      
      // Check which numbers are unavailable (sold or not sold by current seller)
      const unavailableNumbers = existingNumbers
        .filter(n => n.status === 'sold' || (n.status === 'reserved' && n.seller_id !== raffleSeller.seller_id))
        .map(n => n.number.toString().padStart(2, '0'));
      
      return unavailableNumbers;
    } catch (error) {
      console.error('Error en verifyNumbersAvailability:', error);
      return [];
    }
  };
  
  return {
    handleCompletePayment
  };
}
