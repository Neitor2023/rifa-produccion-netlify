
import React from 'react';

interface ValidationMessageProps {
  message: string;
  isValid: boolean;
  formattedNumber?: string;
}

const ValidationMessage: React.FC<ValidationMessageProps> = ({ 
  message, 
  isValid, 
  formattedNumber 
}) => {
  if (!message) return null;
  
  return (
    <div className="space-y-1 mt-3">
      <p className={`text-sm ${isValid ? 'text-black dark:text-white' : 'font-bold text-red-500 dark:text-red-400'}`}>
        {message}
      </p>
      {isValid && formattedNumber && (
        <p className="text-sm font-bold text-gray-500 dark:text-gray-300">
          Formato internacional o DNI: {formattedNumber} o 1702030405
        </p>
      )}
    </div>
  );
};

export default ValidationMessage;
