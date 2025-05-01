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
import GridLayout from './NumberGrid/GridLayout';
import ReservedMessageAlert from './NumberGrid/ReservedMessageAlert';

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
  onReserve: (selectedNumbers: string[], buyerPhone?: string, buyerName?: string, buyerCedula?: string) => void;
  onProceedToPayment: (selectedNumbers: string[], participantData?: ValidatedBuyerInfo) => void;
  debugMode?: boolean;
  soldNumbersCount?: number;
  validatedBuyerInfo: ValidatedBuyerInfo;
}

const NumberGrid: React.FC<NumberGridProps> = ({ 
  numbers, 
  raffleSeller,
  onReserve,
  onProceedToPayment,
  debugMode = false,
  soldNumbersCount = 0,
  validatedBuyerInfo
}) => {
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [highlightReserved, setHighlightReserved] = useState(false);
  const [showReservedMessage, setShowReservedMessage] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedReservedNumber, setSelectedReservedNumber] = useState<string | null>(null);
  const [buyerData, setBuyerData] = useState<ValidatedBuyerInfo | null>(null);
  const [validatedBuyerInfo, setValidatedBuyerInfo] = useState<ValidatedBuyerInfo | null>(null);

  const handlePayReserved = () => {
    console.log('▶️ NumberGrid: handlePayReserved called');
    console.log('▶️ highlightReserved before setting:', highlightReserved);
    
    if (highlightReserved) {
      return;
    }
    
    const reservedNumbers = numbers.filter(n => n.status === 'reserved');
    if (reservedNumbers.length === 0) {
      toast.warning('No hay números apartados para pagar');
      return;
    }
    
    setHighlightReserved(true);
    setShowReservedMessage(true);
    toast.info(`Hay ${reservedNumbers.length} número(s) apartados. Seleccione uno para proceder al pago.`);
  };
  
  const handleCloseReservedMessage = () => {
    setShowReservedMessage(false);
  };
  
  const toggleNumber = (number: string, status: string) => {
    console.log(`🔄 NumberGrid toggleNumber called with`, { number, status, highlightReserved });
    
    if (highlightReserved && status === 'reserved') {
      const selectedNumber = numbers.find(n => n.number === number);
      if (selectedNumber) {
        const allReservedNumbers = numbers
          .filter(n => 
            n.status === 'reserved' && 
            n.participant_id === selectedNumber.participant_id
          )
          .map(n => n.number);
          
        setSelectedNumbers(allReservedNumbers);
        setSelectedReservedNumber(number);
        setIsPhoneModalOpen(true);
      }
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
  };
  
  const handleReserve = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Seleccione al menos un número para apartar');
      return;
    }
    setIsReservationModalOpen(true);
  };
  
  const handleConfirmReservation = (data: { buyerName: string; buyerPhone: string; buyerCedula: string }) => {
    if (debugMode) {
      console.log('NumberGrid.tsx: Datos de reserva:', data);
      console.log('NumberGrid.tsx: Números seleccionados:', selectedNumbers);
    }
    
    if (!data.buyerName || !data.buyerPhone) {
      toast.error('Nombre y teléfono son obligatorios');
      return;
    }
    
    onReserve(selectedNumbers, data.buyerPhone, data.buyerName, data.buyerCedula);
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
  
  const handleValidationSuccess = (
    validatedNumber: string,
    participantId: string,
    buyerInfo?: ValidatedBuyerInfo
  ) => {
    if (buyerInfo) {
      console.log("✅ NumberGrid recibió información validada del comprador:", {
        name: buyerInfo.name,
        phone: buyerInfo.phone,
        cedula: buyerInfo.cedula,
        id: buyerInfo.id,
        direccion: buyerInfo.direccion,
        sugerencia_producto: buyerInfo.sugerencia_producto
      });
      setBuyerData(buyerInfo);
      setValidatedBuyerInfo(buyerInfo);
    }
    
    setIsPhoneModalOpen(false);
    
    if (participantId && buyerInfo) {
      onProceedToPayment(selectedNumbers, buyerInfo);
    } else {
      handleNumberValidation(validatedNumber);
    }
  };
  
  const handleParticipantValidation = async (participantId: string) => {
    if (debugMode) {
      console.log('NumberGrid.tsx: Consulta a Supabase de números reservados con ID de participante:', participantId);
    }
    
    const { data: reservedNumbers, error } = await supabase
      .from('raffle_numbers')
      .select('number')
      .eq('participant_id', participantId)
      .eq('status', 'reserved')
      .eq('raffle_id', raffleSeller.raffle_id)
      .eq('seller_id', raffleSeller.seller_id);
    
    if (error) {
      console.error('NumberGrid.tsx: Error al obtener los números reservados:', error);
      toast.error('NumberGrid.tsx: Error al buscar números reservados');
      return;
    }
    
    if (reservedNumbers && reservedNumbers.length > 0) {
      const allReservedNumbers = reservedNumbers.map(n => 
        n.number.toString().padStart(2, '0')
      );
      
      if (debugMode) {
        console.log('NumberGrid.tsx: Números reservados encontrados:', allReservedNumbers);
      }
      
      toast.success(`${allReservedNumbers.length} número(s) encontrados`);
      onProceedToPayment(allReservedNumbers);
    } else {
      if (debugMode) {
        console.log('NumberGrid.tsx: No se encontraron números reservados con consulta directa');
      }
      
      toast.error('❗ NumberGrid.tsx: No se encontraron números reservados para este participante.');
    }
  };
  
  const handleNumberValidation = (validatedNumber: string) => {
    const number = numbers.find(n => n.number === validatedNumber && n.status === 'reserved');
    
    if (!number) {
      toast.error('NumberGrid.tsx: Número no encontrado');
      return;
    }
    
    toast.success('Validación exitosa');
    onProceedToPayment([validatedNumber]);
  };

  return (
    <div className="mb-8">
      <NumberGridHeader 
        soldNumbersCount={soldNumbersCount} 
        maxNumbers={raffleSeller.cant_max} 
      />
      
      {showReservedMessage && (
        <ReservedMessageAlert onClose={handleCloseReservedMessage} />
      )}
      
      <Card className="p-2 sm:p-4 mb-4 bg-white dark:bg-gray-800 overflow-x-auto">
        <GridLayout
          numbers={numbers}
          selectedNumbers={selectedNumbers}
          highlightReserved={highlightReserved}
          toggleNumber={toggleNumber}
          onPayReserved={handlePayReserved} 
        />
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
        onPhoneValidationSuccess={handleValidationSuccess}
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
