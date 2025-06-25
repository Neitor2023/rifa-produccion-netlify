
import React from 'react';
import { useVentaBoletosContent } from '@/hooks/useVentaBoletosContent';
import { useBuyerInfo } from '@/contexts/BuyerInfoContext';
import VentaBoletosMain from '@/components/raffle/VentaBoletosMain';
import VentaBoletosModals from '@/components/raffle/VentaBoletosModals';

const VentaBoletosContent: React.FC = () => {
  console.log("[VentaBoletosContent.tsx] 🔍 INVESTIGACIÓN: Componente renderizando");
  
  // Gancho personalizado para manejar toda la lógica del contenido
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
    
    // Payment data - Datos de pago
    selectedNumbers,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData,
    isConflictModalOpen,
    conflictingNumbers,
    handleConflictModalClose,
    
    // Handlers - Manipuladores
    handleReserveNumbers,
    handleProceedToPaymentWithButton,
    handleCompletePayment,
    getSoldNumbersCount,
    
    // Estado del botón
    clickedButton
  } = useVentaBoletosContent();

  // Acceda a la información del comprador desde el contexto
  const { buyerInfo } = useBuyerInfo();
  
  console.log("[VentaBoletosContent.tsx] 🚨 INVESTIGACIÓN CRÍTICA: Estados actuales:", {
    isLoading,
    hayRaffle: !!raffle,
    hayRaffleNumbers: raffleNumbers?.length || 0,
    hayRaffleSeller: !!raffleSeller,
    selectedNumbersCount: selectedNumbers?.length || 0,
    isPaymentModalOpen,
    isVoucherOpen,
    clickedButton,
    paymentData: paymentData ? {
      participantId: paymentData.participantId,
      buyerName: paymentData.buyerName,
      paymentMethod: paymentData.paymentMethod,
      hasPaymentProof: !!paymentData.paymentProof,
      paymentProofType: typeof paymentData.paymentProof
    } : null,
    buyerInfoPresent: !!buyerInfo
  });
  
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
        isConflictModalOpen={isConflictModalOpen}
        conflictingNumbers={conflictingNumbers}
        onConflictModalClose={handleConflictModalClose}
      />
    </>
  );
};

export default VentaBoletosContent;
