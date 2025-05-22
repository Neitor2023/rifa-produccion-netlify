
import React, { useMemo } from 'react';
import NumberGridItem from '../NumberGridItem';
import { Organization } from '@/lib/constants';

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
  organization?: Organization;
  totalNumbers?: number;
}

const GridLayout: React.FC<GridLayoutProps> = ({
  numbers,
  selectedNumbers,
  highlightReserved,
  toggleNumber,
  onPayReserved,
  organization,
  totalNumbers = 99,
}) => {
  // At the beginning of GridLayout, just after the props:
  const numberMap = React.useMemo(
    () => {
      // Crear un mapa para acceder rápidamente a los números
      const map = Object.fromEntries(numbers.map(n => [n.number, n]));
      
      // Registrar en consola los números con estado 'returned' que se tratarán como disponibles
      const returnedNumbers = numbers.filter(n => n.status === 'returned').map(n => n.number);
      if (returnedNumbers.length > 0) {
        console.log("🔄 [GridLayout.tsx] Números con estado 'returned' que serán tratados como disponibles:", returnedNumbers);
      }
      
      return map;
    },
    [numbers]
  );  

  // Log when highlightReserved changes
  React.useEffect(() => {
    console.log("📊 GridLayout - highlightReserved changed:", highlightReserved);
  }, [highlightReserved]);

  // Calculate how many rows and columns we need to display all numbers
  const calculateGridDimensions = () => {
    // Ensure totalNumbers is always a number
    const total = Math.max(1, totalNumbers || 0);
    
    // Determine the number of columns (10 is a good value for mobile and desktop)
    const columns = 10;
    
    // Calculate how many rows we need to display all numbers
    const rows = Math.ceil((total + 1) / columns); // +1 because we include 0
    
    return { rows, columns };
  };

  const { rows, columns } = calculateGridDimensions();
  
  // Generate the grid of numbers
  const grid = [];
  for (let row = 0; row < rows; row++) {
    const rowItems = [];
    for (let col = 0; col < columns; col++) {
      const num = row * columns + col;
      
      // If we exceed totalNumbers, don't render more numbers
      if (num > totalNumbers) break;
      
      const paddedNum = num.toString().padStart(2, '0');
      const raffleNumber = numberMap[paddedNum];
      
      // Nueva lógica: Si el estado es 'returned', considerarlo como 'available'
      let status = raffleNumber ? raffleNumber.status : 'available';
      if (status === 'returned') {
        console.log(`🔄 [GridLayout.tsx] Tratando número ${paddedNum} con estado 'returned' como 'available'`);
        status = 'available';
      }
      
      const isSelected = selectedNumbers.includes(paddedNum);
      const isHighlighted = highlightReserved && status === 'reserved';

      rowItems.push(
        <NumberGridItem
          key={paddedNum}
          number={paddedNum}
          status={status}
          isSelected={isSelected}
          isHighlighted={isHighlighted}
          checklistImage={organization?.image_checklist}
          reservedImage={organization?.image_apartado} // Pass the reserved image URL
          onToggle={() => {
            if (highlightReserved && status === 'reserved') {
              // Directly call toggleNumber instead of onPayReserved
              console.log("▶️ src/components/NumberGrid/GridLayout.tsx: pulsado reservado:", paddedNum);
              toggleNumber(paddedNum, status);
            } else {
              // Normal selection logic
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
