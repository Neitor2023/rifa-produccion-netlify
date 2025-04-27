import React, { useState, useEffect } from 'react';
import NumberGrid from '@/components/NumberGrid';
import PaymentModal from '@/components/PaymentModal';
import DigitalVoucher from '@/components/DigitalVoucher';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';
import { useRaffleData } from '@/hooks/useRaffleData';

const VentaBoletos: React.FC = () => {
  const { seller, raffle, raffleNumbers, raffleSeller, refetchRaffleNumbers, maxNumbersAllowed, debugMode, allowVoucherPrint } =
    useRaffleData({ raffleId: '...', sellerId: '...' });

  const {
    selectedNumbers,
    isNewPaymentOpen,
    setIsNewPaymentOpen,
    isCompletePaymentOpen,
    setIsCompletePaymentOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData,
    validatedBuyerData,
    handleReserveNumbers,
    handleStartNewPayment,
    handleStartCompletePayment,
    handleCompletePayment,
    getSoldNumbersCount
  } = usePaymentProcessor({
    raffleSeller,
    raffleId: raffle!.id,
    raffleNumbers,
    refetchRaffleNumbers,
    debugMode,
    allowVoucherPrint
  });

  // Debug logs
  useEffect(() => {
    console.log('validatedBuyerData:', validatedBuyerData);
  }, [validatedBuyerData]);

  if (!raffle) return null;

  return (
    <div>
      <NumberGrid
        numbers={raffleNumbers}
        raffleSeller={raffleSeller}
        onReserve={handleReserveNumbers}
        onProceedToPayment={handleStartNewPayment}
        onPayReserved={handleStartCompletePayment}
        debugMode={debugMode}
        soldNumbersCount={getSoldNumbersCount(seller!.id)}
      />

      {/* Pago directo */}
      <PaymentModal
        isOpen={isNewPaymentOpen}
        onClose={() => setIsNewPaymentOpen(false)}
        selectedNumbers={selectedNumbers}
        price={raffle.price}
        onComplete={handleCompletePayment}
        buyerData={validatedBuyerData}
        debugMode={debugMode}
      />

      {/* Pago de apartados reutiliza el mismo modal */}
      <PaymentModal
        isOpen={isCompletePaymentOpen}
        onClose={() => setIsCompletePaymentOpen(false)}
        selectedNumbers={selectedNumbers}
        price={raffle.price}
        onComplete={handleCompletePayment}
        buyerData={validatedBuyerData}
        debugMode={debugMode}
      />

      {/* Comprobante */}
      <DigitalVoucher
        isOpen={isVoucherOpen}
        onClose={() => setIsVoucherOpen(false)}
        paymentData={paymentData}
        selectedNumbers={selectedNumbers}
        allowVoucherPrint={allowVoucherPrint}
        raffleDetails={{
          title: raffle.title,
          price: raffle.price,
          lottery: raffle.lottery,
          dateLottery: raffle.date_lottery
        }}
      />
    </div>
  );
};

export default VentaBoletos;

