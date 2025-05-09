
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, CreditCard, ShoppingCart } from 'lucide-react';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import SafeImage from './SafeImage';
import { Organization } from '@/lib/constants/types';
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

  const buttons = [
    {
      key: "clear",
      variant: "outline",
      onClick: handleClearSelection,
      bgClass: "bg-[#1EAEDB] dark:bg-[#1EAEDB]",
      iconOrImage: organization?.imagen_limpiar
        ? <SafeImage src={organization.imagen_limpiar} alt="Limpiar Icon" /*…*/ />
        : <Check className="h-full w-full" />,
      text: "Limpiar\nSelección"
    },
    {
      key: "reserve",
      variant: "secondary",
      onClick: onReserve,
      bgClass: "bg-amber-500 hover:bg-amber-600",
      iconOrImage: organization?.image_apartado
        ? <SafeImage src={organization.image_apartado} alt="Apartar Icon" /*…*/ />
        : <ShoppingCart className="h-full w-full" />,
      text: "Apartar\nNúmero(s)"
    },
    {
      key: "payReserved",
      variant: "secondary",
      onClick: handlePayReserved,
      bgClass: "bg-orange-500 hover:bg-orange-600",
      iconOrImage: organization?.imagen_pago_apartado
        ? <SafeImage src={organization.imagen_pago_apartado} alt="Pagar Apartados Icon" /*…*/ />
        : <CreditCard className="h-full w-full" />,
      text: "Pagar\nApartados"
    },
    {
      key: "pay",
      variant: "secondary",
      onClick: handleProceedToPayment,
      bgClass: "bg-green-500 hover:bg-green-600",
      iconOrImage: organization?.imagen_pago
        ? <SafeImage src={organization.imagen_pago} alt="Pagar Icon" /*…*/ />
        : <CreditCard className="h-full w-full" />,
      text: "Pago\nDirecto"
    }
  ];

  
  return (
    <div className="flex flex-row flex-wrap gap-2 mb-6">
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
          <div className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center mb-1 md:mb-0">
            {btn.iconOrImage}
          </div>
          <div className="text-xs text-center md:text-left">
            {btn.text.split("\n").map((line, i) => (
              <span key={i} className="block md:inline">{line}</span>
            ))}
          </div>
        </Button>
      ))}
    </div>
  );
};
