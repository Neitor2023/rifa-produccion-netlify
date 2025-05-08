
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, Check } from 'lucide-react';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';

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
  onProceedToPayment: (buttonType: string) => Promise<void>; // Updated to match return type
}

export const NumberGridControls: React.FC<NumberGridControlsProps> = ({
  selectedNumbers,
  raffleSeller,
  onClearSelection,
  onReserve,
  onPayReserved,
  onProceedToPayment,
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
      <Button 
        variant="outline" 
        className="flex items-center gap-2 bg-[#1EAEDB] hover:bg-[#1EAEDB]/80 text-white dark:bg-[#1EAEDB] dark:hover:bg-[#1EAEDB]/80 dark:text-white font-bold uppercase" 
        onClick={handleClearSelection}
      >
        <Check className="h-4 w-4" />
        <span>Limpiar</span>
      </Button>
      
      <Button
        variant="secondary"
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase"
        onClick={onReserve}
      >
        <ShoppingCart className="h-4 w-4" />
        <span>Apartar</span>
      </Button>
      
      <Button 
        variant="secondary"
        className="
          flex flex-col items-center justify-center   /* apilar icono + texto */
          gap-1                                       /* pequeño espacio vertical */
          bg-orange-500 hover:bg-orange-600 
          text-white font-bold
          aspect-square                               /* igual ancho y alto */
          p-4                                         /* relleno interior */
        "
        onClick={handlePayReserved}
      >
        <CreditCard className="h-4 w-4" />
        <span>Pagar<br/>Apartados</span>
      </Button>
      
      <Button
        variant="secondary" 
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold uppercase"
        onClick={handleProceedToPayment}
      >
        <CreditCard className="h-4 w-4" />
        <span>Pagar</span>
      </Button>
    </div>
  );
};
