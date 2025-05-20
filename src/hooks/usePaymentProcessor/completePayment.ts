import { toast } from 'sonner';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { UpdateResult, updateNumbersToSold } from './numberStatusUpdates';
import { uploadFile } from '@/lib/utils'; 
import { ValidatedBuyerInfo } from '@/types/participant';
import { createParticipant, getParticipantByPhoneAndRaffle } from '@/utils/participantUtils';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { DEFAULT_ORGANIZATION_ID, STORAGE_BUCKET_RECEIPTS } from '@/lib/constants/ids';
import { supabase } from '@/integrations/supabase/client';
import { getSellerUuidFromCedula, isValidUuid } from '@/hooks/useRaffleData/useSellerIdMapping';
import { SELLER_ID, RAFFLE_ID } from '@/lib/constants/ids';

interface HandleCompletePaymentProps {
  raffleSeller: any;
  raffleId: string;
  selectedNumbers: string[];
  refetchRaffleNumbers: () => Promise<any>;
  setPaymentData: (data: PaymentFormData) => void;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  setIsVoucherOpen: (isOpen: boolean) => void;
  allowVoucherPrint: boolean;
  uploadPaymentProof: (file: File) => Promise<string | null>;
  processParticipant: ({ buyerName, buyerPhone, buyerEmail, buyerCedula, direccion, sugerencia_producto, nota }: { buyerName: string; buyerPhone: string; buyerEmail: string; buyerCedula: string; direccion: string; sugerencia_producto: string; nota: string; }) => Promise<string | null>;
  supabase: any;
  debugMode?: boolean;
}

export interface ConflictResult {
  success: boolean;
  conflictingNumbers?: string[];
  message?: string;
}

