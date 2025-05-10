
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import LoadingModal from '@/components/payment/LoadingModal';

interface PaymentModalActionsProps {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const PaymentModalActions = ({ isSubmitting, onClose, onSubmit }: PaymentModalActionsProps) => {
  const { clearSelectionState } = useNumberSelection();
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);

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
    
    // Show loading modal
    setIsLoadingModalOpen(true);
    
    // Call the onSubmit function passed from the parent
    onSubmit();
    
    // Prevent default to avoid any unexpected form submissions
    e.preventDefault();
  };

  return (
    <>
      <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="flex-1 sm:flex-none font-bold uppercase text-gray-800 dark:text-white hover:bg-[#9b87f5] hover:text-white dark:hover:text-gray-800"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 sm:flex-none bg-[#9b87f5] hover:bg-[#7E69AB] font-bold uppercase"
        >
          {isSubmitting ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Completar Pago
        </Button>
      </div>

      <LoadingModal isOpen={isLoadingModalOpen} />
    </>
  );
};
