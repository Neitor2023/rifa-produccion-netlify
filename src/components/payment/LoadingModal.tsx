
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoaderCircle } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ 
  isOpen,
  title = "Procesando...",
  message = "Por favor espere mientras se procesa su solicitud..."
}) => {
  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent 
        className="sm:max-w-md bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg"
        // Remove the showClose property as it doesn't exist in the DialogContent type
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <LoaderCircle className="h-12 w-12 animate-spin text-purple-600 dark:text-purple-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            {message}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingModal;
