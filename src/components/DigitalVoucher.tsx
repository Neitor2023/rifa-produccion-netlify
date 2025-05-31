import React, { useRef, useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { useTheme } from '@/components/ThemeProvider';
import { toast } from 'sonner';

// Import the refactored components
import AlertMessage from './digital-voucher/AlertMessage';
import VoucherHeader from './digital-voucher/VoucherHeader';
import VoucherContent from './digital-voucher/VoucherContent';
import VoucherActions from './digital-voucher/VoucherActions';
import { 
  exportVoucherAsImage, 
  downloadVoucherImage, 
  presentVoucherImage, 
  uploadVoucherToStorage, 
  updatePaymentReceiptUrlForNumbers,
  updatePaymentReceiptUrlForParticipant,
  ensureReceiptSavedForParticipant
} from './digital-voucher/utils/voucherExport';
import { supabase } from '@/integrations/supabase/client';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import { RAFFLE_ID, SELLER_ID } from '@/lib/constants';
import { Organization } from '@/lib/constants/types';

interface DigitalVoucherProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData?: PaymentFormData | null;
  selectedNumbers: string[];
  allowVoucherPrint?: boolean;
  raffleDetails?: {
    title: string;
    price: number;
    lottery: string;
    dateLottery: string;
  };
  organization?: Organization | null;
  onVoucherClosed?: () => void;
}

