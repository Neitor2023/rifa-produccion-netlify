
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
  onProceedToPayment: (buttonType: string) => void; // Modified to accept button type
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
    // Removed toast notification here
  };
  
  // Handler for the Pagar button with button name
  const handleProceedToPayment = () => {
    console.log("NumberGridControls.tsx: Pay button clicked");
    onProceedToPayment("Pagar");
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
        className="flex items-center gap-2" 
        onClick={handleClearSelection}
      >
        <Check className="h-4 w-4" />
        <span>Limpiar</span>
      </Button>
      
      <Button
        variant="secondary"
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white"
        onClick={onReserve}
      >
        <ShoppingCart className="h-4 w-4" />
        <span>Apartar</span>
      </Button>
      
      <Button 
        variant="secondary"
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
        onClick={handlePayReserved}
      >
        <CreditCard className="h-4 w-4" />
        <span>Pagar Apartados</span>
      </Button>
      
      <Button
        variant="secondary" 
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
        onClick={handleProceedToPayment}
      >
        <CreditCard className="h-4 w-4" />
        <span>Pagar</span>
      </Button>
    </div>
  );
};
