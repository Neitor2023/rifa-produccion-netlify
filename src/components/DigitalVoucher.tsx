
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
}

const DigitalVoucher: React.FC<DigitalVoucherProps> = ({ 
  isOpen, 
  onClose, 
  paymentData,
  selectedNumbers,
  allowVoucherPrint = true,
  raffleDetails
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { toast } = useToast();
  const [raffleNumberId, setRaffleNumberId] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  
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
  
  useEffect(() => {
    // Fetch the raffle number ID when the component mounts
    const fetchRaffleNumberId = async () => {
      if (selectedNumbers.length === 0 || !isOpen) return;
      
      try {
        // Get the first selected number to use for the receipt URL
        const number = parseInt(selectedNumbers[0], 10);
        
        console.log('[DigitalVoucher.tsx] Buscando ID para número:', number);
        
        const { data, error } = await supabase
          .from('raffle_numbers')
          .select('id')
          .eq('number', number)
          .single();
        
        if (error) {
          console.error('[DigitalVoucher.tsx] Error fetching raffle number ID:', error);
          return;
        }
        
        if (data) {
          setRaffleNumberId(data.id);
          console.log('[DigitalVoucher.tsx] Raffle number ID fetched:', data.id);
        } else {
          console.error('[DigitalVoucher.tsx] No se encontró ID para el número:', number);
        }
      } catch (err) {
        console.error('[DigitalVoucher.tsx] Error in fetchRaffleNumberId:', err);
      }
    };
    
    fetchRaffleNumberId();
  }, [isOpen, selectedNumbers]);
  
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

  const handleDownload = async () => {
    if (!raffleNumberId) {
      console.error('[DigitalVoucher.tsx] No se puede descargar: raffleNumberId no disponible');
      toast({
        title: "Error",
        description: "No se pudo identificar el número de la rifa. Intente nuevamente.",
        variant: "destructive"
      });
      return;
    }

    const imgData = await exportVoucherAsImage(printRef.current, `comprobante_${formattedDate.replace(/\s+/g, '_')}.png`);
    if (imgData) {
      downloadVoucherImage(imgData, `comprobante_${formattedDate.replace(/\s+/g, '_')}.png`);
      
      // Upload to storage if we have a raffle number ID
      if (raffleDetails) {
        try {
          console.log('[DigitalVoucher.tsx] Iniciando proceso de guardar comprobante con ID:', raffleNumberId);
          const imageUrl = await uploadVoucherToStorage(imgData, raffleDetails.title, raffleNumberId);
          if (imageUrl) {
            toast({
              title: "Comprobante guardado",
              description: "El comprobante ha sido almacenado en el sistema.",
            });
          }
        } catch (error) {
          console.error('[DigitalVoucher.tsx] Error saving receipt to storage:', error);
        }
      }
    }
  };
  
  const handlePresent = async () => {
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
      
      // Upload to storage if we have a raffle number ID
      if (raffleDetails) {
        try {
          console.log('[DigitalVoucher.tsx] Iniciando proceso de guardar comprobante con ID:', raffleNumberId);
          const imageUrl = await uploadVoucherToStorage(imgData, raffleDetails.title, raffleNumberId);
          if (imageUrl) {
            toast({
              title: "Comprobante guardado",
              description: "El comprobante ha sido almacenado en el sistema.",
            });
          }
        } catch (error) {
          console.error('[DigitalVoucher.tsx] Error saving receipt to storage:', error);
        }
      }
    }
  };
  
  // If voucher printing is not allowed, show the alert message
  if (!allowVoucherPrint) {
    return <AlertMessage isOpen={isOpen} onClose={onClose} textColor={textColor} />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] flex flex-col bg-background dark:bg-gray-900 rounded-xl border-0 shadow-xl">
        <VoucherHeader />
        
        <ScrollArea className="max-h-[50vh] overflow-y-auto px-1 bg-background dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700">
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
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default DigitalVoucher;
export type { PaymentFormData };
