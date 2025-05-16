
import React from 'react';
import { DialogTitle, DialogClose } from '@/components/ui/dialog';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from "@/components/ui/card";

export interface VoucherHeaderProps {
  onClose: () => void;
  onSaveVoucher: () => Promise<string | null>;
}

const VoucherHeader: React.FC<VoucherHeaderProps> = ({ onClose, onSaveVoucher }) => {
  return (
              <Card className="bg-[#9b87f5] dark:bg-[#7E69AB] shadow-md border-0">
                <CardHeader className="py-3 px-4">
    
    {/*<div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">*/}
    <DialogTitle className="text-xl font-bold ">
        
        Comprobante
      </DialogTitle>
                </CardHeader>
              </Card>
                  
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSaveVoucher()}
          className="flex items-center text-green-600 hover:text-white hover:bg-green-600 border-green-600"
        >
          <Save className="mr-1 h-4 w-4" />
          Guardar
        </Button>
        <DialogClose
          className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          onClick={onClose}
        >
          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </div>
    </div>
  );
};

export default VoucherHeader;
