
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
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button 
        type="button" 
        onClick={onValidate}
        disabled={!isValid}
      >
        Validar WMWMWMWMW
      </Button>
    </DialogFooter>
  );
};

export default ModalFooter;
