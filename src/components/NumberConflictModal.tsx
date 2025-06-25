
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface NumberConflictModalProps {
  isOpen: boolean;
  conflictingNumbers: string[];
  onClose: () => void;
}

const NumberConflictModal: React.FC<NumberConflictModalProps> = ({ 
  isOpen, 
  conflictingNumbers, 
  onClose 
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-2">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <AlertDialogTitle className="text-center text-xl">Conflicto en venta de números</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Uno o más de los números seleccionados ya han sido vendidos por otro vendedor:
            <span className="font-bold text-red-500 text-lg block mt-2">
              {conflictingNumbers.join(', ')}
            </span>
            Por favor elija otro número disponible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center">
          <AlertDialogAction onClick={onClose} className="bg-blue-500 hover:bg-blue-700">
            Entendido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default NumberConflictModal;
