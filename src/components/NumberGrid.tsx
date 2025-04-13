
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle2, CreditCard, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';
import PhoneValidationModal from './PhoneValidationModal';

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
  const [highlightReserved, setHighlightReserved] = useState(false);
  const [showReservedMessage, setShowReservedMessage] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [selectedReservedNumber, setSelectedReservedNumber] = useState<string | null>(null);
  
  const toggleNumber = (number: string, status: string) => {
    // If we're in "highlight reserved" mode and the user clicks on a reserved number
    if (highlightReserved && status === 'reserved') {
      setSelectedReservedNumber(number);
      setIsPhoneModalOpen(true);
      return;
    }
    
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
    // Turn off the highlight reserved mode if it's active
    if (highlightReserved) {
      setHighlightReserved(false);
      setShowReservedMessage(false);
    }
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
  
  const handlePayReserved = () => {
    setHighlightReserved(true);
    setShowReservedMessage(true);
  };
  
  const handleValidationSuccess = (validatedNumber: string) => {
    setIsPhoneModalOpen(false);
    
    // Find all reserved numbers for the validated user
    const userReservedNumbers = numbers
      .filter(n => n.status === 'reserved' && n.number === validatedNumber)
      .map(n => n.number);
    
    if (userReservedNumbers.length > 0) {
      onProceedToPayment(userReservedNumbers);
    }
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
        const isHighlighted = highlightReserved && status === 'reserved';
        
        rowItems.push(
          <div
            key={paddedNum}
            className={`
              number-grid-item
              flex items-center justify-center
              border rounded-md
              h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10
              cursor-pointer
              text-sm font-medium
              ${status !== 'available' && !isHighlighted ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400' : ''}
              ${isSelected 
                ? 'bg-rifa-purple text-white dark:bg-purple-700 dark:text-white border-rifa-purple dark:border-purple-600' 
                : isHighlighted 
                  ? 'bg-amber-300 text-amber-950 border-amber-500 hover:bg-amber-400'
                  : status === 'available' 
                    ? 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200' 
                    : ''
              }
              transition-colors duration-150
            `}
            onClick={() => toggleNumber(paddedNum, status)}
          >
            {paddedNum}
          </div>
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

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 text-center text-gray-800 dark:text-gray-200">Seleccione sus números</h2>
      
      {showReservedMessage && (
        <Alert className="mb-4 bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
          <div className="flex justify-between items-center">
            <AlertDescription className="text-sm">
              📢 Pulse sobre su número apartado para proceder al pago.
            </AlertDescription>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setShowReservedMessage(false);
                setHighlightReserved(false);
              }}
              className="h-6 w-6 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}
      
      <Card className="p-2 sm:p-4 mb-4 bg-white dark:bg-gray-800 overflow-x-auto">
        <div className="flex flex-col gap-1 sm:gap-2 min-w-fit">
          {renderGrid()}
        </div>
      </Card>
      
      <Card className="p-3 sm:p-4 mb-4 bg-white dark:bg-gray-800">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            <span>Seleccionados:</span> {selectedNumbers.length} de {raffleSeller.cant_max}
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={clearSelection}
            >
              <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Limpiar</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-600"
              onClick={handleReserve}
            >
              <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Apartar</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="border-amber-500 bg-amber-500 text-white hover:bg-amber-600 dark:border-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
              onClick={handlePayReserved}
            >
              <Wallet className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">💰 Pagar Apartados</span>
            </Button>
            
            <Button
              size="sm"
              className="bg-rifa-purple hover:bg-rifa-darkPurple text-white dark:bg-purple-700 dark:hover:bg-purple-800"
              onClick={handleProceedToPayment}
            >
              <CreditCard className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Pagar</span>
            </Button>
          </div>
        </div>
      </Card>
      
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center">
          <div className="h-4 w-4 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-sm mr-2"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Disponible</span>
        </div>
        
        <div className="flex items-center">
          <div className="h-4 w-4 bg-rifa-purple dark:bg-purple-700 rounded-sm mr-2"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Seleccionado</span>
        </div>
        
        <div className="flex items-center">
          <div className="h-4 w-4 bg-gray-100 dark:bg-gray-700 rounded-sm mr-2"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">No disponible</span>
        </div>
        
        {highlightReserved && (
          <div className="flex items-center">
            <div className="h-4 w-4 bg-amber-300 border-amber-500 rounded-sm mr-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Apartado</span>
          </div>
        )}
      </div>
      
      <PhoneValidationModal 
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onValidate={handleValidationSuccess}
        selectedNumber={selectedReservedNumber}
        raffleNumbers={numbers}
      />
    </div>
  );
};

export default NumberGrid;
