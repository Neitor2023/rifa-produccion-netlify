
import { toast } from "sonner";
import { useParticipantManager } from "../useParticipantManager";
import { useNumberStatus } from "../useNumberStatus";

export function useRaffleReservation({ raffleId, raffleSeller, raffleNumbers, refetchRaffleNumbers, setSelectedNumbers, debugMode, validateSellerMaxNumbers }) {
  const { findOrCreateParticipant } = useParticipantManager({ raffleId, debugMode, raffleSeller });
  const { updateRaffleNumbersStatus } = useNumberStatus({ raffleSeller, raffleId, raffleNumbers, debugMode });

  const handleReserveNumbers = async (numbers: string[], buyerPhone?: string, buyerName?: string) => {
    if (!raffleSeller?.seller_id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    if (!buyerPhone || !buyerName) {
      toast.error('Nombre y teléfono son obligatorios para apartar números');
      return;
    }
    if (!(await validateSellerMaxNumbers(numbers.length))) return;
    try {
      const participantId = await findOrCreateParticipant(buyerPhone, buyerName);
      if (!participantId) {
        toast.error('No se pudo crear o encontrar al participante');
        return;
      }
      await updateRaffleNumbersStatus(numbers, 'reserved', participantId);
      await refetchRaffleNumbers();
      setSelectedNumbers([]);
      toast.success(`${numbers.length} número(s) apartados exitosamente`);
    } catch (error) {
      toast.error('Error al apartar números');
    }
  };
  return { handleReserveNumbers };
}
