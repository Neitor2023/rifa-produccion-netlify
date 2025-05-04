
import { toast } from 'sonner';
import { useNumberStatus } from '../useNumberStatus';
import { useParticipantManager } from '../useParticipantManager';

interface UseReservationHandlingProps {
  raffleSeller: any;
  raffleId: string;
  raffleNumbers: any[];
  refetchRaffleNumbers: () => Promise<any>;
  debugMode?: boolean;
  reservationDays?: number;
  lotteryDate?: Date;
  validateSellerMaxNumbers: (newNumbersCount: number) => Promise<boolean>;
}

export function useReservationHandling({
  raffleSeller,
  raffleId,
  raffleNumbers,
  refetchRaffleNumbers,
  debugMode = false,
  reservationDays,
  lotteryDate,
  validateSellerMaxNumbers
}: UseReservationHandlingProps) {
  
  const { updateRaffleNumbersStatus } = useNumberStatus({ 
    raffleSeller, 
    raffleId, 
    raffleNumbers, 
    debugMode,
    reservationDays,
    lotteryDate
  });
  
  const { findOrCreateParticipant } = useParticipantManager({ 
    raffleId, 
    debugMode, 
    raffleSeller
  });

  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ReservationHandling - ${context}]:`, data);
    }
  };

  const handleReserveNumbers = async (
    numbers: string[],
    buyerPhone?: string,
    buyerName?: string,
    buyerCedula?: string
  ) => { // Fixed syntax error here, using arrow function syntax
    console.log("🎯 useReservationHandling: handleReserveNumbers called with:", {
      numbers,
      buyerPhone,
      buyerName,
      buyerCedula
    });
  
    // 1. Initial validations
    if (!raffleSeller?.seller_id) {
      toast.error("Seller information is not available");
      return;
    }
    if (!buyerPhone || !buyerName) {
      toast.error("Name and phone are required to reserve numbers");
      return;
    }
    // Validate minimum cedula length
    if (buyerCedula && buyerCedula.length < 5) {
      toast.error("Cedula must have at least 5 characters");
      return;
    }
    // Maximum sales validation
    if (!(await validateSellerMaxNumbers(numbers.length))) {
      return;
    }
  
    try {
      debugLog("handleReserveNumbers", {
        numbers,
        buyerPhone,
        buyerName,
        buyerCedula
      });
  
      // 2. Create or find participant
      const participantId = await findOrCreateParticipant(buyerPhone, buyerName, buyerCedula);
      console.log("👤 useReservationHandling: Participant created/found:", participantId);
      if (!participantId) {
        toast.error("Could not create or find participant");
        return;
      }
  
      // 3. Reserve numbers and save data
      await updateRaffleNumbersStatus(
        numbers,
        "reserved",
        participantId,
        {
          participant_name: buyerName,
          participant_phone: buyerPhone,
          participant_cedula: buyerCedula ?? null
        }
      );
  
      // 4. Refresh and clean
      await refetchRaffleNumbers();
  
      toast.success(`${numbers.length} number(s) reserved successfully`);
    } catch (error: any) {
      console.error("useReservationHandling: ❌ Error reserving numbers:", error);
      toast.error(`Error reserving numbers${error.message ? ` — ${error.message}` : ""}`);
    }
  };

  return {
    handleReserveNumbers
  };
}
