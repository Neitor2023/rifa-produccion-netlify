
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
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel} className="font-bold uppercase">
        Cancelar
      </Button>
      <Button 
        type="button" 
        onClick={onValidate}
        disabled={!isValid}
        className="font-bold uppercase"
      >
        Validar
      </Button>
    </DialogFooter>
  );
};

export default ModalFooter;
