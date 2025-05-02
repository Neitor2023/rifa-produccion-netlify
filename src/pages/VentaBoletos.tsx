
import React, { useState, useEffect } from 'react';
import RaffleHeader from '@/components/RaffleHeader';
import PrizeCarousel from '@/components/PrizeCarousel';
import PrizeDetailModal from '@/components/PrizeDetailModal';
import OrganizerInfo from '@/components/OrganizerInfo';
import NumberGrid from '@/components/NumberGrid';
import PaymentModal from '@/components/PaymentModal';
import DigitalVoucher from '@/components/DigitalVoucher';
import DarkModeToggle from '@/components/DarkModeToggle';
import RaffleInfo from '@/components/RaffleInfo';
import SellerInfo from '@/components/SellerInfo';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';
import { useRaffleData } from '@/hooks/useRaffleData';
import { Prize } from '@/lib/constants';
import { BuyerInfoProvider, useBuyerInfo } from '@/contexts/BuyerInfoContext';

// Constants
const SELLER_ID = "0102030405";
const RAFFLE_ID = "fd6bd3bc-d81f-48a9-be58-8880293a0472";

const VentaBoletosContent: React.FC = () => {
  // UI state management
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { buyerInfo } = useBuyerInfo();
  
  // Fetch raffle data
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
  
  // Payment processor hook with allowVoucherPrint passed
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

  // Log buyerInfo whenever it changes
  useEffect(() => {
    console.log("📦 VentaBoletos - buyerInfo:", buyerInfo ? {
      id: buyerInfo.id || 'N/A',
      name: buyerInfo.name,
      phone: buyerInfo.phone,
      cedula: buyerInfo.cedula,
      direccion: buyerInfo.direccion,
      sugerencia_producto: buyerInfo.sugerencia_producto
    } : 'null');
  }, [buyerInfo]);

  // Log before rendering PaymentModal
  console.log("📦 VentaBoletos - Rendering PaymentModal with buyerInfo:", 
    buyerInfo ? {
      id: buyerInfo.id || 'N/A',
      name: buyerInfo.name,
      phone: buyerInfo.phone,
      cedula: buyerInfo.cedula
    } : 'null'
  );

  // Event handlers
  const handleViewPrizeDetails = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsPrizeModalOpen(true);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  console.log("📦 Datos validados en VentaBoletos antes de pasarlos a PaymentModal:", buyerInfo);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="container px-4 py-6 max-w-3xl mx-auto">
        {/* Header section */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            {organization && <RaffleHeader organization={organization} />}
          </div>
          <DarkModeToggle />
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
          {raffle?.title || 'Cargando...'}
        </h1>
        
        {/* Prize carousel */}
        {prizes && (
          <PrizeCarousel 
            prizes={prizes} 
            onViewDetails={handleViewPrizeDetails}
          />
        )}
        
        {/* Number grid */}
        {raffleNumbers && (
          <div className="mb-8">
            <NumberGrid 
              numbers={formatNumbersForGrid()}
              raffleSeller={{
                id: raffleSeller?.id || 'default',
                raffle_id: RAFFLE_ID,
                seller_id: seller?.id || SELLER_ID,
                active: raffleSeller?.active || true,
                cant_max: maxNumbersAllowed
              }}
              onReserve={handleReserveNumbers}
              onProceedToPayment={handleProceedToPayment}
              debugMode={debugMode}
              soldNumbersCount={getSoldNumbersCount(seller?.id || '')}
            />
          </div>
        )}
        
        {/* Raffle information */}
        {raffle && (
          <RaffleInfo
            description={raffle.description}
            lottery={raffle.lottery}
            dateLottery={raffle.date_lottery}
            paymentInstructions={raffle.payment_instructions}
            price={raffle.price}
            currency={raffle.currency}
          />
        )}
        
        {/* Seller information */}
        {seller && (
          <SellerInfo
            name={seller.name}
            phone={seller.phone}
            avatar={seller.avatar}
            id={seller.id}
          />
        )}
        
        {/* Organization information */}
        {organization && <OrganizerInfo organization={organization} />}
        
        {/* Disclaimer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 italic mb-8">
          Las plataformas de redes sociales no están asociadas a esta rifa.
        </div>
      </div>
      
      {/* Modals */}
      <PrizeDetailModal 
        isOpen={isPrizeModalOpen}
        onClose={() => setIsPrizeModalOpen(false)}
        prize={selectedPrize}
        prizeImages={prizeImages || []}
      />

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedNumbers={selectedNumbers}
        price={raffle?.price || 0}
        onComplete={handleCompletePayment}
        buyerData={buyerInfo}
        debugMode={debugMode}
      />
      
      <DigitalVoucher 
        isOpen={isVoucherOpen}
        onClose={() => setIsVoucherOpen(false)}
        paymentData={paymentData}
        selectedNumbers={selectedNumbers}
        allowVoucherPrint={allowVoucherPrint}
        raffleDetails={raffle ? {
          title: raffle.title,
          price: raffle.price,
          lottery: raffle.lottery,
          dateLottery: raffle.date_lottery
        } : undefined}
      />
    </div>
  );
};

const VentaBoletos: React.FC = () => {
  return (
    <BuyerInfoProvider>
      <VentaBoletosContent />
    </BuyerInfoProvider>
  );
};

export default VentaBoletos;
