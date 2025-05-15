import { useState } from 'react';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { ValidatedBuyerInfo } from '@/types/participant';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useParticipantManager } from './useParticipantManager';
import { useSelection } from './usePaymentProcessor/selection';
import { useModalState } from './usePaymentProcessor/modalState';
import { usePayment } from './usePaymentProcessor/payment';
import { useSellerValidation } from './usePaymentProcessor/sellerValidation';
import { useNumberAvailability } from './usePaymentProcessor/numberAvailability';
import { usePaymentCompletion } from './usePaymentProcessor/paymentCompletion';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';
import { useReservationHandling } from './usePaymentProcessor/reservationHandling';
import { useCompletePayment } from './usePaymentProcessor/completePayment';
import { SELLER_ID, RAFFLE_ID } from '@/lib/constants';

// Define a complete seller type to ensure we always pass a fully-formed seller object
interface CompleteSeller {
  id: string;
  seller_id: string;
  cant_max: number;
  active: boolean;
}

interface UsePaymentProcessorProps {
  raffleSeller: CompleteSeller | null;
  raffleId: string;
  raffleNumbers: any[];
  refetchRaffleNumbers: () => Promise<any>;
  debugMode?: boolean;
  allowVoucherPrint?: boolean;
  reservationDays?: number;
  lotteryDate?: Date;
}

