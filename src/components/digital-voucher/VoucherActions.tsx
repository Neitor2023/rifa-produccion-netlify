
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Eye, Save } from 'lucide-react';

export interface VoucherActionsProps {
  onClose: () => void;
  onDownload: () => void;
  onView: () => void;
  onSave?: () => Promise<string | null>;
  isReceiptSaving?: boolean;
  receiptAlreadySaved?: boolean;
  textColor?: string;
}

const VoucherActions: React.FC<VoucherActionsProps> = ({ 
  onClose, 
  onDownload, 
  onView, 
  onSave,
  isReceiptSaving = false,
  receiptAlreadySaved = false,
  textColor
}) => {
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
      <Button
        variant="outline"
        onClick={onView}
        className="flex items-center gap-1"
      >
        <Eye className="h-4 w-4" />
        <span>Ver</span>
      </Button>
      <Button
        variant="outline"
        onClick={onDownload}
        className="flex items-center gap-1 text-blue-600 hover:text-white hover:bg-blue-600 border-blue-600"
      >
        <Download className="h-4 w-4" />
        <span>Descargar</span>
      </Button>
      {onSave && (
        <Button
          variant="outline"
          onClick={onSave}
          disabled={isReceiptSaving || receiptAlreadySaved}
          className="flex items-center gap-1 text-green-600 hover:text-white hover:bg-green-600 border-green-600"
        >
          <Save className="h-4 w-4" />
          <span>{isReceiptSaving ? 'Guardando...' : receiptAlreadySaved ? 'Guardado' : 'Guardar'}</span>
        </Button>
      )}
      <Button
        variant="default"
        onClick={onClose}
        className="flex items-center gap-1"
      >
        <X className="h-4 w-4" />
        <span>Cerrar</span>
      </Button>
    </div>
  );
};

export default VoucherActions;
