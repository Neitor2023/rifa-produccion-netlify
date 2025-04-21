
import React from 'react';
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
}

const GridLayout: React.FC<GridLayoutProps> = ({
  numbers,
  selectedNumbers,
  highlightReserved,
  toggleNumber
}) => {
  const grid = [];
  for (let row = 0; row < 10; row++) {
    const rowItems = [];
    for (let col = 0; col < 10; col++) {
      const num = row * 10 + col;
      const paddedNum = num.toString().padStart(2, '0');
      const raffleNumber = numbers.find(n => n.number === paddedNum);
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
          onToggle={() => toggleNumber(paddedNum, status)}
        />
      );
    }

    grid.push(
      <div key={`row-${row}`} className="flex gap-1 sm:gap-2 justify-center">
        {rowItems}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 sm:gap-2 min-w-fit">
      {grid}
    </div>
  )
};

export default GridLayout;
