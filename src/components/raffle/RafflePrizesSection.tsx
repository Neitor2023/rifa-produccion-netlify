
import React, { useState } from 'react';
import PrizeCarousel from '@/components/PrizeCarousel';
import PrizeDetailModal from '@/components/PrizeDetailModal';
import { Prize, PrizeImage } from '@/lib/constants';

interface RafflePrizesSectionProps {
  prizes: Prize[];
  prizeImages: PrizeImage[];
}

const RafflePrizesSection: React.FC<RafflePrizesSectionProps> = ({ 
  prizes, 
  prizeImages 
}) => {
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);

  const handleViewPrizeDetails = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsPrizeModalOpen(true);
  };

  return (
    <>
      <PrizeCarousel 
        prizes={prizes} 
        onViewDetails={handleViewPrizeDetails} 
      />
      
      <PrizeDetailModal 
        isOpen={isPrizeModalOpen}
        onClose={() => setIsPrizeModalOpen(false)}
        prize={selectedPrize}
        prizeImages={prizeImages}
      />
    </>
  );
};

export default RafflePrizesSection;
