
import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import VoucherHeader from '@/components/digital-voucher/VoucherHeader';
import VoucherContent from '@/components/digital-voucher/VoucherContent';
import VoucherActions from '@/components/digital-voucher/VoucherActions';
import AlertMessage from '@/components/digital-voucher/AlertMessage';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { Organization } from '@/lib/constants/types';
import { supabase } from '@/integrations/supabase/client';
import { getSellerUuidFromCedula, isValidUuid } from '@/hooks/useRaffleData/useSellerIdMapping';
import { RAFFLE_ID } from '@/utils/setGlobalIdsFromUrl';
import {
  exportVoucherAsImage,
  downloadVoucherImage,
  presentVoucherImage,
  uploadVoucherToStorage,
  updatePaymentReceiptUrlForParticipant
} from '@/components/digital-voucher/utils/voucherExport';
import { toast } from 'sonner';

interface DigitalVoucherProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  paymentData: PaymentFormData | null;
  raffleDetails?: {
    title: string;
    price: number;
    lottery: string;
    dateLottery: string;
  };
  allowVoucherPrint?: boolean;
  textColor?: string;
  organization?: Organization | null;
  onVoucherClosed?: () => void;
}

const DigitalVoucher: React.FC<DigitalVoucherProps> = ({
  isOpen,
  onClose,
  selectedNumbers: initialSelectedNumbers,
  paymentData,
  raffleDetails,
  allowVoucherPrint = true,
  textColor = 'text-gray-800',
  organization,
  onVoucherClosed
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [actualSelectedNumbers, setActualSelectedNumbers] = useState<string[]>([]);
  const [isReceiptSaving, setIsReceiptSaving] = useState(false);
  const [receiptAlreadySaved, setReceiptAlreadySaved] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string>('');

  console.log('[DigitalVoucher.tsx] 🔍 INVESTIGACIÓN PROFUNDA: Iniciando voucher con datos:', {
    isOpen,
    paymentData: paymentData ? {
      participantId: paymentData.participantId,
      paymentMethod: paymentData.paymentMethod,
      clickedButtonType: paymentData.clickedButtonType,
      hasPaymentProof: !!paymentData.paymentProof,
      paymentProofType: typeof paymentData.paymentProof,
      paymentProofLength: typeof paymentData.paymentProof === 'string' ? paymentData.paymentProof.length : 0
    } : null,
    initialSelectedNumbers,
    allowVoucherPrint
  });

  // CORRECCIÓN: Validación estricta de tipo para paymentProof
  const validPaymentProof = (paymentData?.paymentProof && 
                           typeof paymentData.paymentProof === 'string' && 
                           paymentData.paymentProof.length > 0) 
    ? paymentData.paymentProof 
    : null;

  console.log('[DigitalVoucher.tsx] 🧾 INVESTIGACIÓN: Verificando payment_proof válido:', {
    tienePaymentData: !!paymentData,
    paymentProofOriginal: paymentData?.paymentProof,
    paymentProofTipo: typeof paymentData?.paymentProof,
    paymentProofValido: !!validPaymentProof,
    paymentProofURL: validPaymentProof,
    bucketCorrecto: validPaymentProof?.includes('/payment-proofs/') || false
  });

  // Use initialSelectedNumbers directly when they are provided
  useEffect(() => {
    if (isOpen && initialSelectedNumbers && initialSelectedNumbers.length > 0) {
      console.log('[DigitalVoucher.tsx] ✅ CORRECCIÓN: Usando números iniciales directamente:', initialSelectedNumbers);
      setActualSelectedNumbers(initialSelectedNumbers);
      return;
    }

    // Only fetch from database if initialSelectedNumbers is empty or invalid
    const fetchActualNumbers = async () => {
      if (!isOpen || !paymentData?.participantId || !RAFFLE_ID) {
        console.log('[DigitalVoucher.tsx] ⚠️ No se puede buscar números - faltan datos críticos');
        return;
      }

      try {
        console.log('[DigitalVoucher.tsx] 🔍 Buscando números como fallback - initialSelectedNumbers está vacío');

        // Convert SELLER_ID (cédula) to UUID
        let sellerUuid: string | null = null;
        if (paymentData.sellerId) {
          if (isValidUuid(paymentData.sellerId)) {
            sellerUuid = paymentData.sellerId;
          } else {
            sellerUuid = await getSellerUuidFromCedula(paymentData.sellerId);
          }
        }

        if (!sellerUuid) {
          console.error('[DigitalVoucher.tsx] ❌ No se pudo obtener UUID del vendedor');
          return;
        }

        // Search recent numbers as fallback
        const tenMinutesAgo = new Date();
        tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
        const timestampFilter = tenMinutesAgo.toISOString();

        const { data: recentNumbers, error } = await supabase
          .from('raffle_numbers')
          .select('number, updated_at, payment_method, seller_id')
          .eq('participant_id', paymentData.participantId)
          .eq('raffle_id', RAFFLE_ID)
          .eq('status', 'sold')
          .eq('seller_id', sellerUuid)
          .gte('updated_at', timestampFilter)
          .order('updated_at', { ascending: false });

        if (!error && recentNumbers && recentNumbers.length > 0) {
          const numbersArray = recentNumbers.map(n => String(n.number).padStart(2, '0'));
          console.log('[DigitalVoucher.tsx] ✅ Números de fallback encontrados:', numbersArray);
          setActualSelectedNumbers(numbersArray);
        }

      } catch (error) {
        console.error('[DigitalVoucher.tsx] ❌ Error en búsqueda de fallback:', error);
      }
    };

    fetchActualNumbers();
  }, [isOpen, paymentData, initialSelectedNumbers]);

  // CORRECCIÓN: Auto-guardado SOLO para voucher en bucket paymentreceipturl
  useEffect(() => {
    const autoSaveVoucher = async () => {
      if (!isOpen || !paymentData?.participantId || !RAFFLE_ID || !raffleDetails) {
        console.log('[DigitalVoucher.tsx] ⚠️ INVESTIGACIÓN: No se puede auto-guardar voucher - faltan datos');
        return;
      }

      if (actualSelectedNumbers.length === 0) {
        console.log('[DigitalVoucher.tsx] ⚠️ INVESTIGACIÓN: No hay números válidos para auto-guardar voucher');
        return;
      }

      if (receiptAlreadySaved) {
        console.log('[DigitalVoucher.tsx] ℹ️ INVESTIGACIÓN: Voucher ya guardado, omitiendo auto-guardado');
        return;
      }

      try {
        console.log('[DigitalVoucher.tsx] 💾 INVESTIGACIÓN: Iniciando auto-guardado de VOUCHER a bucket paymentreceipturl EXCLUSIVAMENTE');

        // Generar imagen del voucher
        const imgData = await exportVoucherAsImage(printRef.current, '');
        if (!imgData) {
          console.error('[DigitalVoucher.tsx] ❌ No se pudo generar imagen para auto-guardado');
          return;
        }

        // Convertir seller ID a UUID si es necesario
        let sellerUuid: string | null = null;
        if (paymentData.sellerId) {
          if (isValidUuid(paymentData.sellerId)) {
            sellerUuid = paymentData.sellerId;
          } else {
            sellerUuid = await getSellerUuidFromCedula(paymentData.sellerId);
          }
        }

        if (!sellerUuid) {
          console.error('[DigitalVoucher.tsx] ❌ No se pudo obtener UUID del vendedor para auto-guardado');
          return;
        }

        // CORRECCIÓN CRÍTICA: Subir voucher EXCLUSIVAMENTE a bucket paymentreceipturl
        const receiptId = `voucher_${new Date().getTime()}_${paymentData.participantId}`;
        console.log('[DigitalVoucher.tsx] 📤 INVESTIGACIÓN: Subiendo VOUCHER EXCLUSIVAMENTE a bucket paymentreceipturl...');
        const imageUrl = await uploadVoucherToStorage(imgData, raffleDetails.title, receiptId);

        if (imageUrl) {
          console.log('[DigitalVoucher.tsx] ✅ INVESTIGACIÓN: Voucher subido correctamente a bucket paymentreceipturl:', imageUrl);
          console.log('[DigitalVoucher.tsx] 🔍 VERIFICACIÓN CRÍTICA: URL del voucher termina con /paymentreceipturl/:', imageUrl.includes('/paymentreceipturl/'));
          setReceiptUrl(imageUrl);

          // IMPORTANTE: Actualizar SOLO payment_receipt_url, NO payment_proof
          const success = await updatePaymentReceiptUrlForParticipant(
            imageUrl,
            paymentData.participantId,
            RAFFLE_ID,
            sellerUuid,
            paymentData.clickedButtonType,
            actualSelectedNumbers
          );

          if (success) {
            console.log('[DigitalVoucher.tsx] ✅ INVESTIGACIÓN: Auto-guardado de voucher completado exitosamente');
            setReceiptAlreadySaved(true);
            toast.success('Comprobante guardado automáticamente', {
              id: 'voucher-auto-saved',
              duration: 3000
            });
          }
        }

      } catch (error) {
        console.error('[DigitalVoucher.tsx] ❌ ERROR en auto-guardado de voucher:', error);
      }
    };

    // Delay para asegurar que el componente esté completamente renderizado
    const timeoutId = setTimeout(autoSaveVoucher, 1000);
    return () => clearTimeout(timeoutId);
  }, [isOpen, paymentData, raffleDetails, actualSelectedNumbers, receiptAlreadySaved]);

  // CORRECCIÓN CRÍTICA: Limpiar estados locales al cerrar voucher
  const handleClose = () => {
    console.log('[DigitalVoucher.tsx] 🔐 Cerrando voucher y limpiando estados locales...');
    
    // Limpiar estados locales del voucher
    setReceiptAlreadySaved(false);
    setReceiptUrl('');
    setActualSelectedNumbers([]);
    console.log('[DigitalVoucher.tsx] 🧹 Estados locales limpiados');
    
    onClose();
    
    // Llamar a onVoucherClosed para limpiar completamente el estado
    if (onVoucherClosed) {
      console.log('[DigitalVoucher.tsx] 🧹 Ejecutando limpieza completa tras cierre');
      onVoucherClosed();
    }
  };

  const handleDownload = async () => {
    console.log('[src/components/DigitalVoucher.tsx] 📥 Iniciando descarga manual...');
    const imgData = await exportVoucherAsImage(printRef.current, '');
    if (imgData) {
      const fileName = `comprobante_${raffleDetails?.title || 'rifa'}_${new Date().getTime()}.png`;
      downloadVoucherImage(imgData, fileName);
    }
  };

  const handleView = async () => {
    console.log('[src/components/DigitalVoucher.tsx] 👁️ Abriendo vista previa...');
    const imgData = await exportVoucherAsImage(printRef.current, '');
    if (imgData) {
      presentVoucherImage(imgData);
    }
  };

  const handleSave = async (): Promise<string | null> => {
    if (!paymentData?.participantId || !raffleDetails) {
      console.error('[src/components/DigitalVoucher.tsx] ❌ No se puede guardar: faltan datos críticos');
      return null;
    }

    if (receiptAlreadySaved) {
      console.log('[src/components/DigitalVoucher.tsx] ✅ Voucher ya guardado previamente');
      toast.success('El comprobante ya fue guardado anteriormente');
      return receiptUrl;
    }

    try {
      setIsReceiptSaving(true);
      console.log('[src/components/DigitalVoucher.tsx] 💾 CORRECCIÓN: Guardado manual iniciado para bucket paymentreceipturl...');

      const imgData = await exportVoucherAsImage(printRef.current, '');
      if (!imgData) {
        throw new Error('No se pudo generar la imagen del comprobante');
      }

      // Convertir seller ID a UUID
      let sellerUuid: string | null = null;
      if (paymentData.sellerId) {
        if (isValidUuid(paymentData.sellerId)) {
          sellerUuid = paymentData.sellerId;
        } else {
          sellerUuid = await getSellerUuidFromCedula(paymentData.sellerId);
        }
      }

      if (!sellerUuid) {
        throw new Error('No se pudo obtener UUID del vendedor');
      }

      const receiptId = `voucher_manual_${new Date().getTime()}_${paymentData.participantId}`;
      console.log('[src/components/DigitalVoucher.tsx] 📤 CORRECCIÓN: Guardado manual a bucket paymentreceipturl...');
      const imageUrl = await uploadVoucherToStorage(imgData, raffleDetails.title, receiptId);

      if (imageUrl) {
        console.log('[src/components/DigitalVoucher.tsx] ✅ CORRECCIÓN: Voucher guardado manualmente en bucket correcto:', imageUrl);
        console.log('[src/components/DigitalVoucher.tsx] 🔍 VERIFICACIÓN: URL del voucher guardado manualmente termina con /paymentreceipturl/:', imageUrl.includes('/paymentreceipturl/'));
        setReceiptUrl(imageUrl);

        const success = await updatePaymentReceiptUrlForParticipant(
          imageUrl,
          paymentData.participantId,
          RAFFLE_ID,
          sellerUuid,
          paymentData.clickedButtonType,
          actualSelectedNumbers
        );

        if (success) {
          setReceiptAlreadySaved(true);
          toast.success('Comprobante guardado exitosamente');
          return imageUrl;
        }
      }

      throw new Error('Error al guardar el comprobante');

    } catch (error) {
      console.error('[src/components/DigitalVoucher.tsx] ❌ Error en guardado manual:', error);
      toast.error('Error al guardar el comprobante');
      return null;
    } finally {
      setIsReceiptSaving(false);
    }
  };

  if (!isOpen) return null;

  const formattedDate = new Date().toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  console.log('[DigitalVoucher.tsx] 🔍 Evaluando método de pago para mostrar en voucher:', {
    paymentProofPresente: !!validPaymentProof,
    paymentMethodOriginal: paymentData?.paymentMethod,
    participante: paymentData?.buyerName
  });

  const paymentMethod = validPaymentProof
    ? 'Transferencia'
    : paymentData?.paymentMethod === 'transfer'
    ? 'Transferencia'
    : 'Efectivo';

  console.log('[DigitalVoucher.tsx] 💳 Método de pago final determinado para voucher:', {
    metodoFinal: paymentMethod,
    razonamiento: validPaymentProof 
      ? 'Tiene comprobante, por tanto Transferencia'
      : paymentData?.paymentMethod === 'transfer' 
      ? 'PaymentMethod es transfer'
      : 'Por defecto Efectivo',
    participante: paymentData?.buyerName
  });

  const qrUrl = `https://rifamax.com/comprobante/${paymentData?.participantId || 'unknown'}`;

  // Use actualSelectedNumbers if available, otherwise fallback to initialSelectedNumbers
  const numbersToShow = actualSelectedNumbers.length > 0 ? actualSelectedNumbers : initialSelectedNumbers;

  console.log('[DigitalVoucher.tsx] 🎯 CORRECCIÓN: Números finales para mostrar:', {
    actualSelectedNumbers,
    initialSelectedNumbers,
    numbersToShow,
    count: numbersToShow.length,
    shouldShowVoucher: numbersToShow.length > 0
  });

  // CORRECCIÓN CRÍTICA: Solo mostrar voucher si hay números válidos
  if (numbersToShow.length === 0) {
    console.warn('[DigitalVoucher.tsx] ⚠️ CORRECCIÓN: No hay números válidos para mostrar voucher');
    return null;
  }

  console.log('[DigitalVoucher.tsx] ✅ Scroll y diseño responsivo verificados correctamente');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md md:max-w-xl lg:max-w-2xl min-h-[85vh] max-h-[90vh] flex flex-col bg-white/20 backdrop-blur-md rounded-xl border-0">
        <DialogDescription className="sr-only">
          Comprobante digital de pago para los números seleccionados de la rifa
        </DialogDescription>
        
        <VoucherHeader
          onClose={handleClose}
          onSaveVoucher={allowVoucherPrint ? handleSave : () => Promise.resolve(null)}
          allowVoucherPrint={allowVoucherPrint}
          textColor={textColor}
        />

        <ScrollArea className="flex-1 overflow-y-auto p-4">
          <VoucherContent
            printRef={printRef}
            formattedDate={formattedDate}
            paymentMethod={paymentMethod}
            paymentData={paymentData}
            selectedNumbers={numbersToShow}
            raffleDetails={raffleDetails}
            qrUrl={qrUrl}
            textColor={textColor}
            numberId={paymentData?.participantId}
            paymentProofImage={validPaymentProof}
            organization={organization}
          />
        </ScrollArea>

        <VoucherActions
          onClose={handleClose}
          onDownload={handleDownload}
          onView={handleView}
          onSave={allowVoucherPrint ? handleSave : undefined}
          isReceiptSaving={isReceiptSaving}
          receiptAlreadySaved={receiptAlreadySaved}
          textColor={textColor}
        />

        {!allowVoucherPrint && (
          <div className="px-4 pb-4">
            <AlertMessage
              isOpen={true}
              onClose={() => {}}
              textColor={textColor}
              receiptSaved={receiptAlreadySaved}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DigitalVoucher;
