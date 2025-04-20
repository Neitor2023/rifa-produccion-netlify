import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PhoneValidationModal from './PhoneValidationModal';
import ReservationModal from './ReservationModal';
import { supabase } from '@/integrations/supabase/client';
import { NumberGridControls } from './NumberGridControls';
import { NumberGridLegend } from './NumberGridLegend';
import NumberGridHeader from './NumberGridHeader';
import NumberGridItem from './NumberGridItem';
import { ValidatedBuyerInfo } from '@/types/participant';

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
  debugMode?: boolean;
  soldNumbersCount?: number;
}

const NumberGrid: React.FC<NumberGridProps> = ({ 
  numbers, 
  raffleSeller,
  onReserve,
  onProceedToPayment,
  debugMode = false,
  soldNumbersCount = 0
}) => {
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [highlightReserved, setHighlightReserved] = useState(false);
  const [showReservedMessage, setShowReservedMessage] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedReservedNumber, setSelectedReservedNumber] = useState<string | null>(null);
  const [buyerData, setBuyerData] = useState<ValidatedBuyerInfo | null>(null);
  const [validatedBuyerInfo, setValidatedBuyerInfo] = useState<ValidatedBuyerInfo | null>(null);

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
  
  const clearSelection = () => {
    setSelectedNumbers([]);
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
    setIsReservationModalOpen(true);
  };
  
  const handleConfirmReservation = (data: { buyerName: string; buyerPhone: string }) => {
    if (debugMode) {
      console.log('Reservation data:', data);
      console.log('Selected numbers:', selectedNumbers);
    }
    
    if (!data.buyerName || !data.buyerPhone) {
      toast.error('Nombre y teléfono son obligatorios');
      return;
    }
    
    onReserve(selectedNumbers, data.buyerPhone, data.buyerName);
    setIsReservationModalOpen(false);
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
  
  const handleCloseReservedMessage = () => {
    setShowReservedMessage(false);
    setHighlightReserved(false);
  };
  
  const handleValidationSuccess = (
    validatedNumber: string,
    participantId: string,
    buyerInfo?: ValidatedBuyerInfo
  ) => {
    if (buyerInfo) {
      setBuyerData(buyerInfo);
    }
    setIsPhoneModalOpen(false);
    
    try {
      if (debugMode) {
        console.log('Validation success with number:', validatedNumber);
        console.log('Participant ID:', participantId);
        console.log('Raffle ID:', raffleSeller.raffle_id);
        console.log('Seller ID:', raffleSeller.seller_id);
      }
      console.log("🧪 Datos validados:", {
        validatedNumber,
        participantId,
        raffleId: raffleSeller.raffle_id,
        sellerId: raffleSeller.seller_id,
        selectedNumbersList: selectedNumbers
      });

      <Toaster
        position="top-left"    // coloca los toasts en la esquina superior derecha
        visibleToasts={10}      // muestra simultáneamente hasta 10 notificaciones
        gap={52}                // separa cada toast con 12px de espacio vertical
        closeButton             // muestra un “✕” que el usuario puede clicar
      />
/**      
*      toast.info(
*        <div>
*          🔍 Validando con:<br/>
*          📞 Número validado: {validatedNumber}<br/>
*          🆔 Participante: {participantId || 'N/A'}<br/>
*          🎟️ Rifa: {raffleSeller.raffle_id}<br/>
*          🧑‍💼 Vendedor: {raffleSeller.seller_id}<br/>
*          🔢 Números seleccionados: {selectedNumbers?.join(', ') || 'Ninguno'}
*        </div>, {duration: 8000      // este toast concreto dura 8 segundos
*      });  
*/      
      if (buyerInfo) {
        setValidatedBuyerInfo(buyerInfo);
      }
      
      if (participantId && /^[0-9a-fA-F\-]{36}$/.test(participantId)) {
        handleParticipantValidation(participantId);
      } else {
        handleNumberValidation(validatedNumber);
      }
    } catch (error) {
      console.error('Error processing validation:', error);
      toast.error('Error al procesar la validación');
    }    
  };
  
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
  
  const handleNumberValidation = (validatedNumber: string) => {
    const number = numbers.find(n => n.number === validatedNumber && n.status === 'reserved');
    
    if (!number) {
      toast.error('Número no encontrado');
      return;
    }
    
    toast.success('Validación exitosa');
    onProceedToPayment([validatedNumber]);
  };

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
    
    return grid;
  };

  return (
    <div className="mb-8">
      <NumberGridHeader 
        soldNumbersCount={soldNumbersCount} 
        maxNumbers={raffleSeller.cant_max} 
      />
      
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
        onPhoneValidationSuccess={(validatedNumber, participantId, buyerInfo) => {
          // toast.info(`Números que llegaron a la validación: ${selectedNumbers.length > 0 ? selectedNumbers.join(', ') : 'Ninguno'}`);
          toast.info(
            <div>
              🔍 Validando con:<br/>
              📞 Número validado: {validatedNumber}<br/>
              🆔 Participante: {participantId || 'N/A'}<br/>
              🧑‍💼 Nombre: {buyerInfo.name}<br/>
              📱 Teléfono: {buyerInfo.phone}<br/>
              🆔 Cédula: {buyerInfo.cedula}<br/>
              📍 Dirección: {buyerInfo.direccion}<br/>
              💡 Sugerencia: {buyerInfo.sugerencia_producto}<br/>
              🔢 Números seleccionados: {selectedNumbers?.join(', ') || 'Ninguno'}
            </div>,
            { duration: 8000 }
          );            
          handleValidationSuccess(validatedNumber, participantId, buyerInfo);
        }}
        selectedNumber={selectedReservedNumber}
        raffleNumbers={numbers}
        raffleSellerId={raffleSeller.seller_id}
        raffleId={raffleSeller.raffle_id}
        debugMode={debugMode}
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
