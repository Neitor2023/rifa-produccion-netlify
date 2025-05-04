
import React from 'react';
import NumberGridItem from '../NumberGridItem';

interface RaffleNumber {
  id: string;
  number: string;
  status: string;
}

interface GridRendererProps {
  numbers: RaffleNumber[];
  selectedNumbers: string[];
  highlightReserved: boolean;
  onToggle: (number: string, status: string) => void;
}

const GridRenderer: React.FC<GridRendererProps> = ({
  numbers,
  selectedNumbers,
  highlightReserved,
  onToggle,
}) => {
  const renderGrid = () => {
    const grid = [];
    for (let row = 0; row < 10; row++) {
      const rowItems = [];
      for (let col = 0; col < 10; col++) {
        const num = row * 10 + col;
        const paddedNum = num.toString().padStart(2, '0');
        const n = numbers.find((item) => item.number === paddedNum);
        const status = n ? n.status : 'available';
        const isSelected = selectedNumbers.includes(paddedNum);
        const isHighlighted = highlightReserved && status === 'reserved';
        
        const handleNumberClick = () => {
          console.log("[GridRenderer.tsx] number clicked:", paddedNum, "status:", status);
          
          // Block selection of sold numbers
          if (status === 'sold') {
            console.log(`NumberGrid.tsx: ⚠️ Intento de seleccionar número vendido:`, paddedNum);
            console.log(`NumberGrid.tsx: ✅ Selección de número vendido bloqueada:`, paddedNum);
            return;
          }
          
          if (highlightReserved && status === 'reserved') {
            onToggle(paddedNum, status);
          } else if (!highlightReserved && status === 'available') {
            // Only allow available numbers when not in highlight mode
            onToggle(paddedNum, status);
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
    return grid;
  };

  // Log selectedNumbers changes
  React.useEffect(() => {
    console.log("[GridRenderer.tsx] selectedNumbers:", selectedNumbers);
  }, [selectedNumbers]);

  return (
    <div className="flex flex-col gap-1 sm:gap-2 min-w-fit">
      {renderGrid()}
    </div>
  );
};

export default GridRenderer;
