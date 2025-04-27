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

// Constants
const SELLER_ID = "0102030405";
const RAFFLE_ID = "fd6bd3bc-d81f-48a9-be58-8880293a0472";

const VentaBoletos: React.FC = () => {
  // UI state management
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  
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
    isCompletePaymentOpen,
    setIsCompletePaymentOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData,
    validatedBuyerData,
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

  // Log validatedBuyerData whenever it changes
  useEffect(() => {
    console.log("📦 VentaBoletos - validatedBuyerData:", validatedBuyerData ? {
      id: validatedBuyerData.id || 'N/A',
      name: validatedBuyerData.name,
      phone: validatedBuyerData.phone,
      cedula: validatedBuyerData.cedula,
      direccion: validatedBuyerData.direccion,
      sugerencia_producto: validatedBuyerData.sugerencia_producto
    } : 'null');
  }, [validatedBuyerData]);

  // Log before rendering PaymentModal
  console.log("📦 VentaBoletos - Rendering PaymentModal with validatedBuyerData:", 
    validatedBuyerData ? {
      id: validatedBuyerData.id || 'N/A',
      name: validatedBuyerData.name,
      phone: validatedBuyerData.phone,
      cedula: validatedBuyerData.cedula
    } : 'null'
  );

  // Event handlers
  const handleViewPrizeDetails = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsPrizeModalOpen(true);
  };

  // Log validatedBuyerData whenever it changes to help with debugging
  useEffect(() => {
    if (validatedBuyerData) {
      console.log("🔄 VentaBoletos - validatedBuyerData updated:", {
        id: validatedBuyerData.id || 'N/A',
        name: validatedBuyerData.name,
        phone: validatedBuyerData.phone,
        cedula: validatedBuyerData.cedula
      });
    } else {
      console.log("🔄 VentaBoletos - No validatedBuyerData available");
    }
  }, [validatedBuyerData]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  console.log("📦 Datos validados en VentaBoletos antes de pasarlos a PaymentModal:", validatedBuyerData);

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
      
      {/* Modal para compra directa */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedNumbers={selectedNumbers}
        price={raffle?.price || 0}
        onComplete={handleCompletePayment}
        buyerData={validatedBuyerData}
        debugMode={debugMode}
      />
      
      {/* Modal para finalizar compra de apartados */}
      <PaymentModal 
        isOpen={isCompletePaymentOpen}
        onClose={() => setIsCompletePaymentOpen(false)}
        selectedNumbers={selectedNumbers}
        price={raffle?.price || 0}
        onComplete={handleCompletePayment}
        buyerData={validatedBuyerData}
        debugMode={debugMode}
        title="COMPLETA LOS SIGUIENTES DATOS PARA FINALIZAR LA COMPRA"
      />
      
      {/* Comprobante digital */}
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

export default VentaBoletos;
