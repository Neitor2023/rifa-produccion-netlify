
import React from 'react';
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";

interface PaymentModalActionsProps {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const PaymentModalActions = ({ isSubmitting, onClose, onSubmit }: PaymentModalActionsProps) => {
  return (
    <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="flex-1 sm:flex-none"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="flex-1 sm:flex-none bg-[#9b87f5] hover:bg-[#7E69AB]"
      >
        {isSubmitting ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Completar Pago
      </Button>
    </div>
  );
};
