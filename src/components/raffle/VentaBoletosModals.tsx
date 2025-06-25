
import React from 'react';
import RaffleModals from '@/components/raffle/RaffleModals';
import NumberConflictModal from '@/components/NumberConflictModal';
import { ValidatedBuyerInfo } from '@/types/participant';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { Organization } from '@/lib/constants/types';

interface VentaBoletosModalsProps {
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
  isConflictModalOpen?: boolean;
  conflictingNumbers?: string[];
  onConflictModalClose?: () => void;
  onVoucherClosed?: () => void;
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
  clickedButton,
  organization,
  isConflictModalOpen = false,
  conflictingNumbers = [],
  onConflictModalClose = () => {},
  onVoucherClosed
}) => {
  console.log('[VentaBoletosModals.tsx] 🔍 CRÍTICO: Renderizando con props:', {
    isPaymentModalOpen,
    isVoucherOpen,
    hasPaymentData: !!paymentData,
    hasOnVoucherClosed: !!onVoucherClosed,
    selectedNumbersCount: selectedNumbers.length,
    paymentDataType: paymentData ? typeof paymentData.paymentProof : 'no-payment-data'
  });

  // CORRECCIÓN CRÍTICA: Wrapper MEJORADO para onVoucherClosed con limpieza AGRESIVA
  const handleVoucherClosedWrapper = () => {
    console.log('[VentaBoletosModals.tsx] 🧹 VOUCHER CERRADO: Ejecutando limpieza AGRESIVA completa');
    
    // Primero cerrar el voucher
    setIsVoucherOpen(false);
    console.log('[VentaBoletosModals.tsx] ✅ Modal de voucher cerrado');
    
    // CRÍTICO: Ejecutar limpieza AGRESIVA inmediata si existe la función
    if (onVoucherClosed && typeof onVoucherClosed === 'function') {
      console.log('[VentaBoletosModals.tsx] 🚨 CRÍTICO: Ejecutando limpieza AGRESIVA total');
      
      // Ejecutar con timeout para asegurar que el modal se cerró primero
      setTimeout(() => {
        onVoucherClosed();
        console.log('[VentaBoletosModals.tsx] ✅ Limpieza AGRESIVA ejecutada con delay');
      }, 100);
      
    } else {
      console.warn('[VentaBoletosModals.tsx] ⚠️ onVoucherClosed no disponible - limpieza no ejecutada');
    }
  };

  return (
    <>
      <RaffleModals 
        isPaymentModalOpen={isPaymentModalOpen}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        isVoucherOpen={isVoucherOpen}
        setIsVoucherOpen={handleVoucherClosedWrapper}
        selectedNumbers={selectedNumbers}
        rafflePrice={rafflePrice}
        paymentData={paymentData}
        onCompletePayment={onCompletePayment}
        buyerInfo={buyerInfo}
        debugMode={debugMode}
        allowVoucherPrint={allowVoucherPrint}
        raffleDetails={raffleDetails}
        clickedButton={clickedButton}
        organization={organization}
        onVoucherClosed={handleVoucherClosedWrapper}
      />
      
      {/* Conflict modal for simultaneous sales issues */}
      <NumberConflictModal 
        isOpen={isConflictModalOpen}
        conflictingNumbers={conflictingNumbers}
        onClose={onConflictModalClose}
      />
    </>
  );
};

export default VentaBoletosModals;
