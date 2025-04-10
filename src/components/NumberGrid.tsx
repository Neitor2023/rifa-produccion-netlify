
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle2, CreditCard } from 'lucide-react';
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
}

interface RaffleSeller {
  id: string;
  raffle_id: string;
  seller_id: string;
  active: boolean;
  cant_max: number;
}

interface NumberGridProps {
  numbers: RaffleNumber[];
  raffleSeller: RaffleSeller;
  onReserve: (selectedNumbers: string[]) => void;
  onProceedToPayment: (selectedNumbers: string[]) => void;
}

const NumberGrid: React.FC<NumberGridProps> = ({ 
  numbers, 
  raffleSeller,
  onReserve,
  onProceedToPayment
}) => {
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  
  const toggleNumber = (number: string, status: string) => {
    if (status !== 'available') return;
    
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        // Check if adding this number would exceed the maximum allowed
        if (prev.length >= raffleSeller.cant_max) {
          toast.error(`No puede seleccionar más de ${raffleSeller.cant_max} números`);
          return prev;
        }
        return [...prev, number];
      }
    });
  };
  
  const clearSelection = () => {
    setSelectedNumbers([]);
  };
  
  const handleReserve = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Seleccione al menos un número para apartar');
      return;
    }
    onReserve(selectedNumbers);
    setSelectedNumbers([]);
  };
  
  const handleProceedToPayment = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Seleccione al menos un número para pagar');
      return;
    }
    onProceedToPayment(selectedNumbers);
  };

  // Create a 10x10 grid layout
  const renderGrid = () => {
    const grid = [];
    for (let row = 0; row < 10; row++) {
      const rowItems = [];
      for (let col = 0; col < 10; col++) {
        const num = row * 10 + col;
        const paddedNum = num.toString().padStart(2, '0');
        const raffleNumber = numbers.find(n => n.number === paddedNum);
        const status = raffleNumber ? raffleNumber.status : 'available';
        const isSelected = selectedNumbers.includes(paddedNum);
        
        rowItems.push(
          <div
            key={paddedNum}
            className={`
              number-grid-item
              flex items-center justify-center
              border rounded-md
              h-12 w-12 sm:h-10 sm:w-10 md:h-12 md:w-12
              cursor-pointer
              text-center
              ${status !== 'available' ? 'bg-gray-100 cursor-not-allowed' : ''}
              ${isSelected ? 'bg-rifa-purple text-white' : status === 'available' ? 'bg-white hover:bg-gray-100' : ''}
            `}
            onClick={() => toggleNumber(paddedNum, status)}
          >
            {paddedNum}
          </div>
        );
      }
      
      grid.push(
        <div key={`row-${row}`} className="flex gap-2 justify-center">
          {rowItems}
        </div>
      );
    }
    
    return grid;
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 text-center text-gray-800">Seleccione sus números</h2>
      
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex flex-col gap-4">
          {renderGrid()}
        </div>
      </div>
      
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="text-sm">
          <span className="font-medium">Seleccionados:</span> {selectedNumbers.length} de {raffleSeller.cant_max}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700"
            onClick={clearSelection}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
          
          <Button
            variant="outline"
            className="border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white"
            onClick={handleReserve}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Apartar
          </Button>
          
          <Button
            className="bg-rifa-purple hover:bg-rifa-darkPurple"
            onClick={handleProceedToPayment}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pagar
          </Button>
        </div>
      </div>
      
      <div className="mt-4 flex gap-4 justify-center">
        <div className="flex items-center">
          <div className="h-4 w-4 bg-white border rounded-sm mr-2"></div>
          <span className="text-xs text-gray-600">Disponible</span>
        </div>
        
        <div className="flex items-center">
          <div className="h-4 w-4 bg-rifa-purple rounded-sm mr-2"></div>
          <span className="text-xs text-gray-600">Seleccionado</span>
        </div>
        
        <div className="flex items-center">
          <div className="h-4 w-4 bg-gray-100 rounded-sm mr-2"></div>
          <span className="text-xs text-gray-600">No disponible</span>
        </div>
      </div>
    </div>
  );
};

export default NumberGrid;
