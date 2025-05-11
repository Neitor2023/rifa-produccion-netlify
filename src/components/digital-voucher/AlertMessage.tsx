
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AlertMessageProps {
  isOpen: boolean;
  onClose: () => void;
  textColor: string;
}

const AlertMessage: React.FC<AlertMessageProps> = ({ 
  isOpen, 
  onClose, 
  textColor 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] flex flex-col bg-background dark:bg-gray-900 rounded-xl border-0 shadow-xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-center text-red-600">
            Importante: Pide al vendedor tu comprobante de pago
          </DialogTitle>
        </DialogHeader>
        
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Important Notice</AlertTitle>
          <AlertDescription className={`text-base leading-relaxed ${textColor}`}>
            <p className="mb-4">
              Su comprobante de pago está en revisión, es importante que le exija su comprobante de pago a su vendedor, este es su constancia de reclamo de premios; cualquier novedad comuníquese a los teléfonos de los organizadores que se encuentran al final de la página web.
            </p>
            <Button 
              onClick={onClose} 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Entendido
            </Button>
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
};

export default AlertMessage;
