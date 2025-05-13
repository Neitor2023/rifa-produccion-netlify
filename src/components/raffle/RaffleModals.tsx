
import React from 'react';
import PaymentModal, { PaymentFormData } from '@/components/PaymentModal';
import DigitalVoucher from '@/components/DigitalVoucher';
import { ValidatedBuyerInfo } from '@/types/participant';
import { NumberSelectionProvider } from '@/contexts/NumberSelectionContext';
import { Organization } from '@/lib/constants/types';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';

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
  organization?: Organization | null;
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
  clickedButton,
  organization
}) => {
  console.log("RaffleModals.tsx: Rendering with isPaymentModalOpen=", isPaymentModalOpen);
  const { clearSelectionState } = useNumberSelection();
  
  // Handle voucher close
  const handleVoucherClose = () => {
    console.log("RaffleModals.tsx: Clearing selection state when voucher is closed");
    clearSelectionState();
    setIsVoucherOpen(false);
  };
  
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
        organization={organization}
      />
      
      <DigitalVoucher 
        isOpen={isVoucherOpen}
        onClose={handleVoucherClose}
        paymentData={paymentData}
        selectedNumbers={selectedNumbers}
        allowVoucherPrint={allowVoucherPrint}
        raffleDetails={raffleDetails}
        onVoucherClosed={clearSelectionState}
      />
    </>
  );
};

export default RaffleModals;
