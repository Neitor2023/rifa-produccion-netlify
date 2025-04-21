
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/components/PaymentModal';
import { toast } from 'sonner';
import { ValidatedBuyerInfo } from '@/types/participant';
import { useParticipantManager } from './useParticipantManager';
import { useNumberStatus } from './useNumberStatus';
import { useSelection } from './usePaymentProcessor/selection';
import { useModalState } from './usePaymentProcessor/modalState';
import { usePayment } from './usePaymentProcessor/payment';
import { useBuyerData } from './usePaymentProcessor/buyerData';

interface UsePaymentProcessorProps {
  raffleSeller: {
    id: string;
    seller_id: string;
    cant_max: number;
    active: boolean;
  } | null;
  raffleId: string;
  raffleNumbers: any[];
  refetchRaffleNumbers: () => Promise<any>;
  debugMode?: boolean;
}

export function usePaymentProcessor({
  raffleSeller,
  raffleId,
  raffleNumbers,
  refetchRaffleNumbers,
  debugMode = false
}: UsePaymentProcessorProps) {
  // Split out state logic
  const { selectedNumbers, setSelectedNumbers } = useSelection();
  const { isPaymentModalOpen, setIsPaymentModalOpen, isVoucherOpen, setIsVoucherOpen } = useModalState();
  const { paymentData, setPaymentData, handleProofCheck } = usePayment();
  const { validatedBuyerData, setValidatedBuyerData } = useBuyerData();

  // Utilidad de registro de depuración
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ${context}]:`, data);
    }
  };

  const { findOrCreateParticipant } = useParticipantManager({ raffleId, debugMode, raffleSeller });
  const { updateRaffleNumbersStatus } = useNumberStatus({ raffleSeller, raffleId, raffleNumbers, debugMode });

  // -----------------
  // VALIDACIÓN DEL VENDEDOR
  // -----------------

  /**
  * Valida que el vendedor no haya excedido su número máximo de ventas.
  * @param newNumbersCount Número de números nuevos a vender o reservar.
  * @returns Booleano que indica si la operación puede continuar.
  */
  const validateSellerMaxNumbers = async (newNumbersCount: number): Promise<boolean> => {
    if (!raffleSeller) {
      toast.error('Información del vendedor no disponible');
      return false;
    }

    const soldCount = getSoldNumbersCount(raffleSeller.seller_id);
    const maxAllowed = raffleSeller.cant_max;
    
    debugLog('Validación de números máximos de vendedores', { 
      soldCount, 
      newNumbersCount, 
      maxAllowed, 
      total: soldCount + newNumbersCount
    });
    
    if (soldCount + newNumbersCount > maxAllowed) {
      toast.error(`No puede vender más de ${maxAllowed} números en total. Ya ha vendido ${soldCount}.`);
      return false;
    }
    
    return true;
  };

  /**
  * Obtiene el recuento de números vendidos por un vendedor específico
  * @param sellerId El ID del vendedor
  * @returns Número de boletos vendidos
  */
  const getSoldNumbersCount = (sellerId: string): number => {
    if (!raffleNumbers || !sellerId) return 0;
    
    return raffleNumbers.filter(number => 
      number.seller_id === sellerId && 
      number.status === 'sold'
    ).length;
  };

  // -----------------
  // RAFFLE NUMBER OPERATIONS
  // -----------------

  /**
   * Handles the reservation of multiple raffle numbers
   * @param numbers Array of number strings to reserve
   * @param buyerPhone Buyer's phone number
   * @param buyerName Buyer's name
   */
  const handleReserveNumbers = async (numbers: string[], buyerPhone?: string, buyerName?: string) => {
    if (!raffleSeller?.seller_id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    
    if (!buyerPhone || !buyerName) {
      toast.error('Nombre y teléfono son obligatorios para apartar números');
      return;
    }
    
    // Validate against seller's maximum allowed numbers
    if (!(await validateSellerMaxNumbers(numbers.length))) {
      return;
    }
    
    try {
      debugLog('Reserve numbers called with', { numbers, buyerPhone, buyerName });
      
      // Find or create participant
      const participantId = await findOrCreateParticipant(buyerPhone, buyerName);
      debugLog('Participant ID for reservation', participantId);
      
      if (!participantId) {
        toast.error('No se pudo crear o encontrar al participante');
        return;
      }
      
      // Update or insert raffle numbers
      await updateRaffleNumbersStatus(numbers, 'reserved', participantId);
      
      // Refresh data and reset selection
      await refetchRaffleNumbers();
      setSelectedNumbers([]);
      
      toast.success(`${numbers.length} número(s) apartados exitosamente`);
    } catch (error) {
      console.error('Error reserving numbers:', error);
      toast.error('Error al apartar números');
    }
  };
  
  // -----------------
  // PAYMENT PROCESSING
  // -----------------
  
  /**
   * Initiates the payment process for selected numbers
   * @param numbers Array of number strings to purchase
   */
  const handleProceedToPayment = async (numbers: string[]) => {
    if (numbers.length === 0) {
      toast.error('Seleccione al menos un número para comprar');
      return;
    }
    
    try {
      // Validate against seller's maximum allowed numbers
      if (!(await validateSellerMaxNumbers(numbers.length))) {
        return;
      }
      
      // Check number availability
      const unavailableNumbers = await checkNumbersAvailability(numbers);
      
      if (unavailableNumbers.length > 0) {
        toast.error(`Números ${unavailableNumbers.join(', ')} no están disponibles`);
        return;
      }
      
      // Check for existing participant on reserved numbers
      await checkReservedNumbersParticipant(numbers);
      
      // Proceed with payment
      setSelectedNumbers(numbers);
      setIsPaymentModalOpen(true);
    } catch (error) {
      console.error('Error proceeding to payment:', error);
      toast.error('Error al procesar el pago');
    }
  };
  
  /**
   * Checks if numbers are available for purchase
   * @param numbers Array of number strings to check
   * @returns Array of unavailable numbers
   */
  const checkNumbersAvailability = async (numbers: string[]): Promise<string[]> => {
    return numbers.filter(numStr => {
      const existingNumber = raffleNumbers?.find(n => n.number === numStr);
      return existingNumber && 
             existingNumber.status !== 'available' && 
             (existingNumber.status !== 'reserved' || existingNumber.seller_id !== raffleSeller?.seller_id);
    });
  };
  
  /**
  * Comprueba si los números reservados tienen datos de participantes existentes
  * y establece los datos validados del comprador si están disponibles
  */
  const checkReservedNumbersParticipant = async (numbers: string[]) => {
    try {
      // Verifique si estamos procesando un número reservado con un participant_id existente
      const reservedNumbers = numbers.filter(numStr => {
        const existingNumber = raffleNumbers?.find(n => n.number === numStr);
        return existingNumber && existingNumber.status === 'reserved' && existingNumber.participant_id;
      });
      
      if (reservedNumbers.length > 0) {
        await fetchParticipantForReservedNumber(reservedNumbers[0]);
      } else {
        // Restablecer los datos del comprador validado si no hay números reservados
        setValidatedBuyerData(null);
      }
    } catch (error) {
      console.error('Error checking participant for reserved numbers:', error);
      // No lo tires aquí, ya que queremos proceder con el pago incluso si esto falla
    }
  };
  
  /**
   * Fetches participant data for a reserved number
   * @param numStr The reserved number string
   */
  const fetchParticipantForReservedNumber = async (numStr: string) => {
    const existingNumber = raffleNumbers?.find(n => n.number === numStr);
    
    if (existingNumber && existingNumber.participant_id) {
      // Obtener información del participante
      const { data: participant, error } = await supabase
        .from('participants')
        .select('name, phone, cedula')
        .eq('id', existingNumber.participant_id)
        .single();
      
      if (error) throw error;
      
      if (participant) {
        // Establecer datos de comprador validados
        setValidatedBuyerData({
          name: participant.name,
          phone: participant.phone,
          cedula: participant.cedula,
        });
        
        useEffect(() => {
          if (validatedBuyerData) {
            console.log("🔁 usePaymentProcessor validatedBuyerData antes de renderizar:", validatedBuyerData?.name, validatedBuyerData?.phone, validatedBuyerData?.cedula);
          } else {
            console.log("🔁 usePaymentProcessor validatedBuyerData no está definido");
          }
        }, [validatedBuyerData]);        
        debugLog('Set validated buyer data', participant);
      }
    }
  };
  
  // -----------------
  // PAYMENT COMPLETION
  // -----------------
  
  /**
   * Completes the payment process for selected numbers
   * @param data Payment form data from PaymentModal
   */
  const handleCompletePayment = async (data: PaymentFormData) => {
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
      
      // Validate against seller's maximum allowed numbers
      if (!(await validateSellerMaxNumbers(selectedNumbers.length))) {
        return;
      }
      
      // Upload payment proof if available
      const paymentProofUrl = await uploadPaymentProof(data.paymentProof);
      debugLog('Payment proof upload result', { paymentProofUrl });
      
      // Find or create participant
      const participantId = await processParticipant(data);
      debugLog('Participant processing result', { participantId });
      
      if (!participantId) {
        toast.error('Error al procesar la información del participante');
        return;
      }
      
      // Update numbers to sold status
      await updateNumbersToSold(selectedNumbers, participantId, paymentProofUrl);
      debugLog('Numbers updated to sold', { 
        count: selectedNumbers.length, 
        numbers: selectedNumbers 
      });
      
      // Refresh data
      await refetchRaffleNumbers();
      
      // Set payment data and show voucher
      setPaymentData({
        ...data,
        paymentProof: paymentProofUrl
      });
      
      setIsPaymentModalOpen(false);
      setIsVoucherOpen(true);
      
      toast.success('Pago completado exitosamente');
      debugLog('Payment completed successfully', null);
    } catch (error) {
      console.error('Error completing payment:', error);
      debugLog('Payment completion error', error);
      toast.error('Error al completar el pago');
    }
  };
  
  /**
   * Uploads payment proof to Supabase storage
   * @param paymentProof File object or URL string
   * @returns Public URL of the uploaded file or null
   */
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
  
  /**
   * Processes participant data during payment completion
   * @param data Payment form data
   * @returns Participant ID or null if operation failed
   */
  const processParticipant = async (data: PaymentFormData): Promise<string | null> => {
    try {
      // Check for existing participant
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id')
        .eq('phone', data.buyerPhone)
        .eq('raffle_id', raffleId)
        .maybeSingle();
      
      // Update existing participant
      if (existingParticipant) {
        const participantId = existingParticipant.id;
        
        await supabase
          .from('participants')
          .update({ name: data.buyerName })
          .eq('id', participantId);
          
        return participantId;
      } 
      
      // Create new participant
      const { data: newParticipant, error: participantError } = await supabase
        .from('participants')
        .insert({
          name: data.buyerName,
          phone: data.buyerPhone,
          email: '',
          raffle_id: raffleId,
          seller_id: raffleSeller.seller_id
        })
        .select('id')
        .single();
      
      if (participantError) throw participantError;
      
      return newParticipant.id;
    } catch (error) {
      console.error('Error processing participant:', error);
      throw error;
    }
  };
  
  /**
   * Updates raffle numbers to sold status
   * @param numbers Array of number strings to mark as sold
   * @param participantId Participant ID to associate with numbers
   * @param paymentProofUrl Optional URL to payment proof
   */
  const updateNumbersToSold = async (numbers: string[], participantId: string, paymentProofUrl: string | null) => {
    const updatePromises = numbers.map(async (numStr) => {
      const num = parseInt(numStr);
      const existingNumber = raffleNumbers?.find(n => n.number === numStr);
      
      if (existingNumber) {
        // If there's already a payment proof, don't overwrite it
        const proofToUse = paymentProofUrl || existingNumber.payment_proof;
        
        const { error } = await supabase
          .from('raffle_numbers')
          .update({ 
            status: 'sold', 
            seller_id: raffleSeller.seller_id,
            participant_id: participantId,
            payment_proof: proofToUse,
            payment_approved: true,
            reservation_expires_at: null
          })
          .eq('id', existingNumber.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('raffle_numbers')
          .insert({ 
            raffle_id: raffleId, 
            number: num, 
            status: 'sold', 
            seller_id: raffleSeller.seller_id,
            participant_id: participantId,
            payment_proof: paymentProofUrl,
            payment_approved: true
          });
        
        if (error) throw error;
      }
    });
    
    await Promise.all(updatePromises);
  };

  useEffect(() => {
    if (validatedBuyerData) {
      console.log("🔁 usePaymentProcessor validatedBuyerData antes de renderizar:", validatedBuyerData?.name, validatedBuyerData?.phone, validatedBuyerData?.cedula);
    } else {
      console.log("🔁 usePaymentProcessor validatedBuyerData no está definido");
    }
  }, [validatedBuyerData]);

  return {
    selectedNumbers,
    setSelectedNumbers,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData,
    setPaymentData,
    validatedBuyerData,
    debugMode,
    handleReserveNumbers,
    handleProceedToPayment,
    handleCompletePayment,
    findOrCreateParticipant,
    getSoldNumbersCount
  };
}
