
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, Check } from 'lucide-react';

interface NumberGridControlsProps {
  validatedBuyerData: ValidatedBuyerInfo | null; 
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
  onProceedToPayment: () => void;
}

export const NumberGridControls: React.FC<NumberGridControlsProps> = ({
  selectedNumbers,
  raffleSeller,
  onClearSelection,
  onReserve,
  onPayReserved,
  onProceedToPayment,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
      <Button 
        variant="outline" 
        className="flex items-center gap-2" 
        onClick={onClearSelection}
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
        // onClick={onPayReserved}
        onClick={() => onPayReserved(selectedNumbers, validatedBuyerData!)}
      >
        <CreditCard className="h-4 w-4" />
        <span>Pagar Apartados</span>
      </Button>
      
      <Button
        variant="secondary" 
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
        onClick={onProceedToPayment}
      >
        <CreditCard className="h-4 w-4" />
        <span>Pagar</span>
      </Button>
    </div>
  );
};
