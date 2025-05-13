
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';

const VoucherHeader: React.FC = () => {
  return (
    <DialogHeader className="pt-1 pb-1">
      <Card className="bg-[#9b87f5] dark:bg-[#7E69AB] shadow-md border-0">
        <div className="py-3 px-4">
          <DialogTitle className="text-2xl font-bold text-center text-white">
            Comprobante de pago
          </DialogTitle>
        </div>
      </Card>
    </DialogHeader>
  );
};

export default VoucherHeader;
