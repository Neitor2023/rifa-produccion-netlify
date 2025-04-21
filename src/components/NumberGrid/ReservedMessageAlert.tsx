
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReservedMessageAlertProps {
  onClose: () => void;
}

const ReservedMessageAlert: React.FC<ReservedMessageAlertProps> = ({ onClose }) => (
  <Alert className="mb-4 bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
    <div className="flex justify-between items-center">
      <AlertDescription className="text-sm">
        📢 Pulse sobre su número apartado para proceder al pago.
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="h-6 w-6 p-0 rounded-full"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  </Alert>
);

export default ReservedMessageAlert;
