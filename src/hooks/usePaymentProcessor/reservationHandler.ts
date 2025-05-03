
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
    buyerCedula?: string
  ): Promise<void> => {
    console.log("🎯 useReservationHandler: handleReserveNumbers llamado con:", {
      numbers,
      buyerPhone,
      buyerName,
      buyerCedula
    });
  
    // 1. Validaciones iniciales
    if (!raffleSeller?.seller_id) {
      toast.error("useReservationHandler: Información del vendedor no disponible");
      return;
    }
    if (!buyerPhone || !buyerName) {
      toast.error("useReservationHandler: Nombre y teléfono son obligatorios para apartar números");
      return;
    }
    // Validar cédula mínima
    if (buyerCedula && buyerCedula.length < 5) {
      toast.error("useReservationHandler: Cédula debe tener al menos 5 caracteres");
      return;
    }
    // Máximo de ventas
    if (!(await validateSellerMaxNumbers(numbers.length))) {
      return;
    }
  
    try {
      debugLog("useReservationHandler: Números de reserva llamados con", {
        numbers,
        buyerPhone,
        buyerName,
        buyerCedula
      });
  
      // 2. Crear o encontrar participante
      const participantId = await findOrCreateParticipant(buyerPhone, buyerName, buyerCedula);
      console.log("👤 useReservationHandler: Participante creado / encontrado:", participantId);
      if (!participantId) {
        toast.error("useReservationHandler: No se pudo crear o encontrar al participante");
        return;
      }
  
      // 3. Reservar números y guardar datos
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
  
      // 4. Refrescar y limpiar
      await refetchRaffleNumbers();
  
      toast.success(`${numbers.length} número(s) apartados exitosamente`);
      return;
    } catch (error: any) {
      console.error("useReservationHandler: ❌ Error al reservar números:", error);
      toast.error(`useReservationHandler: Error al apartar números${error.message ? ` — ${error.message}` : ""}`);
      return;
    }
  };

  return {
    handleReserveNumbers
  };
}
