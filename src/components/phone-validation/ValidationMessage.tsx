
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
    <div className="space-y-1">
      <p className={`text-sm ${isValid ? 'text-green-600' : 'text-red-500'}`}>
        {message}
      </p>
      {isValid && formattedNumber && (
        <p className="text-sm text-gray-500">
          Formato internacional o DNI: {formattedNumber} o 1702030405
        </p>
      )}
    </div>
  );
};

export default ValidationMessage;