export function usePaymentProcessor({
  raffleSeller,
  raffleId,
  raffleNumbers,
  refetchRaffleNumbers,
  debugMode = false,
  allowVoucherPrint = true,
  reservationDays,
  lotteryDate
}: UsePaymentProcessorProps) {
  // Validar que raffleId esté definido
  if (!raffleId) {
    console.error("❌ Error crítico: raffleId está undefined en usePaymentProcessor");
    // Usar el valor de RAFFLE_ID como fallback
    raffleId = RAFFLE_ID;
    console.log("⚠️ Usando RAFFLE_ID de constantes como fallback:", RAFFLE_ID);
  }

  // Create a default complete seller object if one isn't provided
  const completeSeller: CompleteSeller = raffleSeller || {
    id: 'default',
    seller_id: SELLER_ID,
    cant_max: 100, // Default maximum
    active: true,
  };

  const { selectedNumbers, setSelectedNumbers } = useSelection();
  const { isPaymentModalOpen, setIsPaymentModalOpen, isVoucherOpen, setIsVoucherOpen } = useModalState();
  const { paymentData, setPaymentData } = usePayment();
  const { validateSellerMaxNumbers, getSoldNumbersCount } = useSellerValidation(completeSeller, raffleNumbers, debugMode);
  
  // Use the context instead of local state
  const { buyerInfo, setBuyerInfo } = useBuyerInfo();
  
  const { checkNumbersAvailability } = useNumberAvailability({ 
    raffleNumbers, 
    raffleSeller: completeSeller, 
    setValidatedBuyerData: setBuyerInfo, 
    debugMode 
  });
  
  const { uploadPaymentProof, processParticipant } = usePaymentCompletion({
    raffleSeller: completeSeller,
    raffleId,
    setValidatedBuyerData: setBuyerInfo,
    debugMode
  });
  
  const { handleReserveNumbers } = useReservationHandling({
    raffleSeller: completeSeller,
    raffleId,
    raffleNumbers,
    refetchRaffleNumbers,
    debugMode,
    reservationDays,
    lotteryDate,
    validateSellerMaxNumbers
  });
  
  const { findOrCreateParticipant } = useParticipantManager({ 
    raffleId, 
    debugMode, 
    raffleSeller: completeSeller,
    setValidatedBuyerData: setBuyerInfo
  });

  const { handleCompletePayment } = useCompletePayment({
    raffleSeller: completeSeller,
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
  });

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ${context}]:`, data);
    }
  };

  // Enhanced function for verifying numbers not sold by other sellers
  const verifyNumbersNotSoldByOthers = async (numbers: string[]): Promise<boolean> => {
    console.log("🔍 usePaymentProcessor: Verificando si los números están vendidos por otros vendedores:", numbers);
    
    try {
      if (!numbers || numbers.length === 0) {
        return true;
      }
      
      // Validar que raffleId esté definido
      if (!raffleId) {
        console.error("❌ Error: raffleId está undefined en verifyNumbersNotSoldByOthers. Abortando ejecución.");
        toast.error("Error de validación: ID de rifa no disponible.");
        return false;
      }
      
      // Convert strings to integers for database query
      const numberInts = numbers.map(num => parseInt(num, 10));
      
      debugLog("verifyNumbersNotSoldByOthers", {
        numbers,
        numberInts,
        raffleId,
        sellerId: raffleSeller?.seller_id || SELLER_ID
      });
      
      // Check if any of these numbers are sold by another seller
      const { data: soldByOthers, error } = await supabase
        .from('raffle_numbers')
        .select('number, seller_id')
        .eq('raffle_id', raffleId)
        .in('number', numberInts)
        .eq('status', 'sold');
      
      if (error) {
        console.error("❌ usePaymentProcessor: Error al verificar números vendidos:", error);
        throw error;
      }
      
      debugLog("verifyNumbersNotSoldByOthers - query result", { soldByOthers });
      
      if (soldByOthers && soldByOthers.length > 0) {
        // Filter to only include numbers sold by other sellers
        const soldByOtherSellers = soldByOthers.filter(
          item => item.seller_id !== (raffleSeller?.seller_id || SELLER_ID)
        );
        
        debugLog("verifyNumbersNotSoldByOthers - filtered result", { 
          soldByOtherSellers,
          currentSellerId: raffleSeller?.seller_id || SELLER_ID
        });
        
        if (soldByOtherSellers && soldByOtherSellers.length > 0) {
          const soldNumbers = soldByOtherSellers.map(item => item.number).join(', ');
          toast.error(`Número(s) ${soldNumbers} ya han sido vendidos por otro vendedor. Por favor elija otros números.`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("❌ usePaymentProcessor: Error en verifyNumbersNotSoldByOthers:", error);
      toast.error("Error al verificar disponibilidad de números");
      return false;
    }
  };

  const handleProceedToPayment = async (numbers: string[], participantData?: ValidatedBuyerInfo, clickedButton?: string) => {
    console.log("💰 usePaymentProcessor: handleProceedToPayment called with:", {
      numbers,
      participantData: participantData ? {
        id: participantData.id,
        name: participantData.name,
        // Omit sensitive data from logs
      } : undefined,
      clickedButton
    });

    // Validar que los números estén definidos y no estén vacíos
    if (!numbers || numbers.length === 0) {
      toast.error('Seleccione al menos un número para comprar');
      return;
    }
    
    // Validar que raffleId esté definido
    if (!raffleId) {
      console.error("❌ Error: raffleId está undefined en handleProceedToPayment. Abortando ejecución.");
      toast.error("Error de validación: ID de rifa no disponible.");
      return;
    }

    try {
      if (!(await validateSellerMaxNumbers(numbers.length))) {
        return;
      }

      // For "Pagar Directo", we need to verify that numbers are not sold by other sellers
      if (clickedButton === "Pagar") {
        const notSoldByOthers = await verifyNumbersNotSoldByOthers(numbers);
        if (!notSoldByOthers) {
          return;
        }
      }

      // Check availability with proper number type conversion
      const unavailableNumbers = await checkNumbersAvailability(numbers);
      if (unavailableNumbers.length > 0) {
        toast.error(`Los números ${unavailableNumbers.join(', ')} no están disponibles`);
        return;
      }
      
      // For "Pagar" flow specifically, we need to clear buyerInfo since this is a new buyer
      if (clickedButton === "Pagar") {
        console.log("🧹 usePaymentProcessor: Clearing buyer info for 'Pagar' flow");
        setBuyerInfo(null);
      }
      
      setSelectedNumbers(numbers);
      setIsPaymentModalOpen(true);
      
    } catch (error) {
      console.error('usePaymentProcessor: ❌ Error proceeding to payment:', error);
      toast.error('Error al procesar el pago');
    }
  };

  const handlePayReservedNumbers = async (numbers: string[], participantData: ValidatedBuyerInfo) => {
    console.log("💰 usePaymentProcessor: handlePayReservedNumbers called with:", {
      numbers,
      participantData: participantData ? {
        id: participantData.id,
        name: participantData.name,
        // Omit sensitive data from logs
      } : undefined
    });

    // Validar que los números estén definidos y no estén vacíos
    if (!numbers || numbers.length === 0) {
      toast.error('No se han seleccionado números para pagar');
      return;
    }
    
    // Validar que participantData esté definido
    if (!participantData) {
      console.error("❌ Error: participantData está undefined en handlePayReservedNumbers");
      toast.error("Error de validación: datos del participante no disponibles");
      return;
    }
    
    // Validar que raffleId esté definido
    if (!raffleId) {
      console.error("❌ Error: raffleId está undefined en handlePayReservedNumbers. Abortando ejecución.");
      toast.error("Error de validación: ID de rifa no disponible.");
      return;
    }

    try {
      setBuyerInfo(participantData);
      setSelectedNumbers(numbers);
      
      setIsPaymentModalOpen(true);
      
      debugLog("usePaymentProcessor: Payment modal opened with validated data:", participantData);
    } catch (error) {
      console.error('usePaymentProcessor: ❌ Error proceeding to payment of reserved numbers:', error);
      toast.error('Error al procesar el pago de números reservados');
    }
  };

  return {
    selectedNumbers,
    setSelectedNumbers,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData,
    setPaymentData,
    debugMode,
    handleReserveNumbers,
    handleProceedToPayment,
    handlePayReservedNumbers,
    handleCompletePayment,
    findOrCreateParticipant,
    getSoldNumbersCount,
    allowVoucherPrint
  };
}
