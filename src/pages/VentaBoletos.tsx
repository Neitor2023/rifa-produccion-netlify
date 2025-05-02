
import React, { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';
import { useRaffleData } from '@/hooks/useRaffleData';
import { BuyerInfoProvider, useBuyerInfo } from '@/contexts/BuyerInfoContext';
import { NumberSelectionProvider } from '@/contexts/NumberSelectionContext';

// Componentes
import RaffleHeaderSection from '@/components/raffle/RaffleHeaderSection';
import RafflePrizesSection from '@/components/raffle/RafflePrizesSection';
import RaffleNumberGridSection from '@/components/raffle/RaffleNumberGridSection';
import RaffleInfoSection from '@/components/raffle/RaffleInfoSection';
import RaffleModals from '@/components/raffle/RaffleModals';

// Constantes
const SELLER_ID = "0102030405";
const RAFFLE_ID = "fd6bd3bc-d81f-48a9-be58-8880293a0472";

const VentaBoletosContent: React.FC = () => {
  // State for the clicked button
  const [clickedButton, setClickedButton] = useState<string | undefined>(undefined);
  
  // Acceda a la información del comprador desde el contexto
  const { buyerInfo } = useBuyerInfo();
  
  // Obtener datos del sorteo
  const { 
    seller,
    raffle,
    prizes,
    prizeImages,
    organization,
    raffleNumbers,
    raffleSeller,
    formatNumbersForGrid,
    isLoading,
    refetchRaffleNumbers,
    maxNumbersAllowed,
    debugMode,
    allowVoucherPrint
  } = useRaffleData({ 
    raffleId: RAFFLE_ID, 
    sellerId: SELLER_ID 
  });
  
  // Gancho del procesador de pagos con allowVoucherPrint aprobado
  const {
    selectedNumbers,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData,
    handleReserveNumbers,
    handleProceedToPayment,
    handlePayReservedNumbers,
    handleCompletePayment,
    getSoldNumbersCount
  } = usePaymentProcessor({
    raffleSeller: seller ? { 
      id: raffleSeller?.id || 'default', 
      seller_id: seller.id,
      active: raffleSeller?.active || true,
      cant_max: raffleSeller?.cant_max || maxNumbersAllowed
    } : null,
    raffleId: RAFFLE_ID,
    raffleNumbers,
    refetchRaffleNumbers,
    debugMode,
    allowVoucherPrint
  });

  // Handle proceeding to payment with the button type
  const handleProceedToPaymentWithButton = (numbers: string[], participantData?: any, buttonType?: string) => {
    console.log("VentaBoletos.tsx: Proceeding to payment with button type:", buttonType);
    setClickedButton(buttonType);
    handleProceedToPayment(numbers, participantData);
  };

  // Registrar la información del comprador cada vez que cambia
  useEffect(() => {
    console.log("VentaBoletos.tsx: buyerInfo:", buyerInfo ? {
      id: buyerInfo.id || 'N/A',
      name: buyerInfo.name,
      phone: buyerInfo.phone,
      cedula: buyerInfo.cedula,
      direccion: buyerInfo.direccion,
      sugerencia_producto: buyerInfo.sugerencia_producto
    } : 'null');
  }, [buyerInfo]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="container px-4 py-6 max-w-3xl mx-auto">
        {/* Sección de encabezado */}
        <RaffleHeaderSection 
          organization={organization} 
          title={raffle?.title || 'Cargando...'}
        />
        
        {/* Carrusel de premios y modal */}
        {prizes && prizeImages && (
          <RafflePrizesSection 
            prizes={prizes} 
            prizeImages={prizeImages} 
          />
        )}
        
        {/* Cuadrícula numérica */}
        <RaffleNumberGridSection 
          raffleNumbers={raffleNumbers}
          formatNumbersForGrid={formatNumbersForGrid}
          raffleSeller={raffleSeller}
          raffleId={RAFFLE_ID}
          sellerId={seller?.id || SELLER_ID}
          debugMode={debugMode}
          onReserve={handleReserveNumbers}
          onProceedToPayment={handleProceedToPaymentWithButton}
          getSoldNumbersCount={getSoldNumbersCount}
        />
        
        {/* Información del sorteo */}
        <RaffleInfoSection 
          raffle={raffle} 
          seller={seller} 
          organization={organization} 
        />
      </div>
      
      {/* Modales */}
      <RaffleModals 
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
      />
    </div>
  );
};

const VentaBoletos: React.FC = () => {
  return (
    <BuyerInfoProvider>
      <NumberSelectionProvider>
        <VentaBoletosContent />
      </NumberSelectionProvider>
    </BuyerInfoProvider>
  );
};

export default VentaBoletos;