export const handleCompletePayment = ({ 
  raffleSeller, 
  raffleId, 
  selectedNumbers, 
  refetchRaffleNumbers, 
  setPaymentData, 
  setIsPaymentModalOpen, 
  setIsVoucherOpen,
  allowVoucherPrint,
  uploadPaymentProof, 
  processParticipant,
  supabase,
  debugMode = false 
}) => {
  return async (
    formData: PaymentFormData
  ): Promise<ConflictResult | void> => {
    const debugLog = (context: string, data: any) => {
      if (debugMode) {
        console.log(`[DEBUG - completePayment - ${context}]:`, data);
      }
    };

    if (selectedNumbers.length === 0) {
      toast.error('Por favor seleccione al menos un número');
      return { success: false };
    }

    debugLog('Iniciando proceso de completar pago', { 
      formData, 
      selectedNumbers 
    });

    try {
      console.log("[completePayment.ts] Iniciando proceso de pago con formData:", {
        buyerName: formData.buyerName,
        buyerPhone: formData.buyerPhone,
        // No imprimir datos sensibles en logs
      });

      // CORRECCIÓN: Verificar y registrar la presencia del campo sugerenciaProducto
      console.log("[completePayment.ts] 💾 Guardando sugerencia producto:", formData.sugerenciaProducto);

      // Validar que el raffleId esté definido
      if (!raffleId) {
        raffleId = RAFFLE_ID;
        console.log("[completePayment.ts] ⚠️ raffleId no proporcionado, usando valor por defecto:", raffleId);
      }

      // Validar y procesar sellerId para asegurar que sea un UUID válido
      let sellerUuid: string | null = null;
      
      if (raffleSeller?.seller_id) {
        if (isValidUuid(raffleSeller.seller_id)) {
          sellerUuid = raffleSeller.seller_id;
          console.log("[completePayment.ts] Usando UUID del vendedor de raffleSeller:", sellerUuid);
        } else {
          console.log("[completePayment.ts] Buscando UUID para cédula del vendedor:", raffleSeller.seller_id);
          sellerUuid = await getSellerUuidFromCedula(raffleSeller.seller_id);
          if (!sellerUuid) {
            // Si no se encuentra, intentar con el SELLER_ID por defecto
            console.log("[completePayment.ts] No se encontró UUID, buscando con SELLER_ID por defecto:", SELLER_ID);
            sellerUuid = await getSellerUuidFromCedula(SELLER_ID);
            if (sellerUuid) {
              console.log("[completePayment.ts] UUID encontrado para SELLER_ID por defecto:", sellerUuid);
            } else {
              console.log("[completePayment.ts] ⚠️ No se pudo encontrar un UUID válido para el vendedor");
            }
          } else {
            console.log("[completePayment.ts] UUID encontrado para cédula:", sellerUuid);
          }
        }
      } else if (formData.sellerId) {
        // Usar sellerId del formulario si está disponible
        if (isValidUuid(formData.sellerId)) {
          sellerUuid = formData.sellerId;
          console.log("[completePayment.ts] Usando UUID del vendedor de formData:", sellerUuid);
        } else {
          console.log("[completePayment.ts] Buscando UUID para cédula desde formData:", formData.sellerId);
          sellerUuid = await getSellerUuidFromCedula(formData.sellerId);
          if (sellerUuid) {
            console.log("[completePayment.ts] UUID encontrado para cédula de formData:", sellerUuid);
          }
        }
      } else {
        // Último recurso: usar SELLER_ID por defecto
        console.log("[completePayment.ts] Sin seller_id disponible, buscando con valor por defecto:", SELLER_ID);
        sellerUuid = await getSellerUuidFromCedula(SELLER_ID);
        if (sellerUuid) {
          console.log("[completePayment.ts] UUID encontrado para SELLER_ID por defecto:", sellerUuid);
        }
      }
      
      if (!sellerUuid) {
        console.log("[completePayment.ts] ⚠️ No se pudo determinar un UUID válido para el vendedor");
      } else {
        console.log("[completePayment.ts] ✅ UUID final determinado:", sellerUuid);
      }
      
      // Establecer el sellerId en formData para usarlo en el procesamiento del participante
      formData.sellerId = sellerUuid || '';

      // Subir comprobante de pago si está presente
      let paymentProofUrl = null;
      if (formData.paymentProof) {
        console.log("📸 Inicio del guardado automático del comprobante de pago");
        paymentProofUrl = await uploadPaymentProof(formData.paymentProof);
        console.log("📸 Finalización del guardado automático del comprobante de pago");
      }

      debugLog('Resultado de la subida del comprobante de pago', paymentProofUrl);

      // Procesar o crear participante
      let participantId: string | null = null;
      
      try {
        // CORRECCIÓN: Asegurar que sugerenciaProducto se pasa correctamente al processParticipant
        console.log("[completePayment.ts] 💾 Pasando sugerencia producto al participante:", formData.sugerenciaProducto);
        
        participantId = await processParticipant({
          buyerName: formData.buyerName,
          buyerPhone: formData.buyerPhone,
          buyerEmail: formData.buyerEmail || "",
          buyerCedula: formData.buyerCedula,
          direccion: formData.direccion || "",
          sugerencia_producto: formData.sugerenciaProducto || "",
          nota: formData.nota || "",
        });
        
        console.log("[completePayment.ts] Participante procesado exitosamente, ID:", participantId);
        debugLog('ID de participante obtenido', participantId);
        
      } catch (participantError) {
        console.error("[completePayment.ts] ❌ Error procesando el participante:", participantError);
        toast.error('Error al procesar los datos del participante');
        return { 
          success: false, 
          message: 'Error al procesar los datos del participante'
        };
      }

      if (!participantId) {
        console.error("[completePayment.ts] ❌ No se pudo obtener ID de participante");
        throw new Error('Error al crear registro del participante');
      }

      // CORRECCIÓN: Guardar reporte de actividad sospechosa si existe
      if (formData.reporteSospechoso && formData.reporteSospechoso.trim() !== '') {
        console.log("🚨 Guardando reporte de actividad sospechosa:", {
          mensaje: formData.reporteSospechoso.substring(0, 20) + '...',
        });
        
        try {
          // Obtener los IDs necesarios
          const sellerId = sellerUuid || formData.sellerId || SELLER_ID;
          const theRaffleId = raffleId || RAFFLE_ID;
          
          // Insertar el reporte en la tabla fraud_reports
          const { data: reportData, error: reportError } = await supabase
            .from('fraud_reports')
            .insert({
              mensaje: formData.reporteSospechoso,
              seller_id: sellerId,
              raffle_id: theRaffleId,
              participant_id: participantId
            });
            
          if (reportError) {
            console.error("❌ Error al guardar reporte de actividad sospechosa:", reportError);
            // No interrumpir el flujo principal si falla esto
          } else {
            console.log("✅ Reporte de actividad sospechosa guardado correctamente");
          }
        } catch (reportException) {
          console.error("❌ Excepción al guardar reporte de actividad sospechosa:", reportException);
          // No interrumpir el flujo principal si falla esto
        }
      }

      // Actualizar los números a estado vendido
      const result = await updateNumbersToSold({
        numbers: selectedNumbers,
        participantId,
        paymentProofUrl,
        raffleNumbers: [],
        raffleSeller,
        raffleId,
        paymentMethod: formData.paymentMethod,
        clickedButtonType: formData.clickedButtonType
      });

      debugLog('Resultado de la actualización de números', result);

      if (!result.success) {
        if (result.conflictingNumbers) {
          debugLog('Conflicto detectado durante la actualización de números', result.conflictingNumbers);
          return result;
        }
        throw new Error('Error al actualizar números en la base de datos');
      }

      // Actualizar datos de rifas
      await refetchRaffleNumbers();

      // Preparar datos de pago para el recibo/comprobante
      const paymentDataForReceipt: PaymentFormData = {
        ...formData,
        participantId,
        sellerId: sellerUuid || '',
        // Establecer URL del recibo de pago si se generó
        paymentReceiptUrl: formData.paymentReceiptUrl || ""
      };

      debugLog('Datos de pago preparados para recibo', paymentDataForReceipt);

      // Establecer datos de pago para generación de recibo
      setPaymentData(paymentDataForReceipt);

      // Cerrar modal de pago
      setIsPaymentModalOpen(false);

      // Mostrar el modal de comprobante solo si está permitido
      setTimeout(() => {
        debugLog('Abriendo modal de comprobante', { allowVoucherPrint });
        setIsVoucherOpen(true);
      }, 500);

      console.log("[completePayment.ts] ✅ Proceso de pago completado exitosamente");
      
      // Retornar éxito
      return { success: true };
    } catch (error) {
      debugLog('Error en handleCompletePayment', error);
      console.error('[completePayment.ts] ❌ Error en completePayment:', error);
      toast.error('Error al procesar el pago. Por favor intente nuevamente.');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  };
};

// Create utility function for payment proof upload
export const uploadPaymentProof = async (file: File): Promise<string | null> => {
  if (!file) return null;
  
  try {
    console.log('[completePayment.ts] Subiendo comprobante de pago:', file.name);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment_proofs')
      .upload(`${Date.now()}_${file.name}`, file);
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage
      .from('payment_proofs')
      .getPublicUrl(uploadData.path);
    
    console.log('[completePayment.ts] Comprobante de pago subido:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[completePayment.ts] ❌ Error al subir comprobante de pago:', error);
    return null;
  }
};
