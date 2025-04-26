
import React, { useMemo } from 'react';
import NumberGridItem from '../NumberGridItem';

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
  onPayReserved: (number: string) => void;  
}

const GridLayout: React.FC<GridLayoutProps> = ({
  numbers,
  selectedNumbers,
  highlightReserved,
  toggleNumber,
  onPayReserved,
}) => {
  // Al principio de GridLayout, justo tras los props:
  const numberMap = React.useMemo(
    () => Object.fromEntries(numbers.map(n => [n.number, n])),
    [numbers]
  );  

  // Log when highlightReserved changes
  React.useEffect(() => {
    console.log("📊 GridLayout - highlightReserved changed:", highlightReserved);
  }, [highlightReserved]);

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

      rowItems.push(
        <NumberGridItem
          key={paddedNum}
          number={paddedNum}
          status={status}
          isSelected={isSelected}
          isHighlighted={isHighlighted}
          onToggle={() => {
            if (highlightReserved && status === 'reserved') {
              console.log("▶️ GridLayout.tsx: pulsado reservado:", paddedNum);
              // 1) Guarda el número seleccionado
              setSelectedReservedNumber(paddedNum);
              // 2) Abre la modal de validación
              setIsPhoneModalOpen(true);
            } else {
              toggleNumber(paddedNum, status);
            }
          }}
        />
      );
    }

    grid.push(
      <div key={`row-${row}`} className="flex gap-1 sm:gap-2 justify-center">
        {rowItems}
      </div>
    );
  }
  
  console.log('📊 GridLayout - highlightReserved:', highlightReserved);
  return (
    <div className="flex flex-col gap-1 sm:gap-2 min-w-fit">
      {grid}
    </div>
  );
};

export default GridLayout;
