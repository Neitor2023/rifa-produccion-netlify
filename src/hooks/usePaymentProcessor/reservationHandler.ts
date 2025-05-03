
import { toast } from 'sonner';

export function useReservationHandler({
  raffleSeller,
  validateSellerMaxNumbers,
  findOrCreateParticipant,
  updateRaffleNumbersStatus,
  refetchRaffleNumbers,
  debugMode = false
}) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ReservationHandler - ${context}]:`, data);
    }
  };

  const handleReserveNumbers = async (
    numbers: string[],
    buyerPhone?: string,
    buyerName?: string,
    buyerCedula?: string,
    lotteryDate?: Date,
    reservationDays: number = 5
  ): Promise<void> => {
    console.log("🎯 useReservationHandler: handleReserveNumbers called with:", {
      numbers,
      buyerPhone,
      buyerName,
      buyerCedula,
      lotteryDate,
      reservationDays
    });
  
    // 1. Initial validations
    if (!raffleSeller?.seller_id) {
      toast.error("useReservationHandler: Seller information not available");
      return;
    }
    if (!buyerPhone || !buyerName) {
      toast.error("useReservationHandler: Name and phone are required to reserve numbers");
      return;
    }
    // Validate minimum cedula
    if (buyerCedula && buyerCedula.length < 5) {
      toast.error("useReservationHandler: Cedula must have at least 5 characters");
      return;
    }
    // Maximum sales
    if (!(await validateSellerMaxNumbers(numbers.length))) {
      return;
    }
  
    try {
      debugLog("handleReserveNumbers: Reserve numbers called with", {
        numbers,
        buyerPhone,
        buyerName,
        buyerCedula,
        reservationDays
      });
  
      // 2. Create or find participant
      const participantId = await findOrCreateParticipant(buyerPhone, buyerName, buyerCedula);
      console.log("👤 useReservationHandler: Participant created / found:", participantId);
      if (!participantId) {
        toast.error("useReservationHandler: Could not create or find participant");
        return;
      }
  
      // 3. Calculate the reservation expiration date based on the dynamic reservationDays
      const currentDate = new Date();
      
      // Ensure reservationDays is treated as a number
      const days = typeof reservationDays === 'number' ? reservationDays : 5;
      
      debugLog("handleReserveNumbers: Using reservation days", days);
      
      const daysLater = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);
      
      let expirationDate = daysLater;
      
      // Check if lottery date is available and compare
      if (lotteryDate && daysLater.getTime() > lotteryDate.getTime()) {
        expirationDate = lotteryDate;
      }
      
      if (debugMode) {
        console.log('useReservationHandler: Current Date:', currentDate);
        console.log('useReservationHandler: Reservation days:', days);
        console.log(`useReservationHandler: Current date + ${days} days:`, daysLater);
        console.log('useReservationHandler: Lottery date:', lotteryDate);
        console.log('useReservationHandler: Selected expiration date:', expirationDate);
      }

      // 4. Reserve numbers and save data
      await updateRaffleNumbersStatus(
        numbers,
        "reserved",
        participantId,
        {
          participant_name: buyerName,
          participant_phone: buyerPhone,
          participant_cedula: buyerCedula ?? null,
          reservation_expires_at: expirationDate.toISOString()
        }
      );
  
      // 5. Refresh and clean
      await refetchRaffleNumbers();
  
      toast.success(`${numbers.length} number(s) successfully reserved`);
      return;
    } catch (error: any) {
      console.error("useReservationHandler: ❌ Error reserving numbers:", error);
      toast.error(`useReservationHandler: Error reserving numbers${error.message ? ` — ${error.message}` : ""}`);
      return;
    }
  };

  return {
    handleReserveNumbers
  };
}
