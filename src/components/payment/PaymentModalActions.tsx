
import React from 'react';
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import SafeImage from '@/components/SafeImage';
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

  // Debug logs for image URLs
  console.log('[PaymentModalActions.tsx] Button image (Completar Pago):', organization?.imagen_pago);

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
        className="flex-1 sm:flex-none bg-[#9b87f5] hover:bg-[#7E69AB] normal-case flex flex-col items-center py-2"
      >
        {isSubmitting ? (
          <LoaderCircle className="h-4 w-4 animate-spin mb-1" />
        ) : organization?.imagen_pago ? (
          <SafeImage 
            src={organization.imagen_pago} 
            alt="Completar Pago Icon"
            containerClassName="w-8 h-8 mb-1"
            className="object-contain w-full h-full"
          />
        ) : null}
        <div className="flex flex-col items-center">
          <span>Completar</span>
          <span>Pago</span>
        </div>
      </Button>
    </div>
  );
};
