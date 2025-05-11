
import React, { useRef } from 'react';
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
import { exportVoucherAsImage, downloadVoucherImage, presentVoucherImage } from './digital-voucher/utils/voucherExport';

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

  const handleDownload = async () => {
    const imgData = await exportVoucherAsImage(printRef.current, `comprobante_${formattedDate.replace(/\s+/g, '_')}.png`);
    if (imgData) {
      downloadVoucherImage(imgData, `comprobante_${formattedDate.replace(/\s+/g, '_')}.png`);
    }
  };
  
  const handlePresent = async () => {
    const imgData = await exportVoucherAsImage(printRef.current, '');
    if (imgData) {
      presentVoucherImage(imgData);
    }
  };

  const qrData = raffleDetails ? JSON.stringify({
    title: raffleDetails.title,
    numbers: selectedNumbers,
    price: raffleDetails.price,
    lottery: raffleDetails.lottery,
    dateLottery: raffleDetails.dateLottery,
    timestamp: formattedDate
  }) : '';
  
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
            qrData={qrData}
            textColor={textColor}
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
