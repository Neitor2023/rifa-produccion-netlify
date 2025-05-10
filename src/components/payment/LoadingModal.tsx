
import React from 'react';
import { 
  Dialog, 
  DialogContent,
} from '@/components/ui/dialog';
import { LoaderCircle } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ 
  isOpen,
  message = 'Procesando comprobante de pago, por favor espere...' 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col items-center justify-center bg-background dark:bg-gray-900 rounded-xl border-0 shadow-xl">
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <LoaderCircle className="h-12 w-12 text-[#9b87f5] animate-spin mb-4" />
          <p className="text-lg font-medium text-center">{message}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingModal;