const DigitalVoucher: React.FC<DigitalVoucherProps> = ({ 
  isOpen, 
  onClose, 
  paymentData,
  selectedNumbers,
  allowVoucherPrint = true,
  raffleDetails,
  organization,
  onVoucherClosed
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [raffleNumberId, setRaffleNumberId] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isRaffleNumberRetrieved, setIsRaffleNumberRetrieved] = useState<boolean>(false);
  const { clearSelectionState } = useNumberSelection();
  const [allRaffleNumberIds, setAllRaffleNumberIds] = useState<string[]>([]);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantNumbers, setParticipantNumbers] = useState<string[]>([]);
  const [paymentProofImage, setPaymentProofImage] = useState<string | null>(null);
  const [receiptAlreadySaved, setReceiptAlreadySaved] = useState<boolean>(false);
  const [showAlertMessage, setShowAlertMessage] = useState<boolean>(false);
  const [isReceiptSaving, setIsReceiptSaving] = useState<boolean>(false);
  const [receiptSavedSuccessfully, setReceiptSavedSuccessfully] = useState<boolean>(false);
  
  // Determine text color based on theme
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-800';

  const formattedDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Get payment method from payment data
  const paymentMethod = paymentData?.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia bancaria';
  
  // Fetch all raffle number IDs and participant ID when the component mounts or when selectedNumbers changes
  useEffect(() => {
    const fetchRaffleNumberIds = async (): Promise<void> => {
      if (!isOpen || !paymentData?.participantId) return;
      
      try {
        console.log('[src/components/DigitalVoucher.tsx] Iniciando obtención de IDs para participante:', paymentData.buyerName, 'ID:', paymentData.participantId, 'Números seleccionados:', selectedNumbers);
        
        // Store participant ID for later use
        const currentParticipantId = paymentData?.participantId;
        setParticipantId(currentParticipantId);
        
        if (!currentParticipantId) {
          console.error('[src/components/DigitalVoucher.tsx] Error: Falta ID del participante, no se pueden obtener números. Participante:', paymentData.buyerName);
          return;
        }
        
        // Para "Pagar Apartados", usar SOLO los números seleccionados
        if (paymentData.clickedButtonType === "Pagar Apartados") {
          console.log('[src/components/DigitalVoucher.tsx] Procesando flujo "Pagar Apartados" para participante:', paymentData.buyerName, 'ID:', currentParticipantId, 'Números específicos:', selectedNumbers);
          
          // Verificar que los números seleccionados estén en la BD para este participante
          const selectedNumbersInt = selectedNumbers.map(n => parseInt(n));
          const { data: verifiedNumbers, error: verifyError } = await supabase
            .from('raffle_numbers')
            .select('id, number, participant_id, payment_proof, status, payment_receipt_url, payment_method')
            .eq('participant_id', currentParticipantId)
            .eq('raffle_id', RAFFLE_ID)
            .in('number', selectedNumbersInt);
          
          if (verifyError) {
            console.error('[src/components/DigitalVoucher.tsx] Error al verificar números seleccionados para participante:', paymentData.buyerName, 'Error:', verifyError);
            return;
          }
          
          if (verifiedNumbers && verifiedNumbers.length > 0) {
            console.log('[src/components/DigitalVoucher.tsx] Números verificados para "Pagar Apartados" del participante:', paymentData.buyerName, 'Números:', verifiedNumbers.map(n => n.number));
            
            // Usar SOLO los números verificados que coinciden con la selección
            const verifiedNumbersFormatted = verifiedNumbers.map(item => item.number.toString().padStart(2, '0'));
            setParticipantNumbers(verifiedNumbersFormatted);
            
            // Get payment proof from current form data or database
            let proofImage = null;
            if (paymentData?.paymentProof && typeof paymentData.paymentProof === 'string') {
              proofImage = paymentData.paymentProof;
              console.log('[src/components/DigitalVoucher.tsx] Usando comprobante de pago desde formulario actual para participante:', paymentData.buyerName);
            } else {
              proofImage = verifiedNumbers.find(item => item.payment_proof)?.payment_proof || null;
              if (proofImage) {
                console.log('[src/components/DigitalVoucher.tsx] Usando comprobante de pago desde BD para participante:', paymentData.buyerName);
              }
            }
            setPaymentProofImage(proofImage);
            
            const ids = verifiedNumbers.map(item => item.id);
            setAllRaffleNumberIds(ids);
            
            if (ids.length > 0) {
              setRaffleNumberId(ids[0]);
              setIsRaffleNumberRetrieved(true);
            }
          } else {
            console.warn('[src/components/DigitalVoucher.tsx] No se encontraron números verificados para participante:', paymentData.buyerName, 'ID:', currentParticipantId);
            // Fallback: usar números seleccionados
            setParticipantNumbers(selectedNumbers);
          }
        } else {
          // Para otros flujos, usar la lógica original
          console.log('[src/components/DigitalVoucher.tsx] Procesando flujo estándar para participante:', paymentData.buyerName, 'ID:', currentParticipantId);
          
          const { data, error } = await supabase
            .from('raffle_numbers')
            .select('id, number, participant_id, payment_proof, status, payment_receipt_url, payment_method')
            .eq('participant_id', currentParticipantId)
            .eq('raffle_id', RAFFLE_ID);
          
          if (error) {
            console.error('[src/components/DigitalVoucher.tsx] Error al obtener IDs de números para participante:', paymentData.buyerName, 'Error:', error);
            return;
          }
          
          if (data && data.length > 0) {
            // Check if receipt is already saved
            const anyReceiptSaved = data.some(item => item.payment_receipt_url);
            setReceiptAlreadySaved(anyReceiptSaved);
            
            // Get payment proof from form data or database
            let proofImage = null;
            if (paymentData?.paymentProof && typeof paymentData.paymentProof === 'string') {
              proofImage = paymentData.paymentProof;
              console.log('[src/components/DigitalVoucher.tsx] Usando comprobante de pago desde formulario para participante:', paymentData.buyerName);
            } else {
              proofImage = data.find(item => item.payment_proof)?.payment_proof || null;
              if (proofImage) {
                console.log('[src/components/DigitalVoucher.tsx] Imagen de comprobante encontrada en BD para participante:', paymentData.buyerName);
              }
            }
            setPaymentProofImage(proofImage);
            
            const ids = data.map(item => item.id);
            const nums = data.map(item => item.number.toString().padStart(2, '0'));
            
            setAllRaffleNumberIds(ids);
            setParticipantNumbers(nums);
            
            if (ids.length > 0) {
              setRaffleNumberId(ids[0]);
              setIsRaffleNumberRetrieved(true);
            }
            
            console.log('[src/components/DigitalVoucher.tsx] Números de participante obtenidos exitosamente:', paymentData.buyerName, 'Números:', nums);
          } else {
            console.warn('[src/components/DigitalVoucher.tsx] No se encontraron números para participante:', paymentData.buyerName, 'ID:', currentParticipantId);
            setParticipantNumbers(selectedNumbers);
          }
        }
      } catch (err) {
        console.error('[src/components/DigitalVoucher.tsx] Error en fetchRaffleNumberIds para participante:', paymentData.buyerName, 'Error:', err);
      }
    };
    
    fetchRaffleNumberIds();
  }, [isOpen, selectedNumbers, paymentData]);
  
  // Generate the receipt URL for the QR code
  useEffect(() => {
    if (raffleNumberId) {
      // Use the current window's hostname or a default domain if needed
      const domain = window.location.hostname || 'rifamax.com';
      const protocol = window.location.protocol || 'https:';
      const url = `${protocol}//${domain}/receipt/${raffleNumberId}`;
      setReceiptUrl(url);
      console.log('[src/components/DigitalVoucher.tsx] URL de recibo generada para participante:', paymentData?.buyerName, 'URL:', url);
    }
  }, [raffleNumberId]);
  
  // Auto-save receipt pero SIN cerrar el modal automáticamente
  useEffect(() => {
    const autoSaveReceipt = async () => {
      if (isOpen && printRef.current && participantId && !isReceiptSaving && participantNumbers.length > 0) {
        try {
          setIsReceiptSaving(true);
          console.log('[src/components/DigitalVoucher.tsx] Iniciando guardado automático de comprobante para participante:', paymentData?.buyerName, 'ID:', participantId, 'Números:', participantNumbers);
          
          // Always try to generate and save the receipt, regardless of allowVoucherPrint
          const savedUrl = await ensureReceiptSavedForParticipant(
            printRef,
            raffleDetails,
            participantId,
            RAFFLE_ID,
            SELLER_ID,
            participantNumbers
          );
          
          if (savedUrl) {
            console.log('[src/components/DigitalVoucher.tsx] Comprobante guardado automáticamente exitosamente para participante:', paymentData?.buyerName, 'URL:', savedUrl);
            setReceiptAlreadySaved(true);
            setReceiptSavedSuccessfully(true);
            
            // Only show toast if we're actually showing the voucher
            if (allowVoucherPrint) {
              toast.success('Comprobante guardado automáticamente', { id: 'receipt-saved' });
            }
            
            // IMPORTANTE: NO cerrar el modal automáticamente - mantener abierto para que el usuario lo cierre manualmente
            // Show alert message when allowVoucherPrint is false but DON'T close modal
            if (!allowVoucherPrint) {
              setShowAlertMessage(true);
            }
          } else {
            console.error('[src/components/DigitalVoucher.tsx] Error al guardar comprobante para participante:', paymentData?.buyerName, 'No se pudo guardar la URL');
            if (allowVoucherPrint) {
              toast.error('Error al guardar el comprobante automáticamente');
            }
          }
        } catch (error: any) {
          console.error('[src/components/DigitalVoucher.tsx] Error al guardar comprobante automáticamente para participante:', paymentData?.buyerName, 'Error:', error?.message || error);
          if (allowVoucherPrint) {
            toast.error('Error al guardar el comprobante automáticamente');
          }
        } finally {
          setIsReceiptSaving(false);
        }
      }
    };
    
    // Delay execution slightly to ensure the DOM is ready
    const timer = setTimeout(autoSaveReceipt, 1000);
    return () => clearTimeout(timer);
  }, [isOpen, printRef.current, participantId, participantNumbers, raffleDetails, allowVoucherPrint]);
  
  // Handle the modal close event - SOLO MANUAL, nunca automático
  const handleCloseModal = (): void => {
    console.log('[src/components/DigitalVoucher.tsx] Cerrando modal de comprobante MANUALMENTE para participante:', paymentData?.buyerName, 'ID:', participantId);
    clearSelectionState(); // Clear selections when modal is closed
    onClose();
    // Call the onVoucherClosed callback if provided
    if (onVoucherClosed) {
      onVoucherClosed();
    }
  };

  // Function to update payment_receipt_url for all participant's numbers
  const updatePaymentReceiptUrlForAllNumbers = async (voucherUrl: string): Promise<boolean> => {
    if (!voucherUrl || !paymentData?.participantId) {
      console.error("[src/components/DigitalVoucher.tsx] Error: Datos insuficientes para actualizar recibo de pago para participante:", paymentData?.buyerName);
      return false;
    }
    
    try {
      // Only update numbers for the current participant
      console.log(`[src/components/DigitalVoucher.tsx] Guardando URL en raffle_numbers.payment_receipt_url para participante: ${paymentData.buyerName}`);
      
      // Use the utility function to update receipt URLs
      const result = await updatePaymentReceiptUrlForParticipant(
        voucherUrl,
        paymentData.participantId,
        RAFFLE_ID,
        SELLER_ID
      );

      if (result) {
        console.log('[src/components/DigitalVoucher.tsx] Comprobante registrado con éxito para participante:', paymentData.buyerName, 'URL:', voucherUrl);
      }
      
      return result;
    } catch (error: any) {
      console.error("[src/components/DigitalVoucher.tsx] Error al guardar comprobante para participante:", paymentData?.buyerName, "Error:", error?.message || error);
      return false;
    }
  };

  // Mejorar función de guardado de comprobante
  const saveVoucherForAllNumbers = async (): Promise<string | null> => {
    try {
      if (!printRef.current || !raffleDetails || !paymentData?.participantId) {
        console.error("[src/components/DigitalVoucher.tsx] Error: No hay referencia de comprobante, detalles de rifa o datos de pago para participante:", paymentData?.buyerName);
        toast.error("Error: No se pueden generar los datos del comprobante");
        return null;
      }
      
      console.log("[src/components/DigitalVoucher.tsx] Iniciando generación y guardado de comprobantes para participante:", paymentData.buyerName, "ID:", paymentData.participantId, "Números:", participantNumbers);
      
      // Usar html2canvas sin iframe para evitar errores
      const html2canvas = (await import('html2canvas')).default;
      
      try {
        console.log('[src/components/DigitalVoucher.tsx] Generando imagen del comprobante para participante:', paymentData.buyerName);
        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          // Configuraciones para evitar errores de iframe
          foreignObjectRendering: false,
          removeContainer: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        console.log('[src/components/DigitalVoucher.tsx] Imagen del comprobante generada exitosamente para participante:', paymentData.buyerName);
        
        if (!imgData) {
          throw new Error("No se pudo generar la imagen del comprobante");
        }
        
        // Create a unique receipt ID
        const receiptId = `receipt_${new Date().getTime()}_${paymentData.participantId}`;
        
        // Upload to storage
        const imageUrl = await uploadVoucherToStorage(
          imgData, 
          raffleDetails.title, 
          receiptId
        );
        
        if (imageUrl) {
          console.log('[src/components/DigitalVoucher.tsx] Imagen subida correctamente para participante:', paymentData.buyerName, 'URL:', imageUrl);
          
          // Actualizar solo los números de este participante con la URL del recibo
          const updateSuccess = await updatePaymentReceiptUrlForAllNumbers(imageUrl);
          
          if (updateSuccess) {
            setReceiptAlreadySaved(true);
            console.log(`[src/components/DigitalVoucher.tsx] Comprobante guardado correctamente para participante: ${paymentData.buyerName} - números: ${participantNumbers.join(', ')} - método de pago: ${paymentMethod}`);
            toast.success("¡Comprobante guardado exitosamente!");
            return imageUrl;
          } else {
            console.error("[src/components/DigitalVoucher.tsx] Error al guardar comprobante para participante:", paymentData.buyerName, "fallo al actualizar recibos en la base de datos");
            toast.error("Error al guardar el comprobante en la base de datos");
            return null;
          }
        } else {
          console.error("[src/components/DigitalVoucher.tsx] Error al guardar comprobante para participante:", paymentData.buyerName, "fallo al subir imagen");
          toast.error("Error al subir la imagen del comprobante");
          return null;
        }
      } catch (canvasError: any) {
        console.error('[src/components/DigitalVoucher.tsx] Error al generar imagen con html2canvas para participante:', paymentData.buyerName, 'Error:', canvasError?.message || canvasError);
        toast.error("Error al generar la imagen del comprobante");
        return null;
      }
    } catch (error: any) {
      console.error(`[src/components/DigitalVoucher.tsx] Error al guardar comprobante para participante: ${paymentData?.buyerName} - Error: ${error?.message || error}`);
      toast.error("Error al guardar el comprobante. Intente nuevamente.");
      return null;
    } finally {
      console.log('[src/components/DigitalVoucher.tsx] Finalizando ciclo de guardado para participante:', paymentData?.buyerName);
    }
  };

  // Mejorar función de descarga
  const handleDownloadVoucher = async () => {
    if (printRef.current) {
      try {
        console.log('[src/components/DigitalVoucher.tsx] Iniciando descarga de comprobante para participante:', paymentData?.buyerName);
        
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: false,
          removeContainer: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        if (imgData) {
          downloadVoucherImage(imgData, `comprobante_${new Date().getTime()}.png`);
          console.log('[src/components/DigitalVoucher.tsx] Descarga iniciada correctamente para participante:', paymentData?.buyerName);
        } else {
          throw new Error("No se pudo generar la imagen para descarga");
        }
      } catch (error: any) {
        console.error('[src/components/DigitalVoucher.tsx] Error en descarga para participante:', paymentData?.buyerName, 'Error:', error?.message || error);
        toast.error("Error al descargar el comprobante");
      }
    }
  };

  // Mejorar función de visualización
  const handleViewVoucher = async () => {
    if (printRef.current) {
      try {
        console.log('[src/components/DigitalVoucher.tsx] Iniciando visualización de comprobante para participante:', paymentData?.buyerName);
        
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: false,
          removeContainer: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        if (imgData) {
          presentVoucherImage(imgData);
          console.log('[src/components/DigitalVoucher.tsx] Visualización iniciada correctamente para participante:', paymentData?.buyerName);
        } else {
          throw new Error("No se pudo generar la imagen para visualización");
        }
      } catch (error: any) {
        console.error('[src/components/DigitalVoucher.tsx] Error en visualización para participante:', paymentData?.buyerName, 'Error:', error?.message || error);
        toast.error("Error al visualizar el comprobante");
      }
    }
  };

  // If the receipt has been saved and allowVoucherPrint is false, show the alert message
  if (isOpen && !allowVoucherPrint && showAlertMessage && receiptSavedSuccessfully) {
    console.log('[src/components/DigitalVoucher.tsx] Mostrando AlertMessage porque allowVoucherPrint es false para participante:', paymentData?.buyerName);
    return (
      <AlertMessage 
        isOpen={true} 
        onClose={handleCloseModal} 
        textColor={textColor} 
        receiptSaved={receiptSavedSuccessfully}
      />
    );
  }
  
  // If allowVoucherPrint is true or receipt is still saving, show the regular voucher dialog
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
      <DialogContent 
        className="sm:max-w-md md:max-w-xl lg:max-w-2xl min-h-[85vh] max-h-[90vh] flex flex-col bg-white/20 backdrop-blur-md rounded-xl border-0"
        aria-describedby="voucher-description"
      >
        <DialogDescription id="voucher-description" className="sr-only">
          Comprobante digital de pago para números de rifa seleccionados
        </DialogDescription>
        
        <VoucherHeader 
          onClose={handleCloseModal}
          onSaveVoucher={saveVoucherForAllNumbers}
        />
        
        <ScrollArea className="flex-1 overflow-y-auto p-4">
          <VoucherContent 
            printRef={printRef}
            formattedDate={formattedDate}
            paymentMethod={paymentMethod}
            paymentData={paymentData}
            selectedNumbers={participantNumbers} // Using participant's numbers
            raffleDetails={raffleDetails}
            qrUrl={receiptUrl || ''}
            textColor={textColor}
            numberId={raffleNumberId || undefined}
            paymentProofImage={paymentProofImage}
          />
        </ScrollArea>
        
        <VoucherActions 
          onClose={handleCloseModal}
          onDownload={handleDownloadVoucher}
          onView={handleViewVoucher}
        />
      </DialogContent>
    </Dialog>
  );
};

export default DigitalVoucher;
