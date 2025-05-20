import { toast } from 'sonner';
import { useNumberStatus } from '../useNumberStatus';
import { useParticipantManager } from '../useParticipantManager';
import { RaffleNumber } from '@/lib/constants/types';

interface UseReservationHandlingProps {
  raffleSeller: any;
  raffleId: string;
  raffleNumbers: RaffleNumber[];
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
      toast.error("La información del vendedor no está disponible");
      return;
    }
    if (!buyerPhone || !buyerName) {
      toast.error("Se requiere nombre y teléfono para reservar números.");
      return;
    }
    // Validate minimum cedula length
    if (buyerCedula && buyerCedula.length < 5) {
      toast.error("La cédula debe tener al menos 5 caracteres");
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
        toast.error("No se pudo crear ni encontrar el participante");
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
  
      toast.success(`${numbers.length} número(s) reservado(s) exitosamente`);
    } catch (error: any) {
      console.error("useReservationHandling: ❌ Error números de reserva:", error);
      toast.error(`Error números de reserva${error.message ? ` — ${error.message}` : ""}`);
    }
  };

  return {
    handleReserveNumbers
  };
}
