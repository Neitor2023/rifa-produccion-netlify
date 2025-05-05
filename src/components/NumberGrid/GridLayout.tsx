
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
  totalNumbers?: number; // Añadimos prop para recibir total_numbers
}

const GridLayout: React.FC<GridLayoutProps> = ({
  numbers,
  selectedNumbers,
  highlightReserved,
  toggleNumber,
  onPayReserved,
  organization,
  totalNumbers = 99, // Por defecto, mostrar hasta 99 números (0-99) si no se especifica
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

  // Calculamos cuántas filas y columnas necesitamos para mostrar todos los números
  const calculateGridDimensions = () => {
    // Aseguramos que totalNumbers sea siempre un número
    const total = Math.max(1, totalNumbers || 0);
    
    // Determinamos el número de columnas (10 es un buen valor para móviles y desktop)
    const columns = 10;
    
    // Calculamos cuántas filas necesitamos para mostrar todos los números
    const rows = Math.ceil((total + 1) / columns); // +1 porque incluimos el 0
    
    return { rows, columns };
  };

  const { rows, columns } = calculateGridDimensions();
  
  // Generamos la cuadrícula de números
  const grid = [];
  for (let row = 0; row < rows; row++) {
    const rowItems = [];
    for (let col = 0; col < columns; col++) {
      const num = row * columns + col;
      
      // Si excedemos el totalNumbers, no renderizamos más números
      if (num > totalNumbers) break;
      
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
          checklistImage={organization?.image_checklist}
          onToggle={() => {
            if (highlightReserved && status === 'reserved') {
              // Directly call toggleNumber instead of onPayReserved
              console.log("▶️ src/components/NumberGrid/GridLayout.tsx: pulsado reservado:", paddedNum);
              toggleNumber(paddedNum, status);
            } else {
              // Lógica normal de selección
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
