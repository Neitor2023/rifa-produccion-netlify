
import React, { useEffect } from 'react';
import { BuyerInfoProvider } from '@/contexts/BuyerInfoContext';
import { NumberSelectionProvider } from '@/contexts/NumberSelectionContext';
import VentaBoletosContent from '@/components/raffle/VentaBoletosContent';
import { RAFFLE_ID, SELLER_ID } from '@/utils/setGlobalIdsFromUrl';

const VentaBoletos: React.FC = () => {
  useEffect(() => {
    console.log("[VentaBoletos.tsx] 🔍 INVESTIGACIÓN: Página de venta cargada con parámetros:", {
      RAFFLE_ID,
      SELLER_ID,
      hayRaffleId: !!RAFFLE_ID,
      haySellerId: !!SELLER_ID
    });
    
    // VALIDACIÓN CRÍTICA: Verificar que los IDs estén disponibles
    if (!RAFFLE_ID) {
      console.error("[VentaBoletos.tsx] ❌ CRÍTICO: RAFFLE_ID no está definido");
    }
    if (!SELLER_ID) {
      console.error("[VentaBoletos.tsx] ❌ CRÍTICO: SELLER_ID no está definido");
    }
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
