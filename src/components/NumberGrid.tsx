
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PhoneValidationModal from './PhoneValidationModal';
import ReservationModal from './ReservationModal';
import { supabase } from '@/integrations/supabase/client';
import { NumberGridControls } from './NumberGridControls';
import { NumberGridLegend } from './NumberGridLegend';

// Type definitions
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
  onReserve: (selectedNumbers: string[], buyerPhone?: string, buyerName?: string) => void;
  onProceedToPayment: (selectedNumbers: string[]) => void;
}

const NumberGrid: React.FC<NumberGridProps> = ({ 
  numbers, 
  raffleSeller,
  onReserve,
  onProceedToPayment
}) => {
  // State management
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [highlightReserved, setHighlightReserved] = useState(false);
  const [showReservedMessage, setShowReservedMessage] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedReservedNumber, setSelectedReservedNumber] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  
  // Check developer mode on component mount
  useEffect(() => {
    checkDeveloperMode();
  }, []);
  
  // Check if developer mode is enabled
  const checkDeveloperMode = async () => {
    try {
      const { data } = await supabase
        .from('organization')
        .select('modal')
        .limit(1)
        .single();
      
      setDebugMode(data?.modal === 'programador');
    } catch (error) {
      console.error('Error checking developer mode:', error);
    }
  };
  
  // Handle number selection/deselection
  const toggleNumber = (number: string, status: string) => {
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
        if (prev.length >= raffleSeller.cant_max) {
          toast.error(`No puede seleccionar más de ${raffleSeller.cant_max} números`);
          return prev;
        }
        return [...prev, number];
      }
    });
  };
  
  // Clear current selection
  const clearSelection = () => {
    setSelectedNumbers([]);
    if (highlightReserved) {
      setHighlightReserved(false);
      setShowReservedMessage(false);
    }
  };
  
  // Handle reservation request
  const handleReserve = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Seleccione al menos un número para apartar');
      return;
    }
    setIsReservationModalOpen(true);
  };
  
  // Handle reservation confirmation with validated data
  const handleConfirmReservation = (data: { buyerName: string; buyerPhone: string }) => {
    if (debugMode) {
      console.log('Reservation data:', data);
      console.log('Selected numbers:', selectedNumbers);
    }
    
    // Make sure both name and phone are valid
    if (!data.buyerName || !data.buyerPhone) {
      toast.error('Nombre y teléfono son obligatorios');
      return;
    }
    
    onReserve(selectedNumbers, data.buyerPhone, data.buyerName);
    setIsReservationModalOpen(false);
    setSelectedNumbers([]);
  };
  
  // Process payment for selected numbers
  const handleProceedToPayment = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Seleccione al menos un número para pagar');
      return;
    }
    onProceedToPayment(selectedNumbers);
  };
  
  // Toggle reserved numbers highlighting
  const handlePayReserved = () => {
    setHighlightReserved(true);
    setShowReservedMessage(true);
  };
  
  // Close reserved message alert
  const handleCloseReservedMessage = () => {
    setShowReservedMessage(false);
    setHighlightReserved(false);
  };
  
  // Handle successful phone validation
  const handleValidationSuccess = async (validatedNumber: string, participantId?: string) => {
    setIsPhoneModalOpen(false);
    
    try {
      if (debugMode) {
        console.log('Validation success with number:', validatedNumber);
        console.log('Participant ID:', participantId);
        console.log('Raffle ID:', raffleSeller.raffle_id);
        console.log('Seller ID:', raffleSeller.seller_id);
      }
      
      if (participantId) {
        handleParticipantValidation(participantId);
      } else {
        handleNumberValidation(validatedNumber);
      }
    } catch (error) {
      console.error('Error processing validation:', error);
      toast.error('Error al procesar la validación');
    }
  };
  
  // Handle validation by participant ID
  const handleParticipantValidation = async (participantId: string) => {
    if (debugMode) {
      console.log('Querying Supabase for reserved numbers with participant ID:', participantId);
    }
    
    const { data: reservedNumbers, error } = await supabase
      .from('raffle_numbers')
      .select('number')
      .eq('participant_id', participantId)
      .eq('status', 'reserved')
      .eq('raffle_id', raffleSeller.raffle_id)
      .eq('seller_id', raffleSeller.seller_id);
    
    if (error) {
      console.error('Error fetching reserved numbers:', error);
      toast.error('Error al buscar números reservados');
      return;
    }
    
    if (reservedNumbers && reservedNumbers.length > 0) {
      const allReservedNumbers = reservedNumbers.map(n => 
        n.number.toString().padStart(2, '0')
      );
      
      if (debugMode) {
        console.log('Found reserved numbers:', allReservedNumbers);
      }
      
      toast.success(`${allReservedNumbers.length} número(s) encontrados`);
      onProceedToPayment(allReservedNumbers);
    } else {
      if (debugMode) {
        console.log('No reserved numbers found with direct query');
      }
      
      toast.error('❗ No se encontraron números reservados para este participante.');
    }
  };
  
  // Handle validation by number
  const handleNumberValidation = (validatedNumber: string) => {
    const number = numbers.find(n => n.number === validatedNumber && n.status === 'reserved');
    
    if (!number) {
      toast.error('Número no encontrado');
      return;
    }
    
    toast.success('Validación exitosa');
    onProceedToPayment([validatedNumber]);
  };

  // Render the numbers grid
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
              onClick={handleCloseReservedMessage}
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
      
      <NumberGridControls 
        selectedNumbers={selectedNumbers}
        raffleSeller={raffleSeller}
        onClearSelection={clearSelection}
        onReserve={handleReserve}
        onPayReserved={handlePayReserved}
        onProceedToPayment={handleProceedToPayment}
      />
      
      <NumberGridLegend highlightReserved={highlightReserved} />
      
      <PhoneValidationModal 
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onValidate={handleValidationSuccess}
        selectedNumber={selectedReservedNumber}
        raffleNumbers={numbers}
        raffleSellerId={raffleSeller.seller_id}
        raffleId={raffleSeller.raffle_id}
      />
      
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        onConfirm={handleConfirmReservation}
        selectedNumbers={selectedNumbers}
      />
    </div>
  );
};

export default NumberGrid;
