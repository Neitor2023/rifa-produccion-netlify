
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { shouldShowDevNotice } from '@/lib/supabase-env';

const DevelopmentAlert: React.FC = () => {
  const showNotice = shouldShowDevNotice();
  
  // No mostrar si la configuración indica que no se debe mostrar
  if (!showNotice) {
    return null;
  }
  
  return (
    <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 mb-4">
      <AlertDescription className="text-amber-800 dark:text-amber-200 font-medium">
        🚧 Estás en modo {DEFAULT_ENVIRONMENT === 'dev' ? 'DESARROLLO' : 'PRODUCCIÓN'}
      </AlertDescription>
    </Alert>
  );
};

export default DevelopmentAlert;
