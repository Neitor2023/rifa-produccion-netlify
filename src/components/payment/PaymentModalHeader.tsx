
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentModalHeaderProps {
  onClose?: () => void;
  onHeaderClick?: () => void;
}

export const PaymentModalHeader: React.FC<PaymentModalHeaderProps> = ({ onClose, onHeaderClick }) => {
  return (
    <DialogHeader className="relative pb-2 border-0 border-gray-200 dark:border-gray-700">
      <DialogTitle 
        className="text-lg font-bold text-gray-800 dark:text-white cursor-pointer bg-[#9b87f5] dark:bg-[#7E69AB] shadow-md border-0 p-2 rounded"
        onClick={onHeaderClick}
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
