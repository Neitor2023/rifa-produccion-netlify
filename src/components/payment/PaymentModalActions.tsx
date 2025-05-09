
import React from 'react';
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import { Organization } from '@/lib/constants/types';

interface PaymentModalActionsProps {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  organization?: Organization | null;
}

export const PaymentModalActions = ({ isSubmitting, onClose, onSubmit, organization }: PaymentModalActionsProps) => {
  const { clearSelectionState } = useNumberSelection();

  const handleCancel = () => {
    console.log("PaymentModalActions.tsx: Cancel button clicked");
    
    // Clear number selections and states
    clearSelectionState();
    
    // Close the modal
    onClose();
  };

  const handleSubmit = (e: React.MouseEvent) => {
    // Add a debug log to track when the button is clicked
    console.log("PaymentModalActions.tsx: Completar Pago button clicked");
    
    // Call the onSubmit function passed from the parent
    onSubmit();
    
    // Prevent default to avoid any unexpected form submissions
    e.preventDefault();
  };

  console.log('[PaymentModalActions] Button image removed from Completar Pago button');

  return (
    <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
        className="flex-1 sm:flex-none font-bold normal-case text-gray-800 dark:text-white hover:bg-[#9b87f5] hover:text-white dark:hover:text-gray-800"
        disabled={isSubmitting}
      >
        Cancelar
      </Button>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="flex-1 sm:flex-none bg-[#9b87f5] hover:bg-[#7E69AB] text-white normal-case w-16 h-16 md:w-20 md:h-20 flex items-center justify-center py-2 px-3"
      >
        {isSubmitting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <div className="text-xs text-center">
            Completar Pago
          </div>
        )}
      </Button>
    </div>
  );
};
