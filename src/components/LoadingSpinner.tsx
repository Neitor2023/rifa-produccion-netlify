
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Cargando...',
  size = 'medium'
}) => {
  const sizeClass = {
    small: 'h-5 w-5',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <Loader2 className={`animate-spin ${sizeClass[size]} text-rifa-purple`} />
        <span className="text-lg font-medium dark:text-white">{message}</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
