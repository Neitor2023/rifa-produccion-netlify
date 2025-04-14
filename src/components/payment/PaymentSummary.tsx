
import React from 'react';

interface PaymentSummaryProps {
  selectedNumbers: string[];
  price: number;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({ selectedNumbers, price }) => {
  const totalAmount = selectedNumbers.length * price;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-4">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        {selectedNumbers.length > 1 ? 'Números seleccionados:' : 'Número seleccionado:'}
      </div>
      <div className="flex flex-wrap gap-1">
        {selectedNumbers.map((number) => (
          <span key={number} className="bg-rifa-purple text-white px-2 py-1 text-xs rounded-md">
            {number}
          </span>
        ))}
      </div>
      <div className="mt-2 text-right font-medium dark:text-gray-200">
        <div className="text-xs text-gray-500 dark:text-gray-400 inline-block mr-2">
          {selectedNumbers.length} número(s) x ${price.toFixed(2)} = 
        </div>
        Total: ${totalAmount.toFixed(2)}
      </div>
    </div>
  );
};

export default PaymentSummary;
