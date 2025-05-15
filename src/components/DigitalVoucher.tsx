
import React, { useRef, useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
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
import { exportVoucherAsImage, downloadVoucherImage, presentVoucherImage, uploadVoucherToStorage, updatePaymentReceiptUrlForNumbers } from './digital-voucher/utils/voucherExport';
import { supabase } from '@/integrations/supabase/client';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';

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
  onVoucherClosed?: () => void;
}

const DigitalVoucher: React.FC<DigitalVoucherProps> = ({ 
  isOpen, 
  onClose, 
  paymentData,
  selectedNumbers,
  allowVoucherPrint = true,
  raffleDetails,
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
  
  // Determine text color based on theme
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-800';

  const formattedDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const paymentMethod = paymentData?.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia bancaria';
  
  // Fetch all raffle number IDs and participant ID when the component mounts or when selectedNumbers changes
  useEffect(() => {
    const fetchRaffleNumberIds = async (): Promise<void> => {
      if (!isOpen || !paymentData?.participantId) return;
      
      try {
        console.log('[DigitalVoucher.tsx] Buscando IDs para participante:', paymentData.participantId);
        
        // Determine if we're in "Pagar Apartados" flow
        const isPayingReserved = paymentData?.clickedButtonType === "Pagar Apartados";
        const currentParticipantId = paymentData?.participantId;
        
        console.log('[DigitalVoucher.tsx] Flow type:', isPayingReserved ? 'Pagar Apartados' : 'Pagar Directo');
        console.log('[DigitalVoucher.tsx] Current participant ID:', currentParticipantId);
        
        if (!currentParticipantId) {
          console.error('[DigitalVoucher.tsx] Missing participant ID, cannot fetch numbers');
          return;
        }
        
        setParticipantId(currentParticipantId);
        
        // Start query to get this participant's numbers
        let query = supabase
          .from('raffle_numbers')
          .select('id, number, participant_id, payment_proof')
          .eq('participant_id', currentParticipantId);
        
        // In "Pagar Apartados" flow, only get sold numbers that were previously reserved
        if (isPayingReserved) {
          query = query.eq('status', 'sold');
        } else {
          // For "Pagar Directo" flow, only get numbers we're currently processing
          const numbersInts = selectedNumbers.map(numStr => parseInt(numStr, 10));
          if (numbersInts.length > 0) {
            query = query.in('number', numbersInts);
          }
        }
        
        // Execute query
        const { data, error } = await query;
        
        if (error) {
          console.error('[DigitalVoucher.tsx] Error fetching raffle number IDs:', error);
          return;
        }
        
        if (data && data.length > 0) {
          // First try to get payment proof from form data
          let proofImage = null;
          if (paymentData?.paymentProof && typeof paymentData.paymentProof === 'string') {
            proofImage = paymentData.paymentProof;
            console.log('[DigitalVoucher.tsx] Using payment proof from form data:', paymentData.paymentProof);
          } else {
            // If not in form data, check database
            proofImage = data.find(item => item.payment_proof)?.payment_proof || null;
            if (proofImage) {
              console.log('[DigitalVoucher.tsx] Payment proof image found in DB:', proofImage);
            }
          }
          
          setPaymentProofImage(proofImage);
          
          const ids = data.map(item => item.id);
          const nums = data.map(item => item.number.toString().padStart(2, '0'));
          
          setAllRaffleNumberIds(ids);
          
          // Only show this participant's numbers in the voucher
          if (nums.length > 0) {
            setParticipantNumbers(nums);
            console.log('[DigitalVoucher.tsx] Using participant numbers from DB:', nums);
          } else {
            setParticipantNumbers(selectedNumbers);
            console.log('[DigitalVoucher.tsx] Using selected numbers:', selectedNumbers);
          }
          
          // Set first ID for receipt URL generation
          if (ids.length > 0) {
            setRaffleNumberId(ids[0]);
            setIsRaffleNumberRetrieved(true);
          }
          
          console.log('[DigitalVoucher.tsx] Participant numbers fetched:', nums);
          console.log('[DigitalVoucher.tsx] Raffle number IDs fetched:', ids);
        } else {
          console.warn('[DigitalVoucher.tsx] No se encontraron números para el participante');
          
          // Fallback: If no existing numbers found, use the provided selectedNumbers
          setParticipantNumbers(selectedNumbers);
        }
      } catch (err) {
        console.error('[DigitalVoucher.tsx] Error in fetchRaffleNumberIds:', err);
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
      console.log('[DigitalVoucher.tsx] Receipt URL generated:', url);
    }
  }, [raffleNumberId]);
  
  // Handle the modal close event
  const handleCloseModal = (): void => {
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
      console.error("❌ Error: Datos insuficientes para actualizar comprobante de pago");
      return false;
    }
    
    try {
      // Only update numbers for the current participant
      console.log(`📋 Actualizando recibo para números del participante: ${paymentData.participantId}`);
      
      if (allRaffleNumberIds.length === 0) {
        console.warn("⚠️ No hay IDs de números para actualizar");
        return false;
      }
      
      const { error } = await supabase
        .from('raffle_numbers')
        .update({ payment_receipt_url: voucherUrl })
        .in('id', allRaffleNumberIds);
        
      if (error) {
        console.error("❌ Error al actualizar recibo de pago:", error);
        return false;
      }
      
      console.log(`✅ Recibo de pago actualizado con éxito para ${allRaffleNumberIds.length} números`);
      return true;
    } catch (error) {
      console.error("❌ Error al actualizar recibo de pago:", error);
      return false;
    }
  };

  // Function to save the voucher for all numbers
  const saveVoucherForAllNumbers = async (): Promise<string | null> => {
    try {
      if (!printRef.current || !raffleDetails || !paymentData) {
        console.error("❌ Error: No hay referencia al voucher, detalles de la rifa o datos de pago");
        return null;
      }
      
      // Generate the voucher image
      const imgData = await exportVoucherAsImage(printRef.current, '');
      if (!imgData) {
        console.error("❌ Error: No se pudo generar la imagen del comprobante");
        return null;
      }
      
      // Download the image locally
      downloadVoucherImage(imgData, `comprobante_${raffleDetails.title.replace(/\s+/g, '_')}.png`);
      
      // If we have a raffleNumberId, upload to storage
      if (raffleNumberId) {
        const imageUrl = await uploadVoucherToStorage(imgData, raffleDetails.title, raffleNumberId);
        
        if (imageUrl && allRaffleNumberIds.length > 1) {
          // Update all participant's numbers with the receipt URL
          await updatePaymentReceiptUrlForNumbers(imageUrl, allRaffleNumberIds);
        }
        
        return imageUrl;
      }
      
      return null;
    } catch (error) {
      console.error("❌ Error en saveVoucherForAllNumbers:", error);
      return null;
    }
  };

  // Modify the handleDownload function to save the voucher for all numbers
  const handleDownload = async () => {
    try {
      if (!paymentData) {
        console.error("❌ Error: No hay datos de pago disponibles para generar el comprobante");
        toast.error("Error al generar comprobante: Datos insuficientes.");
        return;
      }
      
      // Generate and save the voucher
      const voucherUrl = await saveVoucherForAllNumbers();
      
      if (voucherUrl) {
        // Update all sold numbers with this receipt URL
        await updatePaymentReceiptUrlForAllNumbers(voucherUrl);
        
        console.log("✅ Comprobante descargado y guardado con éxito");
        toast.success("Comprobante guardado con éxito");
      } else {
        console.error("❌ Error al guardar el comprobante de pago");
        toast.error("Error al guardar el comprobante de pago");
      }
    } catch (error) {
      console.error("❌ Error en handleDownload:", error);
      toast.error("Error al generar o guardar el comprobante");
    }
  };
  
  const handlePresent = async (): Promise<void> => {
    if (!raffleNumberId) {
      console.error('[DigitalVoucher.tsx] No se puede presentar: raffleNumberId no disponible');
      toast.error("No se pudo identificar el número de la rifa. Intente nuevamente.");
      return;
    }

    const imgData = await exportVoucherAsImage(printRef.current, '');
    if (imgData) {
      presentVoucherImage(imgData);
      
      // Upload to storage for all participant numbers
      if (raffleDetails && allRaffleNumberIds.length > 0) {
        try {
          console.log('[DigitalVoucher.tsx] Iniciando proceso de guardar comprobante para todos los números del participante');
          const imageUrl = await uploadVoucherToStorage(imgData, raffleDetails.title, raffleNumberId);
          
          if (imageUrl) {
            // Update all numbers with the same receipt URL
            const updateSuccess = await updatePaymentReceiptUrlForAllNumbers(imageUrl);
            
            if (updateSuccess) {
              toast.success(`El comprobante ha sido almacenado para todos los números (${allRaffleNumberIds.length}).`);
            }
          }
        } catch (error) {
          console.error('[DigitalVoucher.tsx] Error saving receipt to storage:', error);
        }
      }
    }
  };
  
  // If voucher printing is not allowed, show the alert message
  if (!allowVoucherPrint) {
    return <AlertMessage isOpen={isOpen} onClose={handleCloseModal} textColor={textColor} />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-md md:max-w-xl min-h-[80vh] sm:min-h-[75vh] flex flex-col bg-white/20 backdrop-blur-md rounded-xl border-0 shadow-xl">
        <VoucherHeader />
        
        <ScrollArea className="max-h-[65vh] overflow-y-auto px-1 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-300/50 dark:border-gray-700/50 flex-grow">
          <VoucherContent 
            printRef={printRef}
            formattedDate={formattedDate}
            paymentMethod={paymentMethod}
            paymentData={paymentData}
            selectedNumbers={participantNumbers || selectedNumbers}
            raffleDetails={raffleDetails}
            qrUrl={receiptUrl || 'https://rifamax.com'} 
            textColor={textColor}
            numberId={raffleNumberId || undefined}
            paymentProofImage={paymentProofImage}
          />
        </ScrollArea>
        
        <VoucherActions 
          onDownload={handleDownload}
          onPresent={handlePresent}
          onClose={handleCloseModal}
        />
      </DialogContent>
    </Dialog>
  );
};

export default DigitalVoucher;
export type { PaymentFormData };
