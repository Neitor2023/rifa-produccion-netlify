
import React, { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';
import { useRaffleData } from '@/hooks/useRaffleData';
import { BuyerInfoProvider, useBuyerInfo } from '@/contexts/BuyerInfoContext';
import { NumberSelectionProvider } from '@/contexts/NumberSelectionContext';
import SellerInfo from '@/components/SellerInfo'; // Added SellerInfo import

// Components
import RaffleHeaderSection from '@/components/raffle/RaffleHeaderSection';
import RafflePrizesSection from '@/components/raffle/RafflePrizesSection';
import RaffleNumberGridSection from '@/components/raffle/RaffleNumberGridSection';
import RaffleInfoSection from '@/components/raffle/RaffleInfoSection';
import RaffleModals from '@/components/raffle/RaffleModals';

// Constants
const SELLER_ID = "0102030405";
const RAFFLE_ID = "fd6bd3bc-d81f-48a9-be58-8880293a0472";

const VentaBoletosContent: React.FC = () => {
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
    console.log("VentaBoletos.tsx: Lottery Date:", lotteryDate);
    console.log("VentaBoletos.tsx: Reservation Days:", reservationDays);
  }
  
  // Payment processor hook
  const {
    selectedNumbers,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData,
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
    console.log("VentaBoletos.tsx: Proceeding to payment with button type:", buttonType);
    setClickedButton(buttonType);
    
    // Clear buyer information if "Pagar" button was clicked
    if (buttonType === "Pagar") {
      console.log("VentaBoletos.tsx: Clearing buyer info because 'Pagar' button was clicked");
      setBuyerInfo(null);
    }
    
    // Fix: Pass only the numbers array to handleProceedToPayment
    await handleProceedToPayment(numbers);
  };

  // Log buyer info when it changes
  useEffect(() => {
    console.log("VentaBoletos.tsx: buyerInfo:", buyerInfo ? {
      id: buyerInfo.id || 'N/A',
      name: buyerInfo.name,
      phone: buyerInfo.phone,
      cedula: buyerInfo.cedula,
      direccion: buyerInfo.direccion,
      sugerencia_producto: buyerInfo.sugerencia_producto
    } : 'null');
  }, [buyerInfo]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="container px-4 py-6 max-w-3xl mx-auto">
        {/* Header section */}
        <RaffleHeaderSection 
          organization={organization} 
          title={raffle?.title || 'Loading...'}
        />
        
        {/* Seller info - MOVED HERE as requested */}
        {seller && (
          <SellerInfo
            name={seller.name}
            phone={seller.phone}
            avatar={seller.avatar}
            id={seller.id}
          />
        )}
        
        {/* Prize carousel and modal */}
        {prizes && prizeImages && (
          <RafflePrizesSection 
            prizes={prizes} 
            prizeImages={prizeImages} 
          />
        )}
        
        {/* Number grid */}
        <RaffleNumberGridSection 
          raffleNumbers={raffleNumbers}
          formatNumbersForGrid={formatNumbersForGrid}
          raffleSeller={raffleSeller}
          raffleId={RAFFLE_ID}
          sellerId={seller?.id || SELLER_ID}
          debugMode={debugMode}
          onReserve={handleReserveNumbers}
          onProceedToPayment={handleProceedToPaymentWithButton}
          getSoldNumbersCount={getSoldNumbersCount}
          reservationDays={reservationDays}
          lotteryDate={lotteryDate}
        />
        
        {/* Raffle info - Modified to remove seller info from here */}
        <RaffleInfoSection 
          raffle={raffle} 
          organization={organization} 
          excludeSellerInfo={true} // Added prop to exclude seller info
        />
      </div>
      
      {/* Modals */}
      <RaffleModals 
        isPaymentModalOpen={isPaymentModalOpen}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        isVoucherOpen={isVoucherOpen}
        setIsVoucherOpen={setIsVoucherOpen}
        selectedNumbers={selectedNumbers}
        rafflePrice={raffle?.price || 0}
        paymentData={paymentData}
        onCompletePayment={handleCompletePayment}
        buyerInfo={buyerInfo}
        debugMode={debugMode}
        allowVoucherPrint={allowVoucherPrint}
        raffleDetails={raffle ? {
          title: raffle.title,
          price: raffle.price,
          lottery: raffle.lottery,
          dateLottery: raffle.date_lottery
        } : undefined}
        clickedButton={clickedButton}
      />
    </div>
  );
};

const VentaBoletos: React.FC = () => {
  return (
    <BuyerInfoProvider>
      <NumberSelectionProvider>
        <VentaBoletosContent />
      </NumberSelectionProvider>
    </BuyerInfoProvider>
  );
};

export default VentaBoletos;
