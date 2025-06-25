import { useState, useCallback } from 'react';
import { PaymentFormData } from '@/types/payment';
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
  raffleNumbers: RaffleNumber[];
  refetchRaffleNumbers: () => Promise<any>;
  debugMode?: boolean;
  allowVoucherPrint?: boolean;
  reservationDays?: number;
  lotteryDate?: Date;
  rafflePrice?: number;
}

export const usePaymentProcessor = ({ 
  raffleSeller, 
  raffleId, 
  raffleNumbers, 
  refetchRaffleNumbers, 
  debugMode = false, 
  allowVoucherPrint = true,
  reservationDays = 5,
  lotteryDate,
  rafflePrice
}) => {
  console.log('[usePaymentProcessor.ts] 🚨 INICIALIZACIÓN CRÍTICA: Hook iniciado con parámetros:', {
    raffleSellerId: raffleSeller?.id,
    raffleId,
    raffleNumbersCount: raffleNumbers?.length || 0,
    debugMode,
    allowVoucherPrint,
    rafflePrice
  });

  // Validar que raffleId esté definido
  if (!raffleId) {
    console.error("❌ Error crítico: raffleId está undefined en usePaymentProcessor");
    raffleId = RAFFLE_ID;
    console.log("⚠️ Usando RAFFLE_ID de constantes como fallback:", RAFFLE_ID);
  }

  // Create a default complete seller object if one isn't provided
  const completeSeller: CompleteSeller = raffleSeller || {
    id: 'default',
    seller_id: SELLER_ID,
    cant_max: 100,
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
    debugMode,
    rafflePrice
  });
  
  const { handleReserveNumbers } = useReservationHandling({
    raffleSeller: completeSeller,
    raffleId,
    raffleNumbers,
    refetchRaffleNumbers,
    debugMode,
    reservationDays,
    lotteryDate,
    rafflePrice,
    validateSellerMaxNumbers
  });
  
  const { findOrCreateParticipant } = useParticipantManager({ 
    raffleId, 
    debugMode, 
    raffleSeller: completeSeller,
    setValidatedBuyerData: setBuyerInfo
  });

  // FUNCIÓN ULTRA-MEJORADA: Limpieza ULTRA-AGRESIVA y COMPLETA de TODAS las variables críticas
  const clearAllPaymentState = useCallback(() => {
    console.log("[usePaymentProcessor.ts] 🧹 LIMPIEZA ULTRA-AGRESIVA INICIADA: Ejecutando limpieza total de TODAS las variables críticas");
    
    try {
      // 1. Limpiar números seleccionados INMEDIATAMENTE
      console.log("[usePaymentProcessor.ts] 🔄 Limpiando selectedNumbers de:", selectedNumbers, "a []");
      setSelectedNumbers([]);
      console.log("[usePaymentProcessor.ts] ✅ selectedNumbers limpiado a []");
      
      // 2. Limpiar datos de pago INMEDIATAMENTE
      console.log("[usePaymentProcessor.ts] 🔄 Limpiando paymentData");
      setPaymentData(null);
      console.log("[usePaymentProcessor.ts] ✅ paymentData limpiado");
      
      // 3. Cerrar TODOS los modales INMEDIATAMENTE
      console.log("[usePaymentProcessor.ts] 🔄 Cerrando todos los modales");
      setIsPaymentModalOpen(false);
      setIsVoucherOpen(false);
      setIsConflictModalOpen(false);
      console.log("[usePaymentProcessor.ts] ✅ Todos los modales cerrados");
      
      // 4. Limpiar números de conflicto INMEDIATAMENTE
      console.log("[usePaymentProcessor.ts] 🔄 Limpiando conflictingNumbers");
      setConflictingNumbers([]);
      console.log("[usePaymentProcessor.ts] ✅ conflictingNumbers limpiado");
      
      // 5. Limpiar información del comprador del contexto INMEDIATAMENTE
      console.log("[usePaymentProcessor.ts] 🔄 Limpiando buyerInfo del contexto");
      setBuyerInfo(null);
      console.log("[usePaymentProcessor.ts] ✅ buyerInfo limpiado del contexto");
      
      console.log("[usePaymentProcessor.ts] ✅ LIMPIEZA ULTRA-AGRESIVA COMPLETADA - TODAS las variables críticas han sido limpiadas");
    } catch (error) {
      console.error("[usePaymentProcessor.ts] ❌ ERROR durante limpieza ultra-agresiva:", error);
    }
  }, [setSelectedNumbers, setPaymentData, setIsPaymentModalOpen, setIsVoucherOpen, setIsConflictModalOpen, setConflictingNumbers, setBuyerInfo, selectedNumbers]);

  // FUNCIÓN CORREGIDA: Limpieza post-guardado SIN limpiar selectedNumbers (para el voucher)
  const clearPaymentStatePostSave = useCallback(() => {
    console.log("[usePaymentProcessor.ts] 🧹 LIMPIEZA POST-GUARDADO CORREGIDA: Cerrando modal pero preservando selectedNumbers para voucher");
    
    try {
      // CORRECCIÓN CRÍTICA: NO limpiar selectedNumbers - se necesitan para el voucher
      console.log("[usePaymentProcessor.ts] 🎯 PRESERVANDO selectedNumbers para voucher:", selectedNumbers);
      
      // Cerrar modal de pago pero mantener voucher abierto
      console.log("[usePaymentProcessor.ts] 🔄 POST-SAVE: Cerrando modal de pago");
      setIsPaymentModalOpen(false);
      console.log("[usePaymentProcessor.ts] ✅ Modal de pago cerrado post-guardado");
      
      // Limpiar conflictos
      console.log("[usePaymentProcessor.ts] 🔄 POST-SAVE: Limpiando conflictos");
      setIsConflictModalOpen(false);
      setConflictingNumbers([]);
      console.log("[usePaymentProcessor.ts] ✅ Estados de conflicto limpiados post-guardado");
      
      // NO limpiar paymentData, selectedNumbers, ni buyerInfo - se necesitan para el voucher
      console.log("[usePaymentProcessor.ts] ✅ LIMPIEZA POST-GUARDADO CORREGIDA COMPLETADA - selectedNumbers preservados");
    } catch (error) {
      console.error("[usePaymentProcessor.ts] ❌ ERROR durante limpieza post-guardado:", error);
    }
  }, [setIsPaymentModalOpen, setIsConflictModalOpen, setConflictingNumbers, selectedNumbers]);

  // Create a wrapper for handleCompletePayment with proper modal separation
  const handleCompletePaymentWrapper = useCallback(async (data: PaymentFormData) => {
    console.log('[usePaymentProcessor.ts] 🚨 CRÍTICO: handleCompletePayment INICIADO');
    console.log('[usePaymentProcessor.ts] 🎯 CORRECCIÓN: rafflePrice disponible:', rafflePrice);
    console.log('[usePaymentProcessor.ts] 📋 Datos recibidos:', {
      buyerName: data.buyerName,
      paymentMethod: data.paymentMethod,
      hasPaymentProof: !!data.paymentProof,
      participantId: data.participantId,
      selectedNumbers: selectedNumbers,
      selectedCount: selectedNumbers?.length || 0,
      raffleId,
      raffleSellerId: raffleSeller?.seller_id,
      rafflePrice: rafflePrice
    });

    // VALIDACIÓN CRÍTICA TEMPRANA
    if (!selectedNumbers || selectedNumbers.length === 0) {
      console.error('[usePaymentProcessor.ts] ❌ CRÍTICO: selectedNumbers vacío en handleCompletePayment');
      console.error('[usePaymentProcessor.ts] 📋 Estado selectedNumbers:', selectedNumbers);
      return { success: false, message: 'No hay números seleccionados' };
    }

    if (!data.buyerName || data.buyerName.trim() === '') {
      console.error('[usePaymentProcessor.ts] ❌ CRÍTICO: buyerName vacío');
      return { success: false, message: 'Nombre del comprador requerido' };
    }

    if (!raffleSeller || !raffleSeller.seller_id) {
      console.error('[usePaymentProcessor.ts] ❌ CRÍTICO: raffleSeller inválido:', raffleSeller);
      return { success: false, message: 'Información del vendedor no disponible' };
    }

    try {
      console.log('[usePaymentProcessor.ts] 📤 LLAMANDO: handleCompletePayment from completePayment.ts');
      console.log('[usePaymentProcessor.ts] 🎯 CORRECCIÓN: Pasando rafflePrice:', rafflePrice);
      
      // Create the handler function with all the dependencies INCLUDING rafflePrice
      const completePaymentHandler = handleCompletePayment({
        raffleSeller: completeSeller,
        raffleId,
        selectedNumbers,
        raffleNumbers,
        setIsVoucherOpen,
        setPaymentData,
        setIsPaymentModalOpen,
        refetchRaffleNumbers,
        debugMode,
        allowVoucherPrint,
        rafflePrice
      });

      // Call the handler with the payment data
      const result = await completePaymentHandler(data);

      console.log('[usePaymentProcessor.ts] 📨 RESULTADO de handleCompletePayment:', {
        result,
        resultType: typeof result,
        hasResult: !!result
      });

      // CORRECCIÓN CRÍTICA: Ejecutar limpieza post-guardado SIN selectedNumbers después de operación exitosa
      if (!result || (result && typeof result === 'object' && 'success' in result && result.success)) {
        console.log('[usePaymentProcessor.ts] ✅ OPERACIÓN EXITOSA: Ejecutando limpieza post-guardado PRESERVANDO selectedNumbers');
        
        // Ejecutar con un pequeño delay para asegurar que todo se procesó
        setTimeout(() => {
          clearPaymentStatePostSave();
        }, 100);
      }

      // Handle the result properly
      if (result && typeof result === 'object') {
        if ('success' in result && result.success) {
          return { success: true };
        } else if ('conflictingNumbers' in result && result.conflictingNumbers && result.conflictingNumbers.length > 0) {
          return result;
        } else {
          return { success: false, message: ('message' in result && result.message) || 'Error en el pago' };
        }
      } else {
        return { success: true };
      }
    } catch (error) {
      console.error('[usePaymentProcessor.ts] ❌ ERROR CRÍTICO en handleCompletePayment:', error);
      
      // Limpieza post-error para evitar variables sucias
      console.log('[usePaymentProcessor.ts] 🧹 ERROR DETECTADO: Ejecutando limpieza post-error ULTRA-AGRESIVA');
      clearAllPaymentState();
      
      return { success: false, message: `Error: ${error}` };
    }
  }, [selectedNumbers, raffleSeller, raffleId, raffleNumbers, setIsVoucherOpen, setPaymentData, setIsPaymentModalOpen, refetchRaffleNumbers, debugMode, allowVoucherPrint, rafflePrice, clearPaymentStatePostSave, clearAllPaymentState]);

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
      console.log(`[DEBUG - PaymentProcessor - ${context}]:`, data);
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

    if (!numbers || numbers.length === 0) {
      toast.error('Seleccione al menos un número para comprar');
      return;
    }
    
    if (!raffleId) {
      console.error("❌ Error: raffleId está undefined en handleProceedToPayment. Abortando ejecución.");
      toast.error("Error de validación: ID de rifa no disponible.");
      return;
    }

    try {
      if (!(await validateSellerMaxNumbers(numbers.length))) {
        return;
      }

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

      const unavailableNumbers = await checkNumbersAvailability(numbers);
      if (unavailableNumbers.length > 0) {
        setConflictingNumbers(unavailableNumbers);
        setIsConflictModalOpen(true);
        return;
      }
      
      if (clickedButton === "Pagar") {
        console.log("🧹 usePaymentProcessor: Clearing buyer info for 'Pagar' flow");
        setBuyerInfo(null);
      }
      
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
      } : undefined
    });

    if (!numbers || numbers.length === 0) {
      toast.error('No se han seleccionados números para pagar');
      return;
    }
    
    if (!participantData) {
      console.error("❌ Error: participantData está undefined en handlePayReservedNumbers");
      toast.error("Error de validación: datos del participante no disponibles");
      return;
    }
    
    if (!raffleId) {
      console.error("❌ Error: raffleId está undefined en handlePayReservedNumbers. Abortando ejecución.");
      toast.error("Error de validación: ID de rifa no disponible.");
      return;
    }

    try {
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
    handleCompletePayment: handleCompletePaymentWrapper,
    verifyNumbersNotSoldByOthers,
    findOrCreateParticipant,
    getSoldNumbersCount,
    allowVoucherPrint,
    clearAllPaymentState,
    clearPaymentStatePostSave
  };
}
