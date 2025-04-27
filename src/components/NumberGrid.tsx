import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { NumberGridControls } from './NumberGridControls';
import GridLayout from './NumberGrid/GridLayout';
import PhoneValidationModal from './PhoneValidationModal';
import ReservationModal from './ReservationModal';
import { ValidatedBuyerInfo } from '@/types/participant';

export interface RaffleNumber { /* ... */ }
export interface RaffleSeller { /* ... */ }

interface Props {
  numbers: RaffleNumber[];
  raffleSeller: RaffleSeller;
  onReserve: (nums: string[], phone?: string, name?: string, cedula?: string) => void;
  onProceedToPayment: (nums: string[]) => void;
  onPayReserved: (nums: string[], participant: ValidatedBuyerInfo) => void;
  debugMode?: boolean;
  soldNumbersCount?: number;
}

export const NumberGrid: React.FC<Props> = ({
  numbers,
  raffleSeller,
  onReserve,
  onProceedToPayment,
  onPayReserved,
  debugMode,
  soldNumbersCount
}) => {
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [highlightReserved, setHighlightReserved] = useState(false);
  const [showReservedMessage, setShowReservedMessage] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [participantInfo, setParticipantInfo] = useState<ValidatedBuyerInfo|null>(null);

  // Paso 1: “Pagar Apartados”
  const handlePayReserved = () => {
    const reserved = numbers.filter(n => n.status === 'reserved');
    if (!reserved.length) { toast.warning('No hay apartados'); return; }
    setHighlightReserved(true);
    setShowReservedMessage(true);
    toast.info(`Hay ${reserved.length} número(s) apartados. Seleccione uno.`);
  };

  // Paso 2: Toggle en GridLayout
  const handleToggle = (num: string, status: string) => {
    if (highlightReserved && status === 'reserved') {
      const picked = numbers.find(n => n.number === num)!;
      const allReserved = numbers
        .filter(n => n.status === 'reserved' && n.participant_id === picked.participant_id)
        .map(n => n.number);
      setSelectedNumbers(allReserved);
      setParticipantInfo({ /* extraído de picked y participante */ } as any);
      setIsPhoneModalOpen(true);
      return;
    }
    if (status !== 'available') return;
    setSelectedNumbers(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  // Paso 3: Éxito validación → modal final
  const handleValidationSuccess = (_phone: string, _pid: string, info?: ValidatedBuyerInfo) => {
    if (!info) return;
    setParticipantInfo(info);
    setIsPhoneModalOpen(false);
  };

  return (
    <div>
      {showReservedMessage && /* tu alert */}

      <Card>
        <GridLayout
          numbers={numbers}
          selectedNumbers={selectedNumbers}
          highlightReserved={highlightReserved}
          toggleNumber={handleToggle}
        />
      </Card>

      <NumberGridControls
        selectedNumbers={selectedNumbers}
        raffleSeller={raffleSeller}
        onClearSelection={() => setSelectedNumbers([])}
        onReserve={() => setIsReservationModalOpen(true)}
        onPayReserved={() => onPayReserved(selectedNumbers, participantInfo!)}
        onProceedToPayment={() => onProceedToPayment(selectedNumbers)}
      />

      <PhoneValidationModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onPhoneValidationSuccess={handleValidationSuccess}
        /* resto props */
      />

      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        onConfirm={({ buyerName, buyerPhone, buyerCedula }) =>
          onReserve(selectedNumbers, buyerPhone, buyerName, buyerCedula)
        }
        selectedNumbers={selectedNumbers}
      />
    </div>
  );
};

