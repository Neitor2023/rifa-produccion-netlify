
import React from 'react';
import { useVentaBoletosContent } from '@/hooks/useVentaBoletosContent';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';
import VentaBoletosMain from '@/components/raffle/VentaBoletosMain';
import VentaBoletosModals from '@/components/raffle/VentaBoletosModals';

const VentaBoletosContent: React.FC = () => {
  // Custom hook to handle all content logic
  const {
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
    
    // Handlers
    handleReserveNumbers,
    handleProceedToPaymentWithButton,
    handleCompletePayment,
    getSoldNumbersCount,
    
    // Button state
    clickedButton
  } = useVentaBoletosContent();

  // Access buyer info from context
  const { buyerInfo } = useBuyerInfo();

  return (
    <>
      <VentaBoletosMain 
        isLoading={isLoading}
        organization={organization}
        seller={seller}
        raffle={raffle}
        prizes={prizes}
        prizeImages={prizeImages}
        raffleNumbers={raffleNumbers}
        raffleSeller={raffleSeller}
        formatNumbersForGrid={formatNumbersForGrid}
        lotteryDate={lotteryDate}
        reservationDays={reservationDays}
        debugMode={debugMode}
        handleReserveNumbers={handleReserveNumbers}
        handleProceedToPaymentWithButton={handleProceedToPaymentWithButton}
        // Corrección: Ajuste getSoldNumbersCount para que coincida con la firma esperada
        getSoldNumbersCount={() => getSoldNumbersCount(seller?.id || '')}
      />
      
      {/* Modals */}
      <VentaBoletosModals 
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
        organization={organization}
      />
    </>
  );
};

export default VentaBoletosContent;
