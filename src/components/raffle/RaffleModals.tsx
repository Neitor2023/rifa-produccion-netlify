
import React from 'react';
import PaymentModal, { PaymentFormData } from '@/components/PaymentModal';
import DigitalVoucher from '@/components/DigitalVoucher';
import { ValidatedBuyerInfo } from '@/types/participant';
import { NumberSelectionProvider } from '@/contexts/NumberSelectionContext';

interface RaffleModalsProps {
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  isVoucherOpen: boolean;
  setIsVoucherOpen: (isOpen: boolean) => void;
  selectedNumbers: string[];
  rafflePrice: number;
  paymentData: PaymentFormData | null;
  onCompletePayment: (data: PaymentFormData) => Promise<void>;
  buyerInfo: ValidatedBuyerInfo | null;
  debugMode: boolean;
  allowVoucherPrint: boolean;
  raffleDetails?: {
    title: string;
    price: number;
    lottery: string;
    dateLottery: string;
  };
  clickedButton?: string;
}

const RaffleModals: React.FC<RaffleModalsProps> = ({
  isPaymentModalOpen,
  setIsPaymentModalOpen,
  isVoucherOpen,
  setIsVoucherOpen,
  selectedNumbers,
  rafflePrice,
  paymentData,
  onCompletePayment,
  buyerInfo,
  debugMode,
  allowVoucherPrint,
  raffleDetails,
  clickedButton
}) => {
  console.log("RaffleModals.tsx: Rendering with isPaymentModalOpen=", isPaymentModalOpen);
  
  return (
    <>
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedNumbers={selectedNumbers}
        price={rafflePrice}
        onComplete={onCompletePayment}
        buyerData={buyerInfo}
        debugMode={debugMode}
        clickedButton={clickedButton}
      />
      
      <DigitalVoucher 
        isOpen={isVoucherOpen}
        onClose={() => setIsVoucherOpen(false)}
        paymentData={paymentData}
        selectedNumbers={selectedNumbers}
        allowVoucherPrint={allowVoucherPrint}
        raffleDetails={raffleDetails}
      />
    </>
  );
};

export default RaffleModals;
