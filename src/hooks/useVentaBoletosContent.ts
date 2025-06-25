import { useState, useEffect } from 'react';
import { useRaffleData } from '@/hooks/useRaffleData';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';
import { SELLER_ID, RAFFLE_ID } from '@/utils/setGlobalIdsFromUrl';
import { ConflictResult } from '@/hooks/usePaymentProcessor/completePayment';
import { RaffleNumber } from '@/lib/constants/types';
import { PaymentFormData } from '@/types/payment';

export function useVentaBoletosContent() {
  console.log("[useVentaBoletosContent.ts] 🚨 INVESTIGACIÓN CRÍTICA: Hook iniciado con IDs:", { RAFFLE_ID, SELLER_ID });
  
  // State for the clicked button
  const [clickedButton, setClickedButton] = useState<string | undefined>(undefined);
  
  // Local state for voucher payment data
  const [voucherPaymentData, setVoucherPaymentData] = useState<PaymentFormData | null>(null);
  
  // Access buyer info from context
  const { buyerInfo, setBuyerInfo } = useBuyerInfo();
  
  // VALIDACIÓN CRÍTICA: Verificar IDs antes de continuar
  if (!RAFFLE_ID) {
    console.error("[useVentaBoletosContent.ts] ❌ CRÍTICO: RAFFLE_ID no definido, abortando");
    throw new Error("RAFFLE_ID no está definido");
  }
  
  if (!SELLER_ID) {
    console.error("[useVentaBoletosContent.ts] ❌ CRÍTICO: SELLER_ID no definido, abortando");
    throw new Error("SELLER_ID no está definido");
  }
  
  // Get raffle data
  const { 
    seller,
    raffle,
    prizes,
    prizeImages,
    organization,
    raffleNumbers,
    raffleSeller,
    formatNumbersForGrid,
    isLoading,
    refetchRaffleNumbers,
    maxNumbersAllowed,
    debugMode,
    allowVoucherPrint
  } = useRaffleData({ 
    raffleId: RAFFLE_ID, 
    sellerId: SELLER_ID 
  });
  
  // Calculate rafflePrice from raffle data
  const rafflePrice = raffle?.price || 0;
  
  console.log("[useVentaBoletosContent.ts] 🚨 INVESTIGACIÓN CRÍTICA: Datos obtenidos:", {
    hayRaffle: !!raffle,
    raffleId: raffle?.id,
    rafflePrice,
    haySeller: !!seller,
    sellerId: seller?.id,
    hayRaffleSeller: !!raffleSeller,
    raffleSellerActivo: raffleSeller?.active,
    raffleNumbersCount: raffleNumbers?.length || 0,
    allowVoucherPrint
  });
  
  // Convert lottery date string to Date object if it exists
  const lotteryDate = raffle?.date_lottery ? new Date(raffle.date_lottery) : undefined;
  const reservationDays = raffle?.reservation_days;
  
  // Cast raffleNumbers to the RaffleNumber type
  const typedRaffleNumbers: RaffleNumber[] = raffleNumbers as unknown as RaffleNumber[];
  
  // Payment processor hook with raffle price
  const {
    selectedNumbers,
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
    handleReserveNumbers,
    handleProceedToPayment,
    handleCompletePayment: originalHandleCompletePayment,
    getSoldNumbersCount,
    clearAllPaymentState,
    clearPaymentStatePostSave
  } = usePaymentProcessor({
    raffleSeller: seller ? { 
      id: raffleSeller?.id || 'default', 
      seller_id: seller.id,
      active: raffleSeller?.active || true,
      cant_max: raffleSeller?.cant_max || maxNumbersAllowed,
    } : null,
    raffleId: RAFFLE_ID,
    raffleNumbers: typedRaffleNumbers,
    refetchRaffleNumbers,
    debugMode,
    allowVoucherPrint,
    reservationDays,
    lotteryDate,
    rafflePrice
  });

  // FUNCIÓN CRÍTICA: Limpieza ULTRA-AGRESIVA inmediata para "Pagar Directo"
  const executeImmediateCleanupForPagarDirecto = () => {
    console.log("[useVentaBoletosContent.ts] 🧹 LIMPIEZA ULTRA-AGRESIVA INMEDIATA para 'Pagar Directo'");
    
    // 1. Limpiar contexto de buyer info INMEDIATAMENTE
    setBuyerInfo(null);
    console.log("[useVentaBoletosContent.ts] ✅ buyerInfo limpiado inmediatamente");
    
    // 2. Limpiar estados locales INMEDIATAMENTE
    setVoucherPaymentData(null);
    setClickedButton(undefined);
    console.log("[useVentaBoletosContent.ts] ✅ Estados locales limpiados inmediatamente");
    
    // 3. Ejecutar limpieza agresiva del payment processor INMEDIATAMENTE
    clearAllPaymentState();
    console.log("[useVentaBoletosContent.ts] ✅ Payment processor limpiado inmediatamente");
    
    console.log("[useVentaBoletosContent.ts] ✅ LIMPIEZA ULTRA-AGRESIVA INMEDIATA COMPLETADA");
  };

  // Handle proceeding to payment with the button type
  const handleProceedToPaymentWithButton = async (numbers: string[], participantData?: any, buttonType?: string) => {
    console.log("[useVentaBoletosContent.ts] 🚨 INVESTIGACIÓN CRÍTICA: handleProceedToPaymentWithButton llamado:", {
      numbers,
      buttonType,
      hasParticipantData: !!participantData,
      numbersCount: numbers?.length || 0
    });
    
    if (!numbers || numbers.length === 0) {
      console.error("[useVentaBoletosContent.ts] ❌ CRÍTICO: No hay números para procesar");
      return;
    }
    
    setClickedButton(buttonType);
    
    // LIMPIEZA INMEDIATA Y AGRESIVA PARA "PAGAR DIRECTO"
    if (buttonType === "Pagar") {
      console.log("[useVentaBoletosContent.ts] 🧹 EJECUTANDO LIMPIEZA INMEDIATA para 'Pagar Directo'");
      executeImmediateCleanupForPagarDirecto();
    }
    
    // NUEVA CONDICIÓN: LIMPIEZA INMEDIATA Y AGRESIVA PARA "PAGAR DIRECTO" (buttonType === "direct")
    if (buttonType === "direct") {
      console.log("[useVentaBoletosContent.ts] 🧹 EJECUTANDO LIMPIEZA AGRESIVA para 'Pagar Directo'");
      executeImmediateCleanupForPagarDirecto();
    }
    
    console.log("[useVentaBoletosContent.ts] 🚨 INVESTIGACIÓN: Llamando handleProceedToPayment con:", {
      numbers,
      buttonType,
      participantData
    });
    
    try {
      await handleProceedToPayment(numbers, participantData, buttonType);
      console.log("[useVentaBoletosContent.ts] ✅ handleProceedToPayment completado exitosamente");
    } catch (error) {
      console.error("[useVentaBoletosContent.ts] ❌ ERROR en handleProceedToPayment:", error);
    }
  };

  // CORRECCIÓN CRÍTICA: Función wrapper MEJORADA
  const handleCompletePayment = async (data: PaymentFormData): Promise<ConflictResult | void> => {
    console.log('[useVentaBoletosContent.ts] 🚨 INVESTIGACIÓN CRÍTICA: wrappedHandleCompletePayment iniciado');
    console.log('[useVentaBoletosContent.ts] 📋 Datos recibidos COMPLETOS:', {
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      paymentMethod: data.paymentMethod,
      hasPaymentProof: !!data.paymentProof,
      paymentProofType: typeof data.paymentProof,
      paymentProofSize: data.paymentProof instanceof File ? data.paymentProof.size : 'N/A',
      paymentProofName: data.paymentProof instanceof File ? data.paymentProof.name : 'N/A',
      clickedButtonType: clickedButton,
      participantId: data.participantId,
      selectedNumbersCount: selectedNumbers?.length || 0,
      selectedNumbers,
      RAFFLE_ID,
      SELLER_ID
    });

    // VALIDACIÓN CRÍTICA COMPLETA
    if (!data.buyerName || data.buyerName.trim() === '') {
      console.error('[useVentaBoletosContent.ts] ❌ CRÍTICO: buyerName requerido pero no proporcionado');
      return { success: false, message: 'Nombre del comprador es requerido' };
    }

    if (!selectedNumbers || selectedNumbers.length === 0) {
      console.error('[useVentaBoletosContent.ts] ❌ CRÍTICO: No hay números seleccionados');
      console.error('[useVentaBoletosContent.ts] 📋 Estado actual selectedNumbers:', selectedNumbers);
      return { success: false, message: 'Debe seleccionar números para procesar' };
    }

    if (!RAFFLE_ID) {
      console.error('[useVentaBoletosContent.ts] ❌ CRÍTICO: RAFFLE_ID no disponible');
      return { success: false, message: 'ID de rifa no disponible' };
    }

    if (!SELLER_ID) {
      console.error('[useVentaBoletosContent.ts] ❌ CRÍTICO: SELLER_ID no disponible');
      return { success: false, message: 'ID de vendedor no disponible' };
    }
  
    // Construir datos completos con valores requeridos
    const completeFormData: PaymentFormData = {
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone || '',
      buyerCedula: data.buyerCedula || '',
      buyerEmail: data.buyerEmail || '',
      direccion: data.direccion || '',
      sugerenciaProducto: data.sugerenciaProducto || '',
      paymentMethod: data.paymentMethod || 'cash',
      paymentProof: data.paymentProof || null,
      nota: data.nota || '',
      reporteSospechoso: data.reporteSospechoso || '',
      sellerId: data.sellerId || SELLER_ID,
      participantId: data.participantId || '',
      clickedButtonType: clickedButton || 'Pagar',
      paymentReceiptUrl: data.paymentReceiptUrl || '',
      selectedBankId: data.selectedBankId || ''
    };

    console.log('[useVentaBoletosContent.ts] 🚨 INVESTIGACIÓN CRÍTICA: Datos completos preparados:', {
      buyerName: completeFormData.buyerName,
      paymentMethod: completeFormData.paymentMethod,
      hasPaymentProof: !!completeFormData.paymentProof,
      paymentProofIsFile: completeFormData.paymentProof instanceof File,
      clickedButtonType: completeFormData.clickedButtonType,
      sellerId: completeFormData.sellerId,
      participantId: completeFormData.participantId,
      rafflerId: RAFFLE_ID,
      selectedNumbers: selectedNumbers,
      selectedBankId: completeFormData.selectedBankId
    });
  
    try {
      console.log('[useVentaBoletosContent.ts] 🚨 INVESTIGACIÓN CRÍTICA: Llamando originalHandleCompletePayment');
      
      const result = await originalHandleCompletePayment(completeFormData);
      
      console.log('[useVentaBoletosContent.ts] 📊 INVESTIGACIÓN CRÍTICA: Resultado recibido:', {
        result,
        resultType: typeof result,
        hasResult: !!result,
        isSuccess: result && typeof result === 'object' && 'success' in result ? result.success : 'unknown'
      });
    
      // Manejar conflictos
      if (result && typeof result === 'object' && 'success' in result && !result.success && result.conflictingNumbers?.length) {
        console.log('[useVentaBoletosContent.ts] ⚠️ Conflicto detectado:', result.conflictingNumbers);
        setConflictingNumbers(result.conflictingNumbers);
        setIsConflictModalOpen(true);
        return result;
      }
    
      // Operación exitosa - manejar según el botón presionado
      if (!result || (result && typeof result === 'object' && 'success' in result && result.success)) {
        console.log('[useVentaBoletosContent.ts] ✅ INVESTIGACIÓN CRÍTICA: Operación exitosa');
        
        // CRÍTICO: Asegurar que tenemos un participantId válido antes de guardar para voucher
        if (!completeFormData.participantId || completeFormData.participantId.trim() === '') {
          console.error('[useVentaBoletosContent.ts] ❌ CRÍTICO: No se puede guardar voucher sin participantId válido');
          
          // Ejecutar limpieza agresiva por error crítico
          console.log('[useVentaBoletosContent.ts] 🧹 ERROR: Ejecutando limpieza por falta de participantId');
          clearAllPaymentState();
          setVoucherPaymentData(null);
          setClickedButton(undefined);
          setBuyerInfo(null);
        } else {
          console.log('[useVentaBoletosContent.ts] ✅ CRÍTICO: Guardando datos con participantId:', completeFormData.participantId);
          setVoucherPaymentData(completeFormData);
          
          // CORRECCIÓN CRÍTICA: Solo cerrar modal de pago, preservar selectedNumbers para voucher
          console.log('[useVentaBoletosContent.ts] 🎯 CORRECCIÓN: Solo cerrando modal de pago, preservando selectedNumbers para voucher');
          clearPaymentStatePostSave();
        }
      }
    
      return result;
    } catch (error) {
      console.error('[useVentaBoletosContent.ts] ❌ ERROR CRÍTICO en wrappedHandleCompletePayment:', error);
      
      // Limpieza post-error para evitar variables sucias
      console.log('[useVentaBoletosContent.ts] 🧹 LIMPIEZA POST-ERROR: Ejecutando limpieza tras error');
      clearAllPaymentState();
      setVoucherPaymentData(null);
      setClickedButton(undefined);
      setBuyerInfo(null);
      
      return { success: false, message: `Error crítico: ${error}` };
    }
  };

  // FUNCIÓN ULTRA-MEJORADA: Limpieza TOTAL al cerrar voucher (ÚNICA función de limpieza completa)
  const handleVoucherClosed = () => {
    console.log("[useVentaBoletosContent.ts] 🧹 VOUCHER CERRADO: Ejecutando limpieza TOTAL ULTRA-AGRESIVA incluyendo selectedNumbers");
    
    // EJECUTAR LIMPIEZA INMEDIATA PARA "PAGAR DIRECTO" SI FUE EL BOTÓN USADO
    if (clickedButton === 'Pagar') {
      console.log("[useVentaBoletosContent.ts] 🧹 VOUCHER CERRADO para 'Pagar Directo': Limpieza ULTRA-AGRESIVA");
      executeImmediateCleanupForPagarDirecto();
    }
    
    // Ejecutar limpieza AGRESIVA completa del usePaymentProcessor
    clearAllPaymentState();
    console.log("[useVentaBoletosContent.ts] ✅ clearAllPaymentState ejecutado");
    
    // Limpiar estados locales de useVentaBoletosContent
    setVoucherPaymentData(null);
    console.log("[useVentaBoletosContent.ts] ✅ voucherPaymentData limpiado");
    
    setClickedButton(undefined);
    console.log("[useVentaBoletosContent.ts] ✅ clickedButton limpiado");
    
    // CRÍTICO: Limpieza AGRESIVA del contexto BuyerInfo
    setBuyerInfo(null);
    console.log("[useVentaBoletosContent.ts] ✅ buyerInfo limpiado AGRESIVAMENTE");
    
    console.log("[useVentaBoletosContent.ts] ✅ LIMPIEZA TOTAL ULTRA-AGRESIVA POST-VOUCHER COMPLETADA");
  };

  // Log buyer info when it changes
  useEffect(() => {
    console.log("[useVentaBoletosContent.ts] 📋 buyerInfo actualizado:", buyerInfo ? {
      id: buyerInfo.id || 'N/A',
      name: buyerInfo.name,
      phone: buyerInfo.phone,
      cedula: buyerInfo.cedula
    } : 'null');
  }, [buyerInfo]);

  console.log("[useVentaBoletosContent.ts] 🚨 INVESTIGACIÓN CRÍTICA: Retornando estados:", {
    selectedNumbersCount: selectedNumbers?.length || 0,
    isPaymentModalOpen,
    isVoucherOpen,
    hasPaymentData: !!paymentData,
    hasVoucherPaymentData: !!voucherPaymentData,
    clickedButton,
    paymentDataDetails: paymentData ? {
      participantId: paymentData.participantId,
      buyerName: paymentData.buyerName,
      hasPaymentProof: !!paymentData.paymentProof
    } : null,
    voucherPaymentDataDetails: voucherPaymentData ? {
      participantId: voucherPaymentData.participantId,
      buyerName: voucherPaymentData.buyerName,
      hasPaymentProof: !!voucherPaymentData.paymentProof
    } : null
  });

  return {
    isLoading,
    organization,
    seller,
    raffle,
    prizes,
    prizeImages,
    raffleNumbers: typedRaffleNumbers,
    raffleSeller,
    formatNumbersForGrid,
    lotteryDate,
    reservationDays,
    debugMode,
    allowVoucherPrint,
    
    // Payment data
    selectedNumbers,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData: paymentData || voucherPaymentData,
    isConflictModalOpen,
    conflictingNumbers,
    handleConflictModalClose,
    
    // Handlers
    handleReserveNumbers,
    handleProceedToPaymentWithButton,
    handleCompletePayment,
    getSoldNumbersCount,
    
    // Button state
    clickedButton,
    
    // CORRECCIÓN: Handler para cierre de voucher con limpieza TOTAL
    handleVoucherClosed
  };
}
