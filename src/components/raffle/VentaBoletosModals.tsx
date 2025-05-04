
import React from 'react';
import RaffleModals from '@/components/raffle/RaffleModals';
import { ValidatedBuyerInfo } from '@/types/participant';
import { PaymentFormData } from '@/schemas/paymentFormSchema';

interface VentaBoletosModalsProps {
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

const VentaBoletosModals: React.FC<VentaBoletosModalsProps> = ({
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
  return (
    <RaffleModals 
      isPaymentModalOpen={isPaymentModalOpen}
      setIsPaymentModalOpen={setIsPaymentModalOpen}
      isVoucherOpen={isVoucherOpen}
      setIsVoucherOpen={setIsVoucherOpen}
      selectedNumbers={selectedNumbers}
      rafflePrice={rafflePrice}
      paymentData={paymentData}
      onCompletePayment={onCompletePayment}
      buyerInfo={buyerInfo}
      debugMode={debugMode}
      allowVoucherPrint={allowVoucherPrint}
      raffleDetails={raffleDetails}
      clickedButton={clickedButton}
    />
  );
};

export default VentaBoletosModals;
