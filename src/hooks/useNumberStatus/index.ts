
import { calculateExpirationDate } from './expirationCalculator';
import { updateRaffleNumbersStatus } from './updateRaffleNumbersStatus';

export const useNumberStatus = ({ 
  raffleSeller, 
  raffleId, 
  raffleNumbers, 
  debugMode = false, 
  reservationDays = 5, 
  lotteryDate 
}) => {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - NumberStatus - ${context}]:`, data);
    }
  };

  return { 
    updateRaffleNumbersStatus: (
      numbers: string[], 
      status: string, 
      participantId: string | null = null,
      participantData = null
    ) => updateRaffleNumbersStatus({
      numbers,
      status,
      participantId,
      participantData,
      raffleSeller,
      raffleId,
      raffleNumbers,
      debugLog,
      reservationDays,
      lotteryDate
    })
  };
};
