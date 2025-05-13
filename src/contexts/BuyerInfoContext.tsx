
import React, { createContext, useContext, useState } from 'react';
import { ValidatedBuyerInfo } from '@/types/participant';

interface BuyerInfoContextProps {
  buyerInfo: ValidatedBuyerInfo | null;
  setBuyerInfo: React.Dispatch<React.SetStateAction<ValidatedBuyerInfo | null>>;
}

const BuyerInfoContext = createContext<BuyerInfoContextProps | undefined>(undefined);

export const BuyerInfoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [buyerInfo, setBuyerInfo] = useState<ValidatedBuyerInfo | null>(null);
  const value = { buyerInfo, setBuyerInfo };
  
  return (
    <BuyerInfoContext.Provider value={value}>
      {children}
    </BuyerInfoContext.Provider>
  );
};

export const useBuyerInfo = () => {
  const context = useContext(BuyerInfoContext);
  if (!context) {
    throw new Error('useBuyerInfo debe utilizarse dentro de un BuyerInfoProvider');
  }
  return context;
};
