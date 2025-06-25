import React from 'react';
import PaymentModal from '@/components/PaymentModal';
import DigitalVoucher from '@/components/DigitalVoucher';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { ValidatedBuyerInfo } from '@/types/participant';
import { Organization } from '@/lib/constants/types';

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
  onVoucherClosed?: () => void;
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
  organization,
  onVoucherClosed
}) => {
  console.log('[RaffleModals.tsx] 🔍 CRÍTICO: Renderizando con props:', {
    isPaymentModalOpen,
    isVoucherOpen,
    hasPaymentData: !!paymentData,
    hasOnCompletePayment: !!onCompletePayment,
    selectedNumbersCount: selectedNumbers?.length || 0,
    clickedButton
  });

  // Wrapper para onCompletePayment con logging crítico
  const handleCompletePaymentWrapper = async (data: PaymentFormData) => {
    console.log('[RaffleModals.tsx] 🚨 WRAPPER CRÍTICO: onCompletePayment wrapper iniciado');
    console.log('[RaffleModals.tsx] 📋 Datos enviados a onCompletePayment:', {
      buyerName: data.buyerName,
      paymentMethod: data.paymentMethod,
      hasPaymentProof: !!data.paymentProof,
      participantId: data.participantId,
      selectedNumbers: selectedNumbers,
      clickedButton
    });

    if (!onCompletePayment) {
      console.error('[RaffleModals.tsx] ❌ CRÍTICO: onCompletePayment es null/undefined');
      return { success: false, message: 'Función de completar pago no disponible' };
    }

    try {
      console.log('[RaffleModals.tsx] 📤 EJECUTANDO: onCompletePayment');
      const result = await onCompletePayment(data);
      console.log('[RaffleModals.tsx] 📨 RESULTADO de onCompletePayment:', result);
      return result;
    } catch (error) {
      console.error('[RaffleModals.tsx] ❌ ERROR en wrapper onCompletePayment:', error);
      return { success: false, message: `Error en wrapper: ${error}` };
    }
  };

  return (
    <>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          console.log('[RaffleModals.tsx] 🔐 Cerrando modal de pago');
          setIsPaymentModalOpen(false);
        }}
        selectedNumbers={selectedNumbers}
        rafflePrice={rafflePrice}
        onCompletePayment={handleCompletePaymentWrapper}
        buyerInfo={buyerInfo}
        debugMode={debugMode}
        clickedButton={clickedButton}
      />
      
      <DigitalVoucher
        isOpen={isVoucherOpen}
        onClose={() => {
          console.log('[RaffleModals.tsx] 🔐 Cerrando voucher');
          setIsVoucherOpen(false);
        }}
        selectedNumbers={selectedNumbers}
        paymentData={paymentData}
        raffleDetails={raffleDetails}
        allowVoucherPrint={allowVoucherPrint}
        organization={organization}
        onVoucherClosed={onVoucherClosed}
      />
    </>
  );
};

export default RaffleModals;
