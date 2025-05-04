
import React from 'react';
import { BuyerInfoProvider } from '@/contexts/BuyerInfoContext';
import { NumberSelectionProvider } from '@/contexts/NumberSelectionContext';
import VentaBoletosContent from '@/components/raffle/VentaBoletosContent';

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
