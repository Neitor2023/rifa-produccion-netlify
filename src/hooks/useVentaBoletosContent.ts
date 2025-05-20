
import { useState, useEffect } from 'react';
import { useRaffleData } from '@/hooks/useRaffleData';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';
import { SELLER_ID, RAFFLE_ID } from '@/utils/setGlobalIdsFromUrl';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { ConflictResult } from '@/hooks/usePaymentProcessor/completePayment';

export function useVentaBoletosContent() {
  // State for the clicked button
  const [clickedButton, setClickedButton] = useState<string | undefined>(undefined);
  
  // Access buyer info from context
  const { buyerInfo, setBuyerInfo } = useBuyerInfo();
  
  // Get raffle data - using the imported values from setGlobalIdsFromUrl
  console.log("[useVentaBoletosContent.ts] Usando IDs de URL:", { RAFFLE_ID, SELLER_ID });
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
  
  // Log the value of allowVoucherPrint to help with debugging
  useEffect(() => {
    console.log('[useVentaBoletosContent.ts] Valor actual de allowVoucherPrint:', allowVoucherPrint);
  }, [allowVoucherPrint]);
  
  // Convert lottery date string to Date object if it exists
  const lotteryDate = raffle?.date_lottery ? new Date(raffle.date_lottery) : undefined;
  
  // Get reservation days from raffle
  const reservationDays = raffle?.reservation_days;
  
  // Debug output for lottery date and reservation days
  if (debugMode) {
    console.log("useVentaBoletosContent.ts: Fecha de lotería:", lotteryDate);
    console.log("useVentaBoletosContent.ts: Días de reserva:", reservationDays);
  }
  
  // Payment processor hook
  const {
    selectedNumbers,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData,
    isConflictModalOpen,
    setIsConflictModalOpen,
    conflictingNumbers,
    setConflictingNumbers,
    handleConflictModalClose,
    handleReserveNumbers,
    handleProceedToPayment,
    handlePayReservedNumbers,
    handleCompletePayment,
    getSoldNumbersCount
  } = usePaymentProcessor({
    raffleSeller: seller ? { 
      id: raffleSeller?.id || 'default', 
      seller_id: seller.id,
      active: raffleSeller?.active || true,
      cant_max: raffleSeller?.cant_max || maxNumbersAllowed,
    } : null,
    raffleId: RAFFLE_ID,
    raffleNumbers,
    refetchRaffleNumbers,
    debugMode,
    allowVoucherPrint,
    reservationDays,
    lotteryDate
  });

  // Handle proceeding to payment with the button type
  const handleProceedToPaymentWithButton = async (numbers: string[], participantData?: any, buttonType?: string) => {
    console.log("useVentaBoletosContent.ts: Procediendo al pago con tipo de botón:", buttonType);
    setClickedButton(buttonType);
    
    // Clear buyer information if "Pagar" button was clicked
    if (buttonType === "Pagar") {
      console.log("useVentaBoletosContent.ts: Limpiando info del comprador porque se hizo clic en botón 'Pagar'");
      setBuyerInfo(null);
    }
    
    // Pass numbers, participant data, and the button type to handleProceedToPayment
    await handleProceedToPayment(numbers, participantData, buttonType);
  };

  // Let's wrap handleCompletePayment to handle the return value and update our local state
  const wrappedHandleCompletePayment = async (data: PaymentFormData): Promise<ConflictResult | void> => {
    // Make sure buyerName is set (required field)
    if (!data.buyerName) {
      console.error('useVentaBoletosContent.ts: El nombre del comprador es requerido pero no fue proporcionado');
      return { success: false, message: 'Nombre del comprador es requerido' };
    }
    
    // Ensure we're passing the clicked button type and seller ID in the form data
    const formDataWithButton: PaymentFormData = {
      ...data,
      clickedButtonType: clickedButton,
      sellerId: SELLER_ID
    };
    
    const result = await handleCompletePayment(formDataWithButton);
    
    // If we have a result with conflicting numbers, update our conflict state
    if (result && !result.success && result.conflictingNumbers && result.conflictingNumbers.length > 0) {
      setConflictingNumbers(result.conflictingNumbers);
      setIsConflictModalOpen(true);
      return result;
    }
    
    // Otherwise, return the result as is
    return result;
  };

  // Log buyer info when it changes
  useEffect(() => {
    console.log("useVentaBoletosContent.ts: buyerInfo:", buyerInfo ? {
      id: buyerInfo.id || 'N/A',
      name: buyerInfo.name,
      phone: buyerInfo.phone,
      cedula: buyerInfo.cedula,
      direccion: buyerInfo.direccion,
      sugerencia_producto: buyerInfo.sugerencia_producto
    } : 'null');
  }, [buyerInfo]);

  return {
    isLoading,
    organization,
    seller,
    raffle,
    prizes,
    prizeImages,
    raffleNumbers,
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
    paymentData,
    isConflictModalOpen,
    conflictingNumbers,
    handleConflictModalClose,
    
    // Handlers
    handleReserveNumbers,
    handleProceedToPaymentWithButton,
    handleCompletePayment: wrappedHandleCompletePayment,
    getSoldNumbersCount,
    
    // Button state
    clickedButton
  };
}
