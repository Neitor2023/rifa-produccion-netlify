
import React from 'react';
import { DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

interface VoucherHeaderProps {
  onClose?: () => void;
  onSaveVoucher?: () => Promise<string | null>;
}

const VoucherHeader: React.FC<VoucherHeaderProps> = ({
  onClose,
  onSaveVoucher
}) => {
  return (
    <DialogHeader className="pt-1 pb-1">
      <Card className="bg-[#9b87f5] dark:bg-[#7E69AB] shadow-md border-0">
        <div className="py-3 px-4 relative">
          <DialogTitle className="text-2xl font-bold text-center text-white">
            Comprobante de pago
          </DialogTitle>
          
          <DialogClose onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm bg-[#3d3d3d] hover:bg-[#1a1a1a] opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-white">
            <X className="h-4 w-4"/>
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
      </Card>
    </DialogHeader>
  );
};

export default VoucherHeader;
