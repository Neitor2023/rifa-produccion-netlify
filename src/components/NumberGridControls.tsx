
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, CreditCard, ShoppingCart } from 'lucide-react';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import SafeImage from './SafeImage';
import { Organization } from '@/lib/constants/types';

interface NumberGridControlsProps {
  selectedNumbers: string[];
  raffleSeller: {
    id: string;
    raffle_id: string;
    seller_id: string;
    active: boolean;
    cant_max: number;
  };
  onClearSelection: () => void;
  onReserve: () => void;
  onPayReserved: () => void;
  onProceedToPayment: (buttonType: string) => Promise<void>;
  organization?: Organization | null;
}

export const NumberGridControls: React.FC<NumberGridControlsProps> = ({
  selectedNumbers,
  raffleSeller,
  onClearSelection,
  onReserve,
  onPayReserved,
  onProceedToPayment,
  organization,
}) => {
  const handleClearSelection = () => {
    console.log("NumberGridControls.tsx: Clear button clicked");
    onClearSelection();
  };
  
  // Handler for the Pagar button with button name
  const handleProceedToPayment = async () => {
    console.log("NumberGridControls.tsx: Pay button clicked");
    await onProceedToPayment("Pagar");
  };
  
  // Handler for the Pay Reserved button
  const handlePayReserved = () => {
    console.log("NumberGridControls.tsx: Pay Reserved button clicked");
    onPayReserved();
  };

  // Debug logs for image URLs
  console.log('[NumberGridControls] Button image (Limpiar):', organization?.imagen_limpiar);
  console.log('[NumberGridControls] Button image (Apartar):', organization?.image_apartado);
  console.log('[NumberGridControls] Button image (Pagar Apartados):', organization?.imagen_pago_apartado);
  console.log('[NumberGridControls] Button image (Pagar):', organization?.imagen_pago);

  return (
    <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 mb-6">
      <Button 
        variant="outline" 
        className="flex flex-col items-center justify-center gap-1 py-2 w-26 h-26 md:w-30 md:h-30 bg-[#1EAEDB] hover:bg-[#1EAEDB]/80 text-white dark:bg-[#1EAEDB] dark:hover:bg-[#1EAEDB]/80 dark:text-white"                      
        onClick={handleClearSelection}
      >
        <div className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center mb-1">
          {organization?.imagen_limpiar ? (
            <SafeImage 
              src={organization.imagen_limpiar} 
              alt="Limpiar Icon"
              containerClassName="w-full h-full"
              className="object-contain w-full h-full"
            />
          ) : (
            <Check className="h-full w-full" />
          )}
        </div>
        <div className="text-xs whitespace-pre-line text-center">
          Limpiar
          {"\n"}
          Selección
        </div>                        
      </Button>
      
      <Button
        variant="secondary"
        className="flex flex-col items-center justify-center gap-1 py-2 w-26 h-26 md:w-20 md:h-20 bg-amber-500 hover:bg-amber-600 text-white"
        onClick={onReserve}
      >
        <div className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center mb-1">
          {organization?.image_apartado ? (
            <SafeImage 
              src={organization.image_apartado} 
              alt="Apartar Icon"
              containerClassName="w-full h-full"
              className="object-contain w-full h-full"
            />
          ) : (
            <ShoppingCart className="h-full w-full" />
          )}
        </div>
        <div className="text-xs whitespace-pre-line text-center">
          Apartar
          {"\n"}
          Número(s)
        </div>                
      </Button>
      
      <Button 
        variant="secondary"
        className="flex flex-col items-center justify-center gap-1 py-2 w-26 h-26 md:w-20 md:h-20 bg-orange-500 hover:bg-orange-600 text-white"
        onClick={handlePayReserved}
      >
        <div className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center mb-1">
          {organization?.imagen_pago_apartado ? (
            <SafeImage 
              src={organization.imagen_pago_apartado} 
              alt="Pagar Apartados Icon"
              containerClassName="w-full h-full"
              className="object-contain w-full h-full"
            />
          ) : (
            <CreditCard className="h-full w-full" />
          )}
        </div>
        <div className="text-xs whitespace-pre-line text-center">
          Pagar
          {"\n"}
          Apartados
        </div>
      </Button>
      
      <Button
        variant="secondary" 
        className="flex flex-col items-center justify-center gap-1 py-2 w-26 h-26 md:w-20 md:h-20 bg-green-500 hover:bg-green-600 text-white"
        onClick={handleProceedToPayment}
      >
        <div className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center mb-1">
          {organization?.imagen_pago ? (
            <SafeImage 
              src={organization.imagen_pago} 
              alt="Pagar Icon"
              containerClassName="w-full h-full"
              className="object-contain w-full h-full"
            />
          ) : (
            <CreditCard className="h-full w-full" />
          )}
        </div>
        <div className="text-xs whitespace-pre-line text-center">
          Pago
          {"\n"}
          Directo
        </div>        
      </Button>
    </div>
  );
};
