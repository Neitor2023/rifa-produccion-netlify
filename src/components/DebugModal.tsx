
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  title?: string;
}

const DebugModal: React.FC<DebugModalProps> = ({ 
  isOpen, 
  onClose, 
  data,
  title = '🔧 Debug Information'
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-amber-600 font-semibold">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Información de depuración para análisis técnico
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-2">
          <pre className="text-xs max-h-[400px] overflow-auto whitespace-pre-wrap text-amber-800 dark:text-amber-200">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DebugModal;
