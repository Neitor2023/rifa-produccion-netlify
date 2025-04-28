
import { toast } from 'sonner';

export function useReserveNumbers({
  raffleSeller,
  raffleId,
  validateSellerMaxNumbers,
  participantManager,
  updateRaffleNumbersStatus,
  refetchRaffleNumbers,
  setSelectedNumbers,
  debugMode
}) {
  const debugLog = (context: string, data: any) => {
    if (debugMode) {
      console.log(`[DEBUG - ReserveNumbers - ${context}]:`, data);
    }
  };

  return async (
    numbers: string[],
    buyerPhone?: string,
    buyerName?: string,
    buyerCedula?: string
  ) => {
    console.log("🎯 usePaymentProcessor: handleReserveNumbers llamado con:", {
      numbers,
      buyerPhone,
      buyerName,
      buyerCedula
    });
  
    // 1. Validaciones iniciales
    if (!raffleSeller?.seller_id) {
      toast.error("usePaymentProcessor: Información del vendedor no disponible");
      return;
    }
    if (!buyerPhone || !buyerName) {
      toast.error("usePaymentProcessor: Nombre y teléfono son obligatorios para apartar números");
      return;
    }
    // Validar cédula mínima
    if (buyerCedula && buyerCedula.length < 5) {
      toast.error("usePaymentProcessor: Cédula debe tener al menos 5 caracteres");
      return;
    }
    // Máximo de ventas
    if (!(await validateSellerMaxNumbers(numbers.length))) {
      return;
    }
  
    try {
      debugLog("usePaymentProcessor: Números de reserva llamados con", {
        numbers,
        buyerPhone,
        buyerName,
        buyerCedula
      });
      
      // 2. Buscar o crear participante
      let participantId = null;
      
      // Check if participant exists
      const existingParticipant = await participantManager.findParticipant(buyerPhone, raffleId, true);
      
      if (existingParticipant && existingParticipant.id) {
        participantId = existingParticipant.id;
        console.log("👤 usePaymentProcessor: Participante encontrado:", participantId);
      } else {
        // Create new participant
        const newParticipant = await participantManager.createParticipant({
          name: buyerName,
          phone: buyerPhone,
          cedula: buyerCedula,
          email: '',
          raffle_id: raffleId,
          seller_id: raffleSeller.seller_id
        });
        
        if (newParticipant && newParticipant.id) {
          participantId = newParticipant.id;
          console.log("👤 usePaymentProcessor: Nuevo participante creado:", participantId);
        }
      }
      
      if (!participantId) {
        toast.error("usePaymentProcessor: No se pudo crear o encontrar al participante");
        return;
      }
  
      // 3. Reservar números y guardar datos
      await updateRaffleNumbersStatus(
        numbers,
        "reserved",
        participantId,
        {
          // Usamos llaves idénticas a las columnas de la tabla
          participant_name: buyerName,
          participant_phone: buyerPhone,
          participant_cedula: buyerCedula ?? null
        }
      );
  
      // 4. Refrescar y limpiar
      await refetchRaffleNumbers();
      setSelectedNumbers([]);
  
      toast.success(`usePaymentProcessor: ${numbers.length} número(s) apartados exitosamente`);
    } catch (error: any) {
      console.error("usePaymentProcessor: ❌ Error al reservar números:", error);
      toast.error(`usePaymentProcessor: Error al apartar números${error.message ? ` — ${error.message}` : ""}`);
    }
  };
}
