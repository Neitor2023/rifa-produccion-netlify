
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
import { 
  exportVoucherAsImage, 
  downloadVoucherImage, 
  presentVoucherImage, 
  uploadVoucherToStorage, 
  updatePaymentReceiptUrlForNumbers,
  updatePaymentReceiptUrlForParticipant 
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
  
  // Determine text color based on theme
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-800';

  // Effect to show AlertMessage when allowVoucherPrint is false
  useEffect(() => {
    console.log('[DigitalVoucher.tsx] Comprobando allowVoucherPrint:', allowVoucherPrint);
    
    // Only show alert when voucher is opened and printing is not allowed
    if (isOpen && allowVoucherPrint === false) {
      console.log('[DigitalVoucher.tsx] Mostrando mensaje de alerta - impresión no permitida');
      setShowAlertMessage(true);
    } else {
      setShowAlertMessage(false);
    }
  }, [isOpen, allowVoucherPrint]);

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
        console.log('[DigitalVoucher.tsx] Looking for IDs for participant:', paymentData.participantId);
        
        // Store participant ID for later use
        const currentParticipantId = paymentData?.participantId;
        setParticipantId(currentParticipantId);
        
        if (!currentParticipantId) {
          console.error('[DigitalVoucher.tsx] Missing participant ID, cannot fetch numbers');
          return;
        }
        
        // Fix: Only fetch numbers that belong to the current participant
        // For "Pagar Apartados" flow, get sold or reserved numbers for this participant
        const { data, error } = await supabase
          .from('raffle_numbers')
          .select('id, number, participant_id, payment_proof, status, payment_receipt_url')
          .eq('participant_id', currentParticipantId)
          .eq('raffle_id', RAFFLE_ID);
        
        if (error) {
          console.error('[DigitalVoucher.tsx] Error fetching raffle number IDs:', error);
          return;
        }
        
        if (data && data.length > 0) {
          // Check if receipt is already saved
          const anyReceiptSaved = data.some(item => item.payment_receipt_url);
          setReceiptAlreadySaved(anyReceiptSaved);
          
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
          
          // Get IDs only for the current participant's numbers
          const ids = data.map(item => item.id);
          
          // Get numbers only for the current participant
          // Fix: For "Pagar Apartados", only get numbers that were previously reserved and are now sold
          // Filter according to the button clicked
          let filteredData = data;
          const isPayingReserved = paymentData?.clickedButtonType === "Pagar Apartados";
          
          if (isPayingReserved) {
            // For "Pagar Apartados" flow, only get numbers that were previously reserved and now sold
            filteredData = data.filter(item => item.status === 'sold');
            console.log('[DigitalVoucher.tsx] Filtered to sold numbers for "Pagar Apartados" flow:', 
              filteredData.map(item => item.number));
          } else {
            // For "Pagar Directo" flow, match with selected numbers
            const numbersInts = selectedNumbers.map(numStr => parseInt(numStr, 10));
            filteredData = data.filter(item => numbersInts.includes(Number(item.number)));
            console.log('[DigitalVoucher.tsx] Filtered to selected numbers for direct payment:', 
              filteredData.map(item => item.number));
          }
          
          const nums = filteredData.map(item => item.number.toString().padStart(2, '0'));
          
          setAllRaffleNumberIds(ids);
          
          // Set the numbers to display in the voucher
          if (nums.length > 0) {
            setParticipantNumbers(nums);
            console.log('[DigitalVoucher.tsx] Using participant numbers from DB:', nums);
          } else {
            // Fallback to selected numbers if we couldn't find any numbers in DB
            setParticipantNumbers(selectedNumbers);
            console.log('[DigitalVoucher.tsx] Using selected numbers as fallback:', selectedNumbers);
          }
          
          // Set first ID for receipt URL generation
          if (ids.length > 0) {
            setRaffleNumberId(ids[0]);
            setIsRaffleNumberRetrieved(true);
          }
          
          console.log('[DigitalVoucher.tsx] Participant numbers fetched:', nums);
          console.log('[DigitalVoucher.tsx] Raffle number IDs fetched:', ids);
        } else {
          console.warn('[DigitalVoucher.tsx] No numbers found for this participant');
          
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
  
  // Auto-save receipt when voucher is opened if not already saved
  useEffect(() => {
    const autoSaveReceipt = async () => {
      // Only auto-save if the receipt hasn't been saved yet
      if (isOpen && printRef.current && participantId && !receiptAlreadySaved) {
        console.log('[DigitalVoucher.tsx] Auto-saving receipt for participant:', participantId);
        await saveVoucherForAllNumbers();
      }
    };
    
    // Delay execution slightly to ensure the DOM is ready
    const timer = setTimeout(autoSaveReceipt, 1000);
    return () => clearTimeout(timer);
  }, [isOpen, printRef.current, participantId, receiptAlreadySaved]);
  
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
      console.error("❌ Error: Insufficient data to update payment receipt");
      return false;
    }
    
    try {
      // Only update numbers for the current participant
      console.log(`📋 Updating receipt for participant numbers: ${paymentData.participantId}`);
      
      // Use the utility function to update receipt URLs
      const result = await updatePaymentReceiptUrlForParticipant(
        voucherUrl,
        paymentData.participantId,
        RAFFLE_ID,
        SELLER_ID
      );
      
      return result;
    } catch (error) {
      console.error("❌ Error updating payment receipt:", error);
      return false;
    }
  };

  // Function to save the voucher for all numbers
  const saveVoucherForAllNumbers = async (): Promise<string | null> => {
    try {
      if (!printRef.current || !raffleDetails || !paymentData?.participantId) {
        console.error("❌ Error: No voucher reference, raffle details or payment data");
        return null;
      }
      
      // Generate the voucher image
      const imgData = await exportVoucherAsImage(printRef.current, '');
      if (!imgData) {
        console.error("❌ Error: Could not generate voucher image");
        return null;
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
        // Update only this participant's numbers with the receipt URL
        const updateSuccess = await updatePaymentReceiptUrlForAllNumbers(imageUrl);
        
        if (updateSuccess) {
          setReceiptAlreadySaved(true);
          toast.success('Comprobante guardado automáticamente', { id: 'receipt-saved' });
        }
        
        // Also download locally
        downloadVoucherImage(imgData, `comprobante_${raffleDetails.title.replace(/\s+/g, '_')}.png`);
        
        return imageUrl;
      }
      
      return null;
    } catch (error) {
      console.error("❌ Error saving voucher:", error);
      toast.error("Error al guardar el comprobante. Intente nuevamente.");
      return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
      <DialogContent className="sm:max-w-md md:max-w-xl lg:max-w-2xl min-h-[85vh] max-h-[90vh] flex flex-col bg-white/20 backdrop-blur-md rounded-xl border-0">
        {/* Show AlertMessage when allowVoucherPrint is false */}
        <AlertMessage 
          isOpen={showAlertMessage} 
          onClose={() => setShowAlertMessage(false)}
          textColor={textColor}
        />
        
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
          onDownload={() => {
            if (printRef.current) {
              exportVoucherAsImage(printRef.current, 'comprobante')
                .then(imgData => {
                  if (imgData) downloadVoucherImage(imgData, `comprobante_${new Date().getTime()}.png`);
                });
            }
          }}
          onView={() => {
            if (printRef.current) {
              exportVoucherAsImage(printRef.current, 'comprobante')
                .then(imgData => {
                  if (imgData) presentVoucherImage(imgData);
                });
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default DigitalVoucher;
