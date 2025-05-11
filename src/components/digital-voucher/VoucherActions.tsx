
import React from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, Maximize2 } from 'lucide-react';

interface VoucherActionsProps {
  onDownload: () => void;
  onPresent: () => void;
  onClose: () => void;
}

const VoucherActions: React.FC<VoucherActionsProps> = ({
  onDownload,
  onPresent,
  onClose
}) => {
  return (
    <DialogFooter className="flex flex-row justify-between space-x-2 mt-4">
      <Button 
        type="button" 
        className="flex-1 bg-purple-700 hover:bg-purple-800 text-white w-full sm:w-auto"
        onClick={onDownload}
      >
        <Download className="h-4 w-4 mr-2" />
        Descargar
      </Button>
      
      <Button
        type="button"
        variant="outline"
        onClick={onPresent}
        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white w-full sm:w-auto mb-2 sm:mb-0"
      >
        <Maximize2 className="h-4 w-4 mr-2" />
        Presentar
      </Button>
      
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="flex-1 bg-gray-400 hover:bg-gray-500 text-white w-full sm:w-auto mb-2 sm:mb-0"
      >
        <X className="h-4 w-4 mr-2" />
        Cerrar
      </Button>
    </DialogFooter>
  );
};

export default VoucherActions;
