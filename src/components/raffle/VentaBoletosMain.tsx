
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import RaffleHeaderSection from '@/components/raffle/RaffleHeaderSection';
import SellerInfo from '@/components/SellerInfo';
import RafflePrizesSection from '@/components/raffle/RafflePrizesSection';
import RaffleNumberGridSection from '@/components/raffle/RaffleNumberGridSection';
import RaffleInfoSection from '@/components/raffle/RaffleInfoSection';
import PromotionalImage from '@/components/raffle/PromotionalImage';
import LoadingSpinner from '@/components/LoadingSpinner';

interface VentaBoletosMainProps {
  isLoading: boolean;
  organization: any;
  seller: any;
  raffle: any;
  prizes: any[];
  prizeImages: any[];
  raffleNumbers: any[];
  raffleSeller: any;
  formatNumbersForGrid: any;
  lotteryDate?: Date;
  reservationDays?: number;
  debugMode: boolean;
  handleReserveNumbers: (numbers: string[], buyerPhone?: string, buyerName?: string, buyerCedula?: string) => Promise<void>;
  handleProceedToPaymentWithButton: (numbers: string[], participantData?: any, buttonType?: string) => Promise<void>;
  getSoldNumbersCount: () => number;
}

const VentaBoletosMain: React.FC<VentaBoletosMainProps> = ({
  isLoading,
  organization,
  seller,
  raffle,
  prizes,
  prizeImages,
  raffleNumbers,
  raffleSeller,
  formatNumbersForGrid,
  lotteryDate,
  reservationDays,
  debugMode,
  handleReserveNumbers,
  handleProceedToPaymentWithButton,
  getSoldNumbersCount
}) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="container px-4 py-4 max-w-3xl mx-auto">
        {/* Header section with organization info and dark mode toggle */}
        <div className="mb-4">
          <Card className="shadow-md">
            <CardContent className="p-3">
              <RaffleHeaderSection 
                organization={organization} 
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Title card - MOVED UP from below */}
        <Card className="mb-4 shadow-sm">
          <CardContent className="p-3">
            <h1 className="text-xl sm:text-2xl font-bold text-center">
              {raffle?.title || 'Cargando...'}
            </h1>
          </CardContent>
        </Card>
        
        {/* Description - MOVED DOWN from above */}
        {raffle?.description && (
          <Card className="mb-4 shadow-sm">
            <CardContent className="p-3">
              <div className="font-bold whitespace-pre-line text-sm">
                {raffle.description}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Seller Info */}
        {seller && (
          <div className="mb-4">
            <SellerInfo 
              name={seller.name}
              phone={seller.phone}
              avatar={seller.avatar}
              id={seller.cedula || seller.id}
            />
          </div>
        )}
        
        {/* Prize carousel and modal */}
        {prizes && prizeImages && (
          <div className="mb-4">
            <RafflePrizesSection 
              prizes={prizes} 
              prizeImages={prizeImages} 
              organization={organization}
            />
          </div>
        )}
        
        {/* Number grid */}
        <div className="mb-4">
          <RaffleNumberGridSection 
            raffleNumbers={raffleNumbers}
            formatNumbersForGrid={formatNumbersForGrid}
            raffleSeller={raffleSeller}
            raffleId={raffle.id}
            sellerId={seller?.id}
            debugMode={debugMode}
            onReserve={handleReserveNumbers}
            onProceedToPayment={handleProceedToPaymentWithButton}
            getSoldNumbersCount={getSoldNumbersCount}
            reservationDays={reservationDays}
            lotteryDate={lotteryDate}
            organization={organization}
            totalNumbers={raffle?.total_numbers}
            mini_instructivo={raffle?.mini_instructivo}
          />
        </div>
        
        {/* Raffle info */}
        <div className="mb-4">
          <RaffleInfoSection 
            raffle={raffle} 
            seller={seller} 
            organization={organization} 
          />
        </div>

        {/* Promotional Image - MOVED UP */}
        {organization?.imagen_publicitaria && (
          <PromotionalImage imageUrl={organization.imagen_publicitaria} />
        )}
        
        {/* Disclaimer Card - MOVED DOWN */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="text-center text-xs italic">
              Las redes sociales no están asociadas a esta rifa.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VentaBoletosMain;
