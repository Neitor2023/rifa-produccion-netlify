
import { useState, useEffect } from 'react';
import { useRaffleData } from '@/hooks/useRaffleData';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';
import { SELLER_ID, RAFFLE_ID } from '@/lib/constants';

export function useVentaBoletosContent() {
  // State for the clicked button
  const [clickedButton, setClickedButton] = useState<string | undefined>(undefined);
  
  // Access buyer info from context
  const { buyerInfo, setBuyerInfo } = useBuyerInfo();
  
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
  
  // Convert lottery date string to Date object if it exists
  const lotteryDate = raffle?.date_lottery ? new Date(raffle.date_lottery) : undefined;
  
  // Get reservation days from raffle
  const reservationDays = raffle?.reservation_days;
  
  // Debug output for lottery date and reservation days
  if (debugMode) {
    console.log("useVentaBoletosContent.ts: Lottery Date:", lotteryDate);
    console.log("useVentaBoletosContent.ts: Reservation Days:", reservationDays);
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
    console.log("useVentaBoletosContent.ts: Proceeding to payment with button type:", buttonType);
    setClickedButton(buttonType);
    
    // Clear buyer information if "Pagar" button was clicked
    if (buttonType === "Pagar") {
      console.log("useVentaBoletosContent.ts: Clearing buyer info because 'Pagar' button was clicked");
      setBuyerInfo(null);
    }
    
    // Pass numbers, participant data, and the button type to handleProceedToPayment
    await handleProceedToPayment(numbers, participantData, buttonType);
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
    handleCompletePayment,
    getSoldNumbersCount,
    
    // Button state
    clickedButton
  };
}
