
import React from 'react';

interface PaymentProcessingOverlayProps {
  isVisible: boolean;
}

const PaymentProcessingOverlay: React.FC<PaymentProcessingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-md">
        <div className="mb-4">
          <div className="h-12 w-12 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Procesando comprobante de pago, por favor espere...
        </h2>
      </div>
    </div>
  );
};

export default PaymentProcessingOverlay;
