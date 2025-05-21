
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, Check } from 'lucide-react';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import { cn } from "@/lib/utils";

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
  
  // Handler for the Pagar button with button name 36
  const handleProceedToPayment = async () => {
    console.log("🔍 [NumberGridControls.tsx] Pagar button clicked, números seleccionados:", selectedNumbers);
    
    if (!selectedNumbers || selectedNumbers.length === 0) {
      console.warn("⚠️ [NumberGridControls.tsx] No hay números seleccionados para proceder al pago");
      return;
    }
    
    await onProceedToPayment("Pagar");
  };
  
  // Handler for the Pay Reserved button
  const handlePayReserved = () => {
    console.log("🔍 [NumberGridControls.tsx] Pay Reserved button clicked");
    onPayReserved();
  };

  const buttons = [
    {
      key: "clear",
      variant: "outline" as const, // Fixed: Using "as const" to specify the literal type
      onClick: handleClearSelection,
      bgClass: "bg-[#1EAEDB] dark:bg-[#1EAEDB]",
      iconOrImage: <Check className="h-full w-full" />,
      text: "Limpiar \nSelección"
    },
    {
      key: "reserve",
      variant: "secondary" as const, // Fixed: Using "as const" to specify the literal type
      onClick: onReserve,
      bgClass: "bg-amber-500 hover:bg-amber-600",
      iconOrImage: <ShoppingCart className="h-full w-full" />, 
      text: "Apartar \nNúmero(s)"
    },
    {
      key: "payReserved",
      variant: "secondary" as const, // Fixed: Using "as const" to specify the literal type
      onClick: handlePayReserved,
      bgClass: "bg-orange-500 hover:bg-orange-600",
      iconOrImage: <CreditCard className="h-full w-full" />,   
      text: "Pagar \nApartados"
    },
    {
      key: "pay",
      variant: "secondary" as const, // Fixed: Using "as const" to specify the literal type
      onClick: handleProceedToPayment,
      bgClass: "bg-green-500 hover:bg-green-600",
      iconOrImage: <CreditCard className="h-full w-full" />,
      text: "Pagar \nDirecto"
    }
  ];
    
  return (
    <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 mb-6">
      {buttons.map(btn => (
        <Button
          key={btn.key}
          variant={btn.variant}
          onClick={btn.onClick}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-2 w-26 h-26 md:flex-row md:items-center md:justify-start md:gap-2",
            btn.bgClass
          )}
        >
          <div className="[&_svg]:h-8 [&_svg]:w-8 flex items-center justify-center mb-1 md:mb-0">  
            {btn.iconOrImage}
          </div>          
          <div className="text-sm text-center md:text-left">
            {btn.text.split("\n").map((line, i) => (
              <span key={i} className="block md:inline">{line}</span>
            ))}
          </div>
        </Button>
      ))}
    </div>
  );
};
