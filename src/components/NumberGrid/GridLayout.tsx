
import React, { useMemo, useEffect } from 'react';
import NumberGridItem from '../NumberGridItem';
import { toast } from 'sonner';

interface RaffleNumber {
  id: string;
  raffle_id: string;
  number: string;
  status: string;
  seller_id: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  payment_method: string | null;
  payment_proof: string | null;
  payment_date: string | null;
  participant_id?: string | null;
}

interface GridLayoutProps {
  numbers: RaffleNumber[];
  selectedNumbers: string[];
  highlightReserved: boolean;
  toggleNumber: (number: string, status: string) => void;
  onPayReserved: () => void;  
}

const GridLayout: React.FC<GridLayoutProps> = ({
  numbers,
  selectedNumbers,
  highlightReserved,
  toggleNumber,
  onPayReserved,
}) => {
  // Create a map of number to raffle number object for easy lookup
  const numberMap = React.useMemo(
    () => Object.fromEntries(numbers.map(n => [n.number, n])),
    [numbers]
  );  

  // Log when highlightReserved changes
  React.useEffect(() => {
    console.log("▶️ GridLayout.tsx: Estado de highlightReserved cambiado:", highlightReserved);
  }, [highlightReserved]);
  
  // Check if there are any reserved numbers
  const hasReservedNumbers = React.useMemo(() => {
    const reserved = numbers.filter(n => n.status === 'reserved');
    console.log(`▶️ GridLayout.tsx: Hay ${reserved.length} números reservados`);
    return reserved.length > 0;
  }, [numbers]);
  
  // Show instructional toast when highlight mode is active
  React.useEffect(() => {
    if (highlightReserved && hasReservedNumbers) {
      toast.info("Seleccione su número apartado para seguir el proceso de pago");
    }
  }, [highlightReserved, hasReservedNumbers]);

  // Log selectedNumbers changes
  React.useEffect(() => {
    console.log("[GridLayout.tsx] selectedNumbers:", selectedNumbers);
  }, [selectedNumbers]);

  const grid = [];
  for (let row = 0; row < 10; row++) {
    const rowItems = [];
    for (let col = 0; col < 10; col++) {
      const num = row * 10 + col;
      const paddedNum = num.toString().padStart(2, '0');
      const raffleNumber = numberMap[paddedNum];
      const status = raffleNumber ? raffleNumber.status : 'available';
      const isSelected = selectedNumbers.includes(paddedNum);
      const isHighlighted = highlightReserved && status === 'reserved';

      const handleNumberClick = () => {
        console.log("[GridLayout.tsx] number clicked:", paddedNum, "status:", status);
        
        // Block selection of sold numbers
        if (status === 'sold') {
          console.log(`NumberGrid.tsx: ⚠️ Intento de seleccionar número vendido:`, paddedNum);
          console.log(`NumberGrid.tsx: ✅ Selección de número vendido bloqueada:`, paddedNum);
          return; 
        }
        
        if (highlightReserved && status === 'reserved') {
          console.log("▶️ GridLayout.tsx: Número reservado seleccionado:", paddedNum);
          toggleNumber(paddedNum, status);
        } else if (!highlightReserved && status === 'available') {
          // Normal selection logic - only allow available numbers when not in highlight mode
          toggleNumber(paddedNum, status);
        }
      };

      rowItems.push(
        <NumberGridItem
          key={paddedNum}
          number={paddedNum}
          status={status}
          isSelected={isSelected}
          isHighlighted={isHighlighted}
          onToggle={handleNumberClick}
        />
      );
    }

    grid.push(
      <div key={`row-${row}`} className="flex gap-1 sm:gap-2 justify-center">
        {rowItems}
      </div>
    );
  }
  
  console.log('▶️ GridLayout.tsx: Estado de resaltado de reservados:', highlightReserved);
  return (
    <div className="flex flex-col gap-1 sm:gap-2 min-w-fit">
      {grid}
    </div>
  );
};

export default GridLayout;
