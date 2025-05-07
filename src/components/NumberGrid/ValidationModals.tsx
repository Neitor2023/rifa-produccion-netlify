
import React from 'react';
import PhoneValidationModal from '../PhoneValidationModal';
import ReservationModal from '../ReservationModal';
import { ValidatedBuyerInfo } from '@/types/participant';
import { Organization } from '@/lib/constants/types';

interface ValidationModalsProps {
  isPhoneModalOpen: boolean;
  setIsPhoneModalOpen: (isOpen: boolean) => void;
  isReservationModalOpen: boolean;
  setIsReservationModalOpen: (isOpen: boolean) => void;
  selectedReservedNumber: string | null;
  raffleNumbers: any[];
  raffleSellerId: string;
  raffleId: string;
  debugMode?: boolean;
  handleValidationSuccess: (
    validatedNumber: string,
    participantId: string,
    buyerInfo?: ValidatedBuyerInfo
  ) => void;
  handleConfirmReservation: (data: { 
    buyerName: string; 
    buyerPhone: string; 
    buyerCedula: string 
  }) => void;
  selectedNumbers: string[];
  organization?: Organization | null;
}

const ValidationModals: React.FC<ValidationModalsProps> = ({
  isPhoneModalOpen,
  setIsPhoneModalOpen,
  isReservationModalOpen,
  setIsReservationModalOpen,
  selectedReservedNumber,
  raffleNumbers,
  raffleSellerId,
  raffleId,
  debugMode = false,
  handleValidationSuccess,
  handleConfirmReservation,
  selectedNumbers,
  organization
}) => {
  return (
    <>
      <PhoneValidationModal 
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onPhoneValidationSuccess={handleValidationSuccess}
        selectedNumber={selectedReservedNumber}
        raffleNumbers={raffleNumbers}
        raffleSellerId={raffleSellerId}
        raffleId={raffleId}
        debugMode={debugMode}
        organization={organization}
      />
      
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        onConfirm={handleConfirmReservation}
        selectedNumbers={selectedNumbers}
        organization={organization}
      />
    </>
  );
};

export default ValidationModals;
