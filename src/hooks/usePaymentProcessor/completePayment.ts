
import { PaymentFormData } from '@/types/payment';
import { usePaymentCompletion } from './paymentCompletion';
import { RaffleNumber } from '@/lib/constants/types';
import { toast } from 'sonner';

export interface ConflictResult {
  success: boolean;
  conflictingNumbers?: string[];
  message?: string;
}

interface CompletePaymentProps {
  raffleSeller: any;
  raffleId: string;
  selectedNumbers: string[];
  raffleNumbers: RaffleNumber[];
  setIsVoucherOpen: (open: boolean) => void;
  setPaymentData: (data: PaymentFormData | null) => void;
  setIsPaymentModalOpen: (open: boolean) => void;
  refetchRaffleNumbers: () => Promise<void>;
  debugMode?: boolean;
  allowVoucherPrint?: boolean;
  rafflePrice?: number; // CORRECCIÓN: Agregar rafflePrice a la interfaz
}

export const handleCompletePayment = ({
  raffleSeller,
  raffleId,
  selectedNumbers,
  raffleNumbers,
  setIsVoucherOpen,
  setPaymentData,
  setIsPaymentModalOpen,
  refetchRaffleNumbers,
  debugMode = false,
  allowVoucherPrint = true,
  rafflePrice // CORRECCIÓN: Recibir rafflePrice como parámetro
}: CompletePaymentProps) => {
  
  return async (data: PaymentFormData): Promise<ConflictResult | void> => {
    console.log('[completePayment.ts] 🚨 INICIO CRÍTICO: Procesando pago completo');
    console.log('[completePayment.ts] 🎯 CORRECCIÓN: rafflePrice recibido:', rafflePrice);
    console.log('[completePayment.ts] 📊 DATOS ENTRADA:', {
      participantId: data.participantId,
      buyerName: data.buyerName,
      selectedNumbers: selectedNumbers,
      selectedCount: selectedNumbers?.length || 0,
      paymentMethod: data.paymentMethod,
      hasPaymentProof: !!data.paymentProof,
      raffleId: raffleId,
      raffleSellerId: raffleSeller?.seller_id || raffleSeller?.id,
      rafflePrice: rafflePrice
    });

    // VALIDACIONES CRÍTICAS
    if (!data.buyerName || data.buyerName.trim() === '') {
      console.error('[completePayment.ts] ❌ ERROR CRÍTICO: buyerName vacío');
      toast.error('El nombre del comprador es requerido');
      return { success: false, message: 'Nombre del comprador requerido' };
    }

    if (!selectedNumbers || selectedNumbers.length === 0) {
      console.error('[completePayment.ts] ❌ ERROR CRÍTICO: selectedNumbers vacío:', selectedNumbers);
      toast.error('Debe seleccionar al menos un número');
      return { success: false, message: 'Números seleccionados requeridos' };
    }

    if (!raffleId || raffleId.trim() === '') {
      console.error('[completePayment.ts] ❌ ERROR CRÍTICO: raffleId vacío');
      toast.error('ID de rifa no disponible');
      return { success: false, message: 'ID de rifa requerido' };
    }

    if (!raffleSeller) {
      console.error('[completePayment.ts] ❌ ERROR CRÍTICO: raffleSeller no disponible');
      toast.error('Información del vendedor no disponible');
      return { success: false, message: 'Vendedor requerido' };
    }

    try {
      console.log('[completePayment.ts] 🚀 INICIANDO: Proceso de pago con usePaymentCompletion');
      console.log('[completePayment.ts] 🎯 CORRECCIÓN: Pasando rafflePrice al hook:', rafflePrice);
      
      const { completePaymentProcess } = usePaymentCompletion({
        raffleSeller,
        raffleId,
        debugMode,
        rafflePrice // CORRECCIÓN: Pasar rafflePrice al hook usePaymentCompletion
      });

      console.log('[completePayment.ts] 📤 LLAMANDO: completePaymentProcess con datos finales');
      
      const result = await completePaymentProcess(data, selectedNumbers);
      
      console.log('[completePayment.ts] 📨 RESULTADO RECIBIDO:', {
        success: result?.success,
        hasResult: !!result,
        resultType: typeof result
      });
      
      if (result && result.success) {
        console.log('[completePayment.ts] ✅ ÉXITO: Proceso completado, cerrando modal de pago');
        
        setIsPaymentModalOpen(false);
        
        console.log('[completePayment.ts] 💾 CONFIGURANDO: Datos para voucher');
        setPaymentData(data);
        
        if (allowVoucherPrint) {
          console.log('[completePayment.ts] 📄 ABRIENDO: Voucher');
          setIsVoucherOpen(true);
        }
        
        console.log('[completePayment.ts] 🔄 REFRESCANDO: Números de rifa');
        try {
          await refetchRaffleNumbers();
          console.log('[completePayment.ts] ✅ ÉXITO: Números refrescados');
        } catch (refetchError) {
          console.error('[completePayment.ts] ❌ ERROR: Al refrescar números:', refetchError);
        }
        
        return { success: true };
      } else {
        console.error('[completePayment.ts] ❌ FALLO: Proceso de pago no exitoso:', result);
        return result || { success: false, message: 'Error desconocido en el pago' };
      }
      
    } catch (error: any) {
      console.error('[completePayment.ts] ❌ ERROR FATAL:', error);
      console.error('[completePayment.ts] 📋 STACK:', error?.stack);
      toast.error('Error crítico al procesar el pago: ' + (error?.message || 'Error desconocido'));
      return { 
        success: false, 
        message: `Error crítico: ${error?.message || 'Error desconocido'}` 
      };
    }
  };
};
