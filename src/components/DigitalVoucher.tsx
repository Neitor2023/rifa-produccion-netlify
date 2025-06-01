
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
  const { clearSelectionState } = useNumberSelection();
  
  // CORRECCIÓN CRÍTICA: Agregar guards para paymentData
  const [isDataReady, setIsDataReady] = useState(false);
  
  // Missing state variables that were accidentally removed
  const [paymentProofImage, setPaymentProofImage] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string>('');
  const [participantNumbers, setParticipantNumbers] = useState<string[]>([]);
  const [allRaffleNumberIds, setAllRaffleNumberIds] = useState<string[]>([]);
  const [raffleNumberId, setRaffleNumberId] = useState<string | null>(null);
  const [isRaffleNumberRetrieved, setIsRaffleNumberRetrieved] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isReceiptSaving, setIsReceiptSaving] = useState(false);
  const [receiptAlreadySaved, setReceiptAlreadySaved] = useState(false);
  const [receiptSavedSuccessfully, setReceiptSavedSuccessfully] = useState(false);
  const [showAlertMessage, setShowAlertMessage] = useState(false);
  
  // Determine text color based on theme
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-800';

  const formattedDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // CORRECCIÓN CRÍTICA: Función para verificar y procesar paymentData
  useEffect(() => {
    console.log('[DigitalVoucher.tsx] 🔍 Verificando paymentData disponible:', {
      isOpen,
      paymentDataExists: !!paymentData,
      paymentDataKeys: paymentData ? Object.keys(paymentData) : [],
      paymentMethod: paymentData?.paymentMethod,
      buyerName: paymentData?.buyerName,
      participantId: paymentData?.participantId
    });

    if (isOpen && paymentData) {
      console.log('[DigitalVoucher.tsx] ✅ PaymentData detectado correctamente:', {
        buyerName: paymentData.buyerName,
        paymentMethod: paymentData.paymentMethod,
        participantId: paymentData.participantId
      });
      setIsDataReady(true);
    } else if (isOpen && !paymentData) {
      console.warn('[DigitalVoucher.tsx] ⚠️ Modal abierto pero paymentData no disponible, esperando...');
      setIsDataReady(false);
    }
  }, [isOpen, paymentData]);

  // CORRECCIÓN CRÍTICA: Función de mapeo del método de pago con mejor manejo de errores
  const getPaymentMethodText = (method?: string): string => {
    console.log('[DigitalVoucher.tsx] 🔍 Procesando método de pago:', {
      method,
      participantName: paymentData?.buyerName,
      participantId: paymentData?.participantId
    });
    
    if (method === 'cash') {
      console.log('[DigitalVoucher.tsx] ✅ Mapeando método "cash" a "Efectivo"');
      return 'Efectivo';
    } else if (method === 'transfer') {
      console.log('[DigitalVoucher.tsx] ✅ Mapeando método "transfer" a "Transferencia bancaria"');
      return 'Transferencia bancaria';
    } else {
      console.warn('[DigitalVoucher.tsx] ⚠️ Método de pago no reconocido o undefined:', method);
      return 'Transferencia bancaria';
    }
  };

  const paymentMethod = getPaymentMethodText(paymentData?.paymentMethod);

  // CORRECCIÓN: Función para validar si la imagen corresponde al pago actual
  const validatePaymentProofImage = (imageUrl: string | null, currentPaymentMethod: string): boolean => {
    if (!imageUrl) return false;
    
    console.log('[DigitalVoucher.tsx] Validando imagen del comprobante:', {
      imageUrl: imageUrl?.substring(0, 50) + '...',
      metodoActual: currentPaymentMethod,
      participante: paymentData?.buyerName
    });
    
    // La imagen es válida si existe y corresponde al pago actual
    return imageUrl !== null && imageUrl !== undefined && imageUrl.trim() !== '';
  };

  // CORRECCIÓN: Reset del estado de imagen entre diferentes pagos
  useEffect(() => {
    if (isOpen) {
      console.log('[DigitalVoucher.tsx] Iniciando nuevo proceso de comprobante, limpiando imagen anterior');
      setPaymentProofImage(null); // Limpiar imagen anterior al abrir nuevo comprobante
    }
  }, [isOpen]);
  
  // Fetch all raffle number IDs and participant ID when the component mounts or when selectedNumbers changes
  useEffect(() => {
    const fetchRaffleNumberIds = async (): Promise<void> => {
      if (!isOpen || !paymentData?.participantId) return;
      
      try {
        console.log('[DigitalVoucher.tsx] Iniciando obtención de IDs para participante:', paymentData.buyerName, 'ID:', paymentData.participantId, 'Números seleccionados:', selectedNumbers);
        
        // Store participant ID for later use
        const currentParticipantId = paymentData?.participantId;
        setParticipantId(currentParticipantId);
        
        if (!currentParticipantId) {
          console.error('[DigitalVoucher.tsx] Error: Falta ID del participante, no se pueden obtener números. Participante:', paymentData.buyerName);
          return;
        }
        
        // Para "Pagar Apartados", usar SOLO los números seleccionados explícitamente
        if (paymentData.clickedButtonType === "Pagar Apartados") {
          console.log('[DigitalVoucher.tsx] Procesando flujo "Pagar Apartados" para participante:', paymentData.buyerName, 'ID:', currentParticipantId, 'Números específicos:', selectedNumbers);
          
          // Verificar que los números seleccionados estén en la BD para este participante
          if (selectedNumbers && selectedNumbers.length > 0) {
            const selectedNumbersInt = selectedNumbers.map(n => parseInt(n));
            
            const { data: verifiedNumbers, error: verifyError } = await supabase
              .from('raffle_numbers')
              .select('id, number, participant_id, payment_proof, status, payment_receipt_url, payment_method')
              .eq('participant_id', currentParticipantId)
              .eq('raffle_id', RAFFLE_ID)
              .in('number', selectedNumbersInt);
            
            if (verifyError) {
              console.error('[DigitalVoucher.tsx] Error al verificar números seleccionados para participante:', paymentData.buyerName, 'Error:', verifyError);
              return;
            }
            
            if (verifiedNumbers && verifiedNumbers.length > 0) {
              console.log('[DigitalVoucher.tsx] Números verificados para "Pagar Apartados" del participante:', paymentData.buyerName, 'Números:', verifiedNumbers.map(n => n.number));
              
              // IMPORTANTE: Usar SOLO los números seleccionados que fueron verificados
              const verifiedNumbersFormatted = verifiedNumbers.map(item => item.number.toString().padStart(2, '0'));
              console.log('[DigitalVoucher.tsx] Números formateados para mostrar en comprobante:', verifiedNumbersFormatted);
              setParticipantNumbers(verifiedNumbersFormatted);
              
              // CORRECCIÓN CRÍTICA: Validar y usar SOLO la imagen del pago ACTUAL
              let currentProofImage = null;
              if (paymentData?.paymentProof && typeof paymentData.paymentProof === 'string') {
                const isValidImage = validatePaymentProofImage(paymentData.paymentProof, paymentMethod);
                if (isValidImage) {
                  currentProofImage = paymentData.paymentProof;
                  console.log('[DigitalVoucher.tsx] ✅ Usando comprobante de pago ACTUAL desde formulario para participante:', paymentData.buyerName, 'Método:', paymentMethod);
                } else {
                  console.log('[DigitalVoucher.tsx] ⚠️ Imagen del comprobante actual no es válida, no se mostrará imagen');
                }
              } else {
                console.log('[DigitalVoucher.tsx] ⚠️ No hay imagen de comprobante en el formulario actual para participante:', paymentData.buyerName);
              }
              
              setPaymentProofImage(currentProofImage);
              
              const ids = verifiedNumbers.map(item => item.id);
              setAllRaffleNumberIds(ids);
              
              if (ids.length > 0) {
                setRaffleNumberId(ids[0]);
                setIsRaffleNumberRetrieved(true);
              }
            } else {
              console.warn('[DigitalVoucher.tsx] No se encontraron números verificados para participante:', paymentData.buyerName);
              // Fallback: usar números seleccionados como están
              setParticipantNumbers(selectedNumbers);
            }
          } else {
            console.warn('[DigitalVoucher.tsx] No hay números seleccionados para participante:', paymentData.buyerName);
            setParticipantNumbers([]);
          }
        } else {
          // Para "Pagar Directo", usar SOLO los números seleccionados en el momento
          console.log('[DigitalVoucher.tsx] Procesando flujo "Pagar Directo" para participante:', paymentData.buyerName, 'ID:', currentParticipantId, 'Números:', selectedNumbers);
          
          // Usar directamente los números seleccionados
          setParticipantNumbers(selectedNumbers);
          
          // CORRECCIÓN CRÍTICA: Validar y usar SOLO la imagen del pago ACTUAL
          let currentProofImage = null;
          if (paymentData?.paymentProof && typeof paymentData.paymentProof === 'string') {
            const isValidImage = validatePaymentProofImage(paymentData.paymentProof, paymentMethod);
            if (isValidImage) {
              currentProofImage = paymentData.paymentProof;
              console.log('[DigitalVoucher.tsx] ✅ Usando comprobante de pago ACTUAL desde formulario para participante (pago directo):', paymentData.buyerName, 'Método:', paymentMethod);
            } else {
              console.log('[DigitalVoucher.tsx] ⚠️ Imagen del comprobante actual no es válida para pago directo');
            }
          } else {
            console.log('[DigitalVoucher.tsx] ⚠️ No hay imagen de comprobante en formulario actual para pago directo, participante:', paymentData.buyerName);
          }
          
          setPaymentProofImage(currentProofImage);
          
          // Obtener IDs de los números para referencias
          if (selectedNumbers && selectedNumbers.length > 0) {
            const selectedNumbersInt = selectedNumbers.map(n => parseInt(n));
            const { data, error } = await supabase
              .from('raffle_numbers')
              .select('id, number')
              .eq('participant_id', currentParticipantId)
              .eq('raffle_id', RAFFLE_ID)
              .in('number', selectedNumbersInt);
              
            if (error) {
              console.error('[DigitalVoucher.tsx] Error al obtener IDs para números seleccionados:', error);
            } else if (data && data.length > 0) {
              const ids = data.map(item => item.id);
              setAllRaffleNumberIds(ids);
              
              if (ids.length > 0) {
                setRaffleNumberId(ids[0]);
                setIsRaffleNumberRetrieved(true);
              }
            }
          }
        }
      } catch (err) {
        console.error('[DigitalVoucher.tsx] Error en fetchRaffleNumberIds para participante:', paymentData.buyerName, 'Error:', err);
      }
    };
    
    fetchRaffleNumberIds();
  }, [isOpen, selectedNumbers, paymentData, paymentMethod]);
  
  // Generate the receipt URL for the QR code
  useEffect(() => {
    if (raffleNumberId) {
      // Use the current window's hostname or a default domain if needed
      const domain = window.location.hostname || 'rifamax.com';
      const protocol = window.location.protocol || 'https:';
      const url = `${protocol}//${domain}/receipt/${raffleNumberId}`;
      setReceiptUrl(url);
      console.log('[DigitalVoucher.tsx] URL de recibo generada para participante:', paymentData?.buyerName, 'URL:', url);
    }
  }, [raffleNumberId]);
  
  // Auto-save receipt pero SIN cerrar el modal automáticamente
  useEffect(() => {
    const autoSaveReceipt = async () => {
      if (isOpen && printRef.current && participantId && !isReceiptSaving && participantNumbers.length > 0) {
        try {
          setIsReceiptSaving(true);
          console.log('[DigitalVoucher.tsx] Iniciando guardado automático de comprobante para participante:', paymentData?.buyerName, 'ID:', participantId, 'Números:', participantNumbers);
          
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
            console.log('[DigitalVoucher.tsx] Comprobante guardado automáticamente exitosamente para participante:', paymentData?.buyerName, 'URL:', savedUrl);
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
            console.error('[DigitalVoucher.tsx] Error al guardar comprobante para participante:', paymentData?.buyerName, 'No se pudo guardar la URL');
            if (allowVoucherPrint) {
              toast.error('Error al guardar el comprobante automáticamente');
            }
          }
        } catch (error: any) {
          console.error('[DigitalVoucher.tsx] Error al guardar comprobante automáticamente para participante:', paymentData?.buyerName, 'Error:', error?.message || error);
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
  
  // CORRECCIÓN CRÍTICA: Handle manual close con limpieza completa de estado
  const handleCloseModal = (): void => {
    console.log('[DigitalVoucher.tsx] 🚪 Cerrando modal de comprobante MANUALMENTE');
    
    // Limpiar estado local
    setPaymentProofImage(null);
    setIsDataReady(false);
    
    // Limpiar selección de números cuando se cierre el voucher
    clearSelectionState();
    
    // Ejecutar callback de cierre si se proporciona
    if (onVoucherClosed) {
      console.log('[DigitalVoucher.tsx] 🧹 Ejecutando callback onVoucherClosed para limpieza completa');
      onVoucherClosed();
    }
    
    // Cerrar el modal
    onClose();
    
    console.log('[DigitalVoucher.tsx] ✅ Modal cerrado completamente');
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
    console.log('[DigitalVoucher.tsx] Mostrando AlertMessage porque allowVoucherPrint es false');
    return (
      <AlertMessage 
        isOpen={true} 
        onClose={handleCloseModal} 
        textColor={textColor} 
        receiptSaved={receiptSavedSuccessfully}
      />
    );
  }
  
  // CORRECCIÓN CRÍTICA: Mostrar loading mientras se espera paymentData
  if (isOpen && !isDataReady) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent 
          className="sm:max-w-md md:max-w-xl lg:max-w-2xl min-h-[85vh] max-h-[90vh] flex flex-col bg-white/20 backdrop-blur-md rounded-xl border-0"
          aria-describedby="voucher-description"
        >
          <DialogDescription id="voucher-description" className="sr-only">
            Comprobante digital de pago para números de rifa seleccionados
          </DialogDescription>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Preparando comprobante de pago...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // CORRECCIÓN CRÍTICA: Solo renderizar el voucher completo si paymentData está disponible
  if (!isDataReady || !paymentData) {
    console.warn('[DigitalVoucher.tsx] ⚠️ No se puede renderizar voucher: datos no disponibles');
    return null;
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
            selectedNumbers={participantNumbers} // Usando números de participante verificados
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
