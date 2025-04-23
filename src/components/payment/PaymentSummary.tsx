
import React from 'react';

interface PaymentSummaryProps {
  selectedNumbers: string[];
  price: number;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  selectedNumbers,
  price,
}) => {
  // Calculate total
  const total = selectedNumbers.length * price;
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Resumen del Pago</h3>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <div className="mb-2">
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Números seleccionados:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {selectedNumbers.map((num) => (
              <span 
                key={num}
                className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-blue-800 dark:text-blue-100"
              >
                {num}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center border-t border-blue-200 dark:border-blue-700 pt-2 mt-2">
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
            {selectedNumbers.length} número(s) x ${price.toFixed(2)}
          </span>
          <span className="font-bold text-green-700 dark:text-green-400">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
