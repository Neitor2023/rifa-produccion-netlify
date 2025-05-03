
import React from 'react';
import { toast } from 'sonner';

interface ReservationHandlerProps {
  selectedNumbers: string[];
  onReserve: (numbers: string[], buyerPhone?: string, buyerName?: string, buyerCedula?: string) => Promise<void>;
  reservationDays?: number;
  lotteryDate?: Date;
  debugMode?: boolean;
  onClose: () => void;
}

export const useReservationHandler = ({
  selectedNumbers,
  onReserve,
  reservationDays = 5,
  lotteryDate,
  debugMode = false,
  onClose
}: ReservationHandlerProps) => {
  
  const handleConfirmReservation = (data: { buyerName: string; buyerPhone: string; buyerCedula: string }) => {
    if (selectedNumbers.length === 0) {
      toast.error('You must select at least one number to reserve');
      return;
    }
    
    if (!data.buyerName || !data.buyerPhone) {
      toast.error('Name and phone are required');
      return;
    }
    
    if (debugMode) {
      console.log('ReservationHandler.tsx: Reservation data:', data);
      console.log('ReservationHandler.tsx: Selected numbers:', selectedNumbers);
      console.log('ReservationHandler.tsx: Reservation days:', reservationDays);
      console.log('ReservationHandler.tsx: Lottery date:', lotteryDate);
    }
    
    // Call the onReserve function passing reservationDays and lotteryDate
    onReserve(selectedNumbers, data.buyerPhone, data.buyerName, data.buyerCedula);
    onClose();
  };

  return { handleConfirmReservation };
};
