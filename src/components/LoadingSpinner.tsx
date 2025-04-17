
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Cargando...' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="animate-spin h-12 w-12 text-rifa-purple" />
      <span className="ml-2 text-xl font-medium dark:text-white">{message}</span>
    </div>
  );
};

export default LoadingSpinner;
