
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

interface ModalFooterProps {
  onCancel: () => void;
  onValidate: () => void;
  isValid: boolean;
}

const ModalFooter: React.FC<ModalFooterProps> = ({ onCancel, onValidate, isValid }) => {
  return (
    <DialogFooter className="flex flex-row justify-between space-x-2 pt-0 border-t mt-0">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel} 
        className="flex-1 sm:flex-none font-bold uppercase text-gray-800 dark:text-white hover:bg-[#9b87f5] hover:text-white dark:hover:text-gray-800"
      >
        Cancelar
      </Button>
      <Button 
        type="button" 
        onClick={onValidate}
        disabled={!isValid}
        className="flex-1 sm:flex-none bg-[#9b87f5] hover:bg-[#7E69AB] font-bold uppercase"
      >
        Validar
      </Button>
    </DialogFooter>
  );
};

export default ModalFooter;
