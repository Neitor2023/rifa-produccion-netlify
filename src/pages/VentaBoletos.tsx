
import React, { useEffect } from 'react';
import { BuyerInfoProvider } from '@/contexts/BuyerInfoContext';
import { NumberSelectionProvider } from '@/contexts/NumberSelectionContext';
import VentaBoletosContent from '@/components/raffle/VentaBoletosContent';
import { RAFFLE_ID, SELLER_ID } from '@/utils/setGlobalIdsFromUrl';

const VentaBoletos: React.FC = () => {
  useEffect(() => {
    console.log("[VentaBoletos.tsx] Página de venta cargada con parámetros:", {
      RAFFLE_ID,
      SELLER_ID
    });
  }, []);

  return (
    <BuyerInfoProvider>
      <NumberSelectionProvider>
        <VentaBoletosContent />
      </NumberSelectionProvider>
    </BuyerInfoProvider>
  );
};

export default VentaBoletos;
