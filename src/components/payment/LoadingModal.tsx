
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoaderCircle } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string; // Make message optional
}

const LoadingModal: React.FC<LoadingModalProps> = ({ isOpen, message }) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-white/80 backdrop-blur-md rounded-xl border-0 shadow-xl p-8">
        <div className="flex flex-col items-center justify-center text-center gap-4 py-6">
          <LoaderCircle className="h-12 w-12 animate-spin text-[#9b87f5]" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Procesando pago</h3>
            <p className="text-sm text-gray-600">
              {message || "Por favor espere mientras procesamos su solicitud..."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingModal;
