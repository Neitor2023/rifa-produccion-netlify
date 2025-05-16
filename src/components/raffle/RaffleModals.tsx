
import React from 'react';
import { ValidatedBuyerInfo } from '@/types/participant';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { Organization } from '@/lib/constants/types';
import PaymentModal from '@/components/PaymentModal';
import DigitalVoucher from '@/components/DigitalVoucher';

interface RaffleModalsProps {
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  isVoucherOpen: boolean;
  setIsVoucherOpen: (isOpen: boolean) => void;
  selectedNumbers: string[];
  rafflePrice: number;
  paymentData: PaymentFormData | null;
  onCompletePayment: (data: PaymentFormData) => Promise<{ success: boolean; conflictingNumbers?: string[] } | void>;
  buyerInfo: ValidatedBuyerInfo | null;
  debugMode?: boolean;
  allowVoucherPrint?: boolean;
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
  debugMode = false,
  allowVoucherPrint = true,
  raffleDetails,
  clickedButton,
  organization
}) => {
  return (
    <>
      {/* Payment Modal */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedNumbers={selectedNumbers}
        price={rafflePrice}
        onCompletePayment={onCompletePayment}
        buyerInfo={buyerInfo}
        debugMode={debugMode}
        clickedButton={clickedButton}
        organization={organization}
      />
      
      {/* Digital Voucher */}
      {allowVoucherPrint && (
        <DigitalVoucher 
          isOpen={isVoucherOpen} 
          onClose={() => setIsVoucherOpen(false)}
          paymentData={paymentData}
          raffleDetails={raffleDetails}
          selectedNumbers={selectedNumbers}
          organization={organization}
        />
      )}
    </>
  );
};

export default RaffleModals;
