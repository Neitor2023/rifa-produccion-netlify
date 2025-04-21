
import React from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface PaymentModalContainerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const PaymentModalContainer: React.FC<PaymentModalContainerProps> = ({ open, onClose, children }) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] flex flex-col">
      <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogClose>
      {children}
    </DialogContent>
  </Dialog>
);

export default PaymentModalContainer;
