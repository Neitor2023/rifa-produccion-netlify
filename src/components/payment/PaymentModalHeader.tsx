
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentModalHeaderProps {
  onClose?: () => void;
  onHeaderClick?: () => void; // Added this prop to make the header clickable
}

export const PaymentModalHeader: React.FC<PaymentModalHeaderProps> = ({ onClose, onHeaderClick }) => {
  return (
    <DialogHeader className="relative pb-2 border-b border-gray-200 dark:border-gray-700">
      <DialogTitle 
        className="text-lg font-bold text-gray-800 dark:text-white cursor-pointer"
        onClick={onHeaderClick} // Make the title clickable
      >
        Completar Pago
      </DialogTitle>
      {onClose && (
        <Button 
          type="button"
          variant="ghost" 
          className="absolute right-0 top-0 rounded-full w-8 h-8 p-0" 
          onClick={onClose}
        >
          <X className="h-5 w-5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" />
          <span className="sr-only">Cerrar</span>
        </Button>
      )}
    </DialogHeader>
  );
};
