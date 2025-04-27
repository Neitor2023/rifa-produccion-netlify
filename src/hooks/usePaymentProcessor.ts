import { useState } from 'react';
import { PaymentFormData } from '@/components/PaymentModal';
import { ValidatedBuyerInfo } from '@/types/participant';
import { toast } from 'sonner';
import { useParticipantManager } from './useParticipantManager';
import { useNumberStatus } from './useNumberStatus';
import { useSelection } from './usePaymentProcessor/selection';
import { usePayment } from './usePaymentProcessor/payment';
import { useBuyerData } from './usePaymentProcessor/buyerData';
import { useSellerValidation } from './usePaymentProcessor/sellerValidation';
import { useNumberAvailability } from './usePaymentProcessor/numberAvailability';
import { usePaymentCompletion } from './usePaymentProcessor/paymentCompletion';
import { supabase } from '@/integrations/supabase/client';

interface UsePaymentProcessorProps {
  raffleSeller: { id: string; seller_id: string; cant_max: number; active: boolean } | null;
  raffleId: string;
  raffleNumbers: any[];
  refetchRaffleNumbers: () => Promise<any>;
  debugMode?: boolean;
  allowVoucherPrint?: boolean;
}

export function usePaymentProcessor({
  raffleSeller,
  raffleId,
  raffleNumbers,
  refetchRaffleNumbers,
  debugMode = false,
  allowVoucherPrint = true
}: UsePaymentProcessorProps) {
  const { selectedNumbers, setSelectedNumbers } = useSelection();

  // Modal states para cada flujo
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);        // “Pagar”
  const [isCompletePaymentOpen, setIsCompletePaymentOpen] = useState(false); // “Pagar Apartados”
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  const { paymentData, setPaymentData } = usePayment();
  const { validatedBuyerData, setValidatedBuyerData } = useBuyerData();
  const { validateSellerMaxNumbers, getSoldNumbersCount } = useSellerValidation(raffleSeller, raffleNumbers, debugMode);
  const { checkNumbersAvailability } = useNumberAvailability({ raffleNumbers, raffleSeller, setValidatedBuyerData, debugMode });
  const { uploadPaymentProof, processParticipant, updateNumbersToSold } = usePaymentCompletion({ raffleSeller, raffleId, setValidatedBuyerData, debugMode });
  const { updateRaffleNumbersStatus } = useNumberStatus({ raffleSeller, raffleId, raffleNumbers, debugMode });
  const { findOrCreateParticipant } = useParticipantManager({ raffleId, debugMode, raffleSeller, setValidatedBuyerData });

  // 1) Reserva números
  const handleReserveNumbers = async (
    numbers: string[],
    buyerPhone?: string,
    buyerName?: string,
    buyerCedula?: string
  ) => {
    if (!raffleSeller?.seller_id) { toast.error('Vendedor no disponible'); return; }
    if (!buyerPhone || !buyerName) { toast.error('Nombre y teléfono obligatorios'); return; }
    if (buyerCedula && buyerCedula.length < 5) { toast.error('Cédula mínima 5 dígitos'); return; }
    if (!(await validateSellerMaxNumbers(numbers.length))) return;

    const participantId = await findOrCreateParticipant(buyerPhone, buyerName, buyerCedula);
    if (!participantId) { toast.error('No pudo crear/obtener participante'); return; }

    await updateRaffleNumbersStatus(numbers, 'reserved', participantId, {
      participant_name: buyerName,
      participant_phone: buyerPhone,
      participant_cedula: buyerCedula || null
    });
    await refetchRaffleNumbers();
    setSelectedNumbers([]);
    toast.success(`${numbers.length} número(s) apartados`);
  };

  // 2) Pago directo (“Pagar”)
  const handleStartNewPayment = async (numbers: string[]) => {
    if (numbers.length === 0) { toast.error('Seleccione al menos un número'); return; }
    if (!(await validateSellerMaxNumbers(numbers.length))) return;
    const unavailable = await checkNumbersAvailability(numbers);
    if (unavailable.length) { toast.error(`No disponibles: ${unavailable.join(', ')}`); return; }

    setSelectedNumbers(numbers);
    setIsNewPaymentOpen(true);
  };

  // 3) Pago de apartados (“Pagar Apartados”)
  const handleStartCompletePayment = async (numbers: string[], participantData: ValidatedBuyerInfo) => {
    if (numbers.length === 0) { toast.error('No hay apartados para pagar'); return; }
    setValidatedBuyerData(participantData);
    setSelectedNumbers(numbers);
    setIsCompletePaymentOpen(true);
  };

  // 4) Completar pago de cualquiera de los dos flujos
  const handleCompletePayment = async (data: PaymentFormData) => {
    if (!raffleSeller?.seller_id) { toast.error('Vendedor no disponible'); return; }
    if (!(await validateSellerMaxNumbers(selectedNumbers.length))) return;

    const proofUrl = await uploadPaymentProof(data.paymentProof);
    let participantId = validatedBuyerData?.id || await processParticipant(data);
    if (!participantId) { toast.error('Error participante'); return; }

    await updateNumbersToSold(selectedNumbers, participantId, proofUrl, raffleNumbers);
    await refetchRaffleNumbers();

    setPaymentData({ ...data, paymentProof: proofUrl });
    setIsNewPaymentOpen(false);
    setIsCompletePaymentOpen(false);

    if (allowVoucherPrint) {
      setIsVoucherOpen(true);
    } else {
      toast.success('Pago en revisión, exija su comprobante al vendedor');
    }
  };

  return {
    selectedNumbers,
    isNewPaymentOpen,
    setIsNewPaymentOpen,
    isCompletePaymentOpen,
    setIsCompletePaymentOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData,
    validatedBuyerData,
    handleReserveNumbers,
    handleStartNewPayment,       // Pagar
    handleStartCompletePayment,  // Pagar Apartados
    handleCompletePayment,
    getSoldNumbersCount,
    allowVoucherPrint
  };
}

