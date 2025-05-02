
import React, { createContext, useState, useContext } from 'react';
import { ValidatedBuyerInfo } from '@/types/participant';

// Define the context props interface
interface BuyerInfoContextProps {
  buyerInfo: ValidatedBuyerInfo | null;
  setBuyerInfo: React.Dispatch<React.SetStateAction<ValidatedBuyerInfo | null>>;
}

// Create the context with undefined as default value
const BuyerInfoContext = createContext<BuyerInfoContextProps | undefined>(undefined);

// Provider component
interface BuyerInfoProviderProps {
  children: React.ReactNode;
}

export const BuyerInfoProvider: React.FC<BuyerInfoProviderProps> = ({ children }) => {
  const [buyerInfo, setBuyerInfo] = useState<ValidatedBuyerInfo | null>(null);
  
  return (
    <BuyerInfoContext.Provider value={{ buyerInfo, setBuyerInfo }}>
      {children}
    </BuyerInfoContext.Provider>
  );
};

// Custom hook for using the context
export const useBuyerInfo = (): BuyerInfoContextProps => {
  const context = useContext(BuyerInfoContext);
  
  if (context === undefined) {
    throw new Error('useBuyerInfo must be used within a BuyerInfoProvider');
  }
  
  return context;
};
