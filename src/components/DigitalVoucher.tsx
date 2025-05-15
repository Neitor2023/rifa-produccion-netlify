import React, { useRef, useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaymentFormData } from './PaymentModal';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/hooks/use-toast';

// Import the refactored components
import AlertMessage from './digital-voucher/AlertMessage';
import VoucherHeader from './digital-voucher/VoucherHeader';
import VoucherContent from './digital-voucher/VoucherContent';
import VoucherActions from './digital-voucher/VoucherActions';
import { exportVoucherAsImage, downloadVoucherImage, presentVoucherImage, uploadVoucherToStorage } from './digital-voucher/utils/voucherExport';
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
  onVoucherClosed?: () => void; // Prop to handle selection cleanup
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
  const { toast } = useToast();
  const [raffleNumberId, setRaffleNumberId] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isRaffleNumberRetrieved, setIsRaffleNumberRetrieved] = useState<boolean>(false);
  const { clearSelectionState } = useNumberSelection();
  const [allRaffleNumberIds, setAllRaffleNumberIds] = useState<string[]>([]);
  const [participantId, setParticipantId] = useState<string | null>(null);
  
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
      if (selectedNumbers.length === 0 || !isOpen) return;
      
      try {
        console.log('[DigitalVoucher.tsx] Buscando IDs para números:', selectedNumbers);
        
        // Convert selected numbers to integers for proper database comparison
        const selectedNumberInts = selectedNumbers.map(num => parseInt(num, 10));
        
        // Query to get IDs of all selected numbers
        const { data, error } = await supabase
          .from('raffle_numbers')
          .select('id, number, participant_id')
          .in('number', selectedNumberInts);
        
        if (error) {
          console.error('[DigitalVoucher.tsx] Error fetching raffle number IDs:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const ids = data.map(item => item.id);
          setAllRaffleNumberIds(ids);
          
          // Set first ID for receipt URL generation
          setRaffleNumberId(ids[0]);
          
          // Store participant ID for further fetching of related numbers
          if (data[0].participant_id) {
            setParticipantId(data[0].participant_id);
          }
          
          setIsRaffleNumberRetrieved(true);
          console.log('[DigitalVoucher.tsx] Raffle number IDs fetched:', ids);
        } else {
          console.error('[DigitalVoucher.tsx] No se encontraron IDs para los números seleccionados');
        }
      } catch (err) {
        console.error('[DigitalVoucher.tsx] Error in fetchRaffleNumberIds:', err);
      }
    };
    
    fetchRaffleNumberIds();
  }, [isOpen, selectedNumbers]);
  
  // Fetch all numbers belonging to the participant
  useEffect(() => {
    const fetchAllParticipantNumbers = async () => {
      if (!participantId) return;
      
      try {
        console.log('[DigitalVoucher.tsx] Buscando todos los números del participante:', participantId);
        
        const { data, error } = await supabase
          .from('raffle_numbers')
          .select('id')
          .eq('participant_id', participantId)
          .eq('status', 'sold');
          
        if (error) {
          console.error('[DigitalVoucher.tsx] Error fetching participant numbers:', error);
          return;
        }
        
        if (data && data.length > 0) {
          // Add any additional number IDs that weren't in the initial selection
          const allIds = [...new Set([...allRaffleNumberIds, ...data.map(item => item.id)])];
          setAllRaffleNumberIds(allIds);
          console.log('[DigitalVoucher.tsx] All participant number IDs:', allIds);
        }
      } catch (err) {
        console.error('[DigitalVoucher.tsx] Error fetching participant numbers:', err);
      }
    };
    
    fetchAllParticipantNumbers();
  }, [participantId, allRaffleNumberIds]);
  
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

  // Add this function to the component, before the return statement
  const updatePaymentReceiptUrlForAllNumbers = async (voucherUrl: string, paymentData: PaymentFormData) => {
    if (!voucherUrl || !paymentData || !paymentData.participantId) {
      console.error("❌ Error: Datos insuficientes para actualizar comprobante de pago");
      return false;
    }
    
    try {
      // Find all sold numbers for this participant
      const { data: soldNumbers, error: fetchError } = await supabase
        .from('raffle_numbers')
        .select('id')
        .eq('participant_id', paymentData.participantId)
        .eq('status', 'sold');
        
      if (fetchError) {
        console.error("❌ Error al buscar números vendidos:", fetchError);
        return false;
      }
      
      if (!soldNumbers || soldNumbers.length === 0) {
        console.error("❌ No se encontraron números vendidos para actualizar el recibo");
        return false;
      }
      
      console.log(`📋 Actualizando recibo de pago para ${soldNumbers.length} números vendidos`);
      
      // Update all records with the payment receipt URL
      const { error: updateError } = await supabase
        .from('raffle_numbers')
        .update({ payment_receipt_url: voucherUrl })
        .in('id', soldNumbers.map(n => n.id));
        
      if (updateError) {
        console.error("❌ Error al actualizar recibo de pago:", updateError);
        return false;
      }
      
      console.log("✅ Recibo de pago actualizado con éxito para todos los números");
      return true;
    } catch (error) {
      console.error("❌ Error al actualizar recibo de pago:", error);
      return false;
    }
  };

  // Modify the handleDownload function to save the voucher for all numbers
  const handleDownload = async () => {
    try {
      if (!paymentData) {
        console.error("❌ Error: No hay datos de pago disponibles para generar el comprobante");
        toast.error("Error al generar comprobante. Datos insuficientes.");
        return;
      }
      
      // Generate and save the voucher
      const voucherUrl = await SaveVoucherForAllNumbers(selectedNumbers, paymentData);
      
      if (voucherUrl) {
        // Update all sold numbers with this receipt URL
        await updatePaymentReceiptUrlForAllNumbers(voucherUrl, paymentData);
        
        console.log("✅ Comprobante descargado y guardado con éxito");
        toast.success("Comprobante descargado y guardado con éxito");
      } else {
        console.error("❌ Error al guardar el comprobante de pago");
        toast.error("Error al guardar el comprobante de pago");
      }
    } catch (error) {
      console.error("❌ Error en handleDownload:", error);
      toast.error("Error al generar o guardar el comprobante");
    }
  };
  
  // Function to update all participant's numbers with the receipt URL
  const updateAllParticipantNumbersWithReceipt = async (imageUrl: string, numberIds: string[]): Promise<boolean> => {
    if (!imageUrl || numberIds.length === 0) return false;
    
    try {
      console.log('[DigitalVoucher.tsx] Updating payment_receipt_url for all numbers:', numberIds);
      
      const { error } = await supabase
        .from('raffle_numbers')
        .update({ payment_receipt_url: imageUrl })
        .in('id', numberIds);
        
      if (error) {
        console.error('[DigitalVoucher.tsx] Error updating payment_receipt_url:', error);
        return false;
      }
      
      console.log('[DigitalVoucher.tsx] Successfully updated payment_receipt_url for all numbers');
      return true;
    } catch (error) {
      console.error('[DigitalVoucher.tsx] Error in updateAllParticipantNumbersWithReceipt:', error);
      return false;
    }
  };
  
  const handlePresent = async (): Promise<void> => {
    if (!raffleNumberId) {
      console.error('[DigitalVoucher.tsx] No se puede presentar: raffleNumberId no disponible');
      toast({
        title: "Error",
        description: "No se pudo identificar el número de la rifa. Intente nuevamente.",
        variant: "destructive"
      });
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
            const updateSuccess = await updateAllParticipantNumbersWithReceipt(imageUrl, allRaffleNumberIds);
            
            if (updateSuccess) {
              toast({
                title: "Comprobante guardado",
                description: `El comprobante ha sido almacenado para todos los números (${allRaffleNumberIds.length}).`,
              });
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
            selectedNumbers={selectedNumbers}
            raffleDetails={raffleDetails}
            qrUrl={receiptUrl || 'https://rifamax.com'} // Use the generated receipt URL
            textColor={textColor}
            numberId={raffleNumberId || undefined}
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
