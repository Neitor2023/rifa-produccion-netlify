
import React from 'react';
import PaymentModal from '@/components/PaymentModal';
import DigitalVoucher from '@/components/DigitalVoucher';
import { ValidatedBuyerInfo } from '@/types/participant';
import { PaymentFormData } from '@/components/PaymentModal';
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
  raffleDetails
}) => {
  
  return (
    <NumberSelectionProvider>
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedNumbers={selectedNumbers}
        price={rafflePrice}
        onComplete={onCompletePayment}
        buyerData={buyerInfo}
        debugMode={debugMode}
      />
      
      <DigitalVoucher 
        isOpen={isVoucherOpen}
        onClose={() => setIsVoucherOpen(false)}
        paymentData={paymentData}
        selectedNumbers={selectedNumbers}
        allowVoucherPrint={allowVoucherPrint}
        raffleDetails={raffleDetails}
      />
    </NumberSelectionProvider>
  );
};

export default RaffleModals;
