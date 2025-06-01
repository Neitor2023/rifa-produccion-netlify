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
import { handleCompletePayment, ConflictResult } from './usePaymentProcessor/completePayment';
import { SELLER_ID, RAFFLE_ID } from '@/lib/constants';
import { RaffleNumber } from '@/lib/constants/types';

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
  raffleNumbers: RaffleNumber[]; // Use the imported RaffleNumber type
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
  
  // State for number conflict modal
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictingNumbers, setConflictingNumbers] = useState<string[]>([]);
  
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

  // CORRECCIÓN CRÍTICA: Función modificada para NO limpiar paymentData prematuramente
  const clearPaymentStateExceptSelectionAndData = () => {
    console.log("[usePaymentProcessor.ts] 🧹 Limpieza parcial (preservando números seleccionados y paymentData para voucher)");
    
    try {
      // NO limpiar números seleccionados ni paymentData aquí - se harán cuando se cierre el voucher
      
      // Limpiar datos del participante
      setBuyerInfo(null);
      console.log("[usePaymentProcessor.ts] ✅ buyerInfo limpiado");
      
      // NO limpiar paymentData aquí - se necesita para el voucher
      console.log("[usePaymentProcessor.ts] ✅ paymentData PRESERVADO para voucher");
      
      // Cerrar modales de conflicto pero NO el voucher
      setIsConflictModalOpen(false);
      setConflictingNumbers([]);
      console.log("[usePaymentProcessor.ts] ✅ Modales de conflicto cerrados");
      
      console.log("[usePaymentProcessor.ts] ✅ Limpieza parcial completada - manteniendo datos para voucher");
    } catch (error) {
      console.error("[usePaymentProcessor.ts] ❌ Error durante limpieza parcial:", error);
    }
  };

  // Nueva función para limpieza completa cuando se cierre el voucher
  const clearAllPaymentState = () => {
    console.log("[usePaymentProcessor.ts] 🧹 Limpieza COMPLETA tras cierre de voucher");
    
    try {
      // Ahora sí limpiar números seleccionados
      setSelectedNumbers([]);
      console.log("[usePaymentProcessor.ts] ✅ selectedNumbers limpiado");
      
      // Ahora sí limpiar paymentData
      setPaymentData(null);
      console.log("[usePaymentProcessor.ts] ✅ paymentData limpiado");
      
      // Limpiar cualquier estado restante
      setBuyerInfo(null);
      
      // Cerrar voucher modal si todavía está abierto
      setIsVoucherOpen(false);
      console.log("[usePaymentProcessor.ts] ✅ Modal de voucher cerrado");
      
      // Cerrar otros modales
      setIsPaymentModalOpen(false);
      setIsConflictModalOpen(false);
      setConflictingNumbers([]);
      
      console.log("[usePaymentProcessor.ts] ✅ Limpieza COMPLETA finalizada");
    } catch (error) {
      console.error("[usePaymentProcessor.ts] ❌ Error durante limpieza completa:", error);
    }
  };

  // Create a wrapper for handleCompletePayment with proper modal separation
  const completePayment = async (formData: PaymentFormData): Promise<ConflictResult | void> => {
    try {
      console.log("[usePaymentProcessor.ts] 💰 Iniciando proceso de pago completo");
      console.log("[usePaymentProcessor.ts] 📋 Tipo de pago:", formData.clickedButtonType);
      console.log("[usePaymentProcessor.ts] 📋 Participante ID:", formData.participantId);
      console.log("[usePaymentProcessor.ts] 📋 Números seleccionados:", selectedNumbers);
      
      const result = await handleCompletePayment({ 
        raffleSeller: completeSeller,
        raffleId,
        selectedNumbers,
        raffleNumbers,
        setIsVoucherOpen,
        setPaymentData,
        setIsPaymentModalOpen,
        refetchRaffleNumbers,
        debugMode,
        allowVoucherPrint
      })(formData);

      // CORRECCIÓN CRÍTICA: Manejar el cierre de modales por separado SIN limpiar paymentData
      if (!result || (result && result.success)) {
        console.log("[usePaymentProcessor.ts] ✅ Pago completado exitosamente");
        
        // Cerrar PaymentModal inmediatamente después del pago exitoso
        console.log("[usePaymentProcessor.ts] 🚪 Cerrando PaymentModal tras pago exitoso");
        setIsPaymentModalOpen(false);
        
        // CORRECCIÓN: Usar la función que NO limpia paymentData
        setTimeout(() => {
          console.log("[usePaymentProcessor.ts] 🧹 Ejecutando limpieza parcial SIN afectar paymentData");
          clearPaymentStateExceptSelectionAndData();
          
          // Recargar números para refrescar el estado
          refetchRaffleNumbers().then(() => {
            console.log("[usePaymentProcessor.ts] ✅ Números de rifa recargados después de pago");
          }).catch((error) => {
            console.error("[usePaymentProcessor.ts] ❌ Error al recargar números:", error);
          });
        }, 1000);
      } else {
        console.log("[usePaymentProcessor.ts] ⚠️ Pago no exitoso, manteniendo PaymentModal abierto para retry");
      }

      return result;
    } catch (error) {
      console.error("[usePaymentProcessor.ts] ❌ Error en completePayment:", error);
      throw error;
    }
  };

  // Function to verify numbers are not sold by others
  const verifyNumbersNotSoldByOthers = async (numbers: string[]): Promise<ConflictResult> => {
    try {
      if (debugMode) {
        console.log('[DEBUG - verifyNumbersNotSoldByOthers] Checking numbers:', numbers);
      }
      
      const { data, error } = await supabase
        .from('raffle_numbers')
        .select('number, status, seller_id')
        .eq('raffle_id', raffleId)
        .in('number', numbers.map(n => parseInt(n)))
        .not('status', 'eq', 'available');
      
      if (error) throw error;
      
      // Filter out numbers belonging to this seller and with status "reserved"
      const conflictingNumbers = data
        .filter(n => {
          const isReservedByThisSeller = n.status === 'reserved' && 
                                       n.seller_id === completeSeller.seller_id;
          return !isReservedByThisSeller;
        })
        .map(n => n.number.toString());
      
      if (conflictingNumbers.length > 0) {
        if (debugMode) {
          console.log('[DEBUG - verifyNumbersNotSoldByOthers] Found conflicts:', conflictingNumbers);
        }
        return { 
          success: false, 
          conflictingNumbers,
          message: 'Algunos números ya no están disponibles'
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error verifying numbers availability:', error);
      return { 
        success: false,
        message: 'Error verificando disponibilidad de números'
      };
    }
  };

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ${context}]:`, data);
    }
  };

  const handleConflictModalClose = () => {
    console.log("[usePaymentProcessor.ts] 🧹 Cerrando modal de conflicto y limpiando estado");
    setIsConflictModalOpen(false);
    setConflictingNumbers([]);
    setSelectedNumbers([]);
    setIsPaymentModalOpen(false);
    refetchRaffleNumbers();
  };

  const handleProceedToPayment = async (numbers: string[], participantData?: ValidatedBuyerInfo, clickedButton?: string) => {
    console.log("💰 usePaymentProcessor: handleProceedToPayment called with:", {
      numbers,
      clickedButton,
      participantData: participantData ? {
        id: participantData.id,
        name: participantData.name,
        phone: participantData.phone,
        email: participantData.email
      } : undefined
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
        const verificationResult = await verifyNumbersNotSoldByOthers(numbers);
        if (!verificationResult.success) {
          if (verificationResult.conflictingNumbers && verificationResult.conflictingNumbers.length > 0) {
            setConflictingNumbers(verificationResult.conflictingNumbers);
            setIsConflictModalOpen(true);
          } else {
            toast.error(`Los números seleccionados no están disponibles. Por favor elija otros números.`);
          }
          return;
        }
      }

      // Check availability with proper number type conversion
      const unavailableNumbers = await checkNumbersAvailability(numbers);
      if (unavailableNumbers.length > 0) {
        setConflictingNumbers(unavailableNumbers);
        setIsConflictModalOpen(true);
        return;
      }
      
      // For "Pagar" flow specifically, we need to clear buyerInfo since this is a new buyer
      if (clickedButton === "Pagar") {
        console.log("🧹 usePaymentProcessor: Clearing buyer info for 'Pagar' flow");
        setBuyerInfo(null);
      }
      
      // CORRECCIÓN CRÍTICA: Para "Pagar Apartados", establecer la información del participante si existe
      if (clickedButton === "Pagar Apartados" && participantData) {
        console.log("💾 usePaymentProcessor: Setting buyer info for 'Pagar Apartados' flow:", {
          id: participantData.id,
          name: participantData.name,
          phone: participantData.phone,
          email: participantData.email || 'Sin email'
        });
        setBuyerInfo(participantData);
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
        phone: participantData.phone,
        email: participantData.email || 'Sin email'
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
      // Verify numbers are still available and not sold by others
      const verificationResult = await verifyNumbersNotSoldByOthers(numbers);
      if (!verificationResult.success) {
        if (verificationResult.conflictingNumbers && verificationResult.conflictingNumbers.length > 0) {
          setConflictingNumbers(verificationResult.conflictingNumbers);
          setIsConflictModalOpen(true);
        } else {
          toast.error(`Los números reservados ya no están disponibles. Por favor elija otros números.`);
        }
        return;
      }
      
      // CORRECCIÓN: Asegurar que el teléfono esté en formato correcto antes de establecer buyerInfo
      const updatedParticipantData = {
        ...participantData,
        phone: participantData.phone || '',
        email: participantData.email || ''
      };
      
      setBuyerInfo(updatedParticipantData);
      setSelectedNumbers(numbers);
      
      setIsPaymentModalOpen(true);
      
      debugLog("usePaymentProcessor: Payment modal opened with validated data:", updatedParticipantData);
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
    isConflictModalOpen,
    setIsConflictModalOpen,
    conflictingNumbers,
    setConflictingNumbers,
    handleConflictModalClose,
    debugMode,
    handleReserveNumbers,
    handleProceedToPayment,
    handlePayReservedNumbers,
    handleCompletePayment: completePayment,
    verifyNumbersNotSoldByOthers,
    findOrCreateParticipant,
    getSoldNumbersCount,
    allowVoucherPrint,
    clearAllPaymentState // Exportar función de limpieza completa para uso desde DigitalVoucher
  };
}
