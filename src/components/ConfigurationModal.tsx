
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getVisibleConfig, shouldShowDevNotice } from '@/lib/supabase-env';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  // Solo renderizar si showDevNotice es true
  if (!shouldShowDevNotice()) {
    return null;
  }

  const config = getVisibleConfig();
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-blue-600 font-semibold">
            ⚙️ Configuración Actual
          </DialogTitle>
        </DialogHeader>
        
        <div className="my-4 space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium text-gray-700 dark:text-gray-300">
                Entorno:
              </div>
              <div className={`font-mono ${config.isDevelopment ? 'text-amber-600' : 'text-green-600'}`}>
                {config.environment}
              </div>
              
              <div className="font-medium text-gray-700 dark:text-gray-300">
                Hostname:
              </div>
              <div className="font-mono text-gray-600 dark:text-gray-400">
                {config.hostname}
              </div>
              
              <div className="font-medium text-gray-700 dark:text-gray-300">
                Supabase URL:
              </div>
              <div className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                {config.supabaseUrl}
              </div>
              
              <div className="font-medium text-gray-700 dark:text-gray-300">
                API Key:
              </div>
              <div className="font-mono text-xs text-gray-600 dark:text-gray-400">
                {config.supabaseKey}
              </div>
              
              <div className="font-medium text-gray-700 dark:text-gray-300">
                Dev Mode:
              </div>
              <div className={`font-mono ${config.isDev ? 'text-amber-600' : 'text-gray-600'}`}>
                {config.isDev ? 'Sí' : 'No'}
              </div>
            </div>
          </div>
          
          {config.isDevelopment && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                💡 <strong>Modo desarrollo activo:</strong> Todas las operaciones se realizan en el entorno de desarrollo.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurationModal;
