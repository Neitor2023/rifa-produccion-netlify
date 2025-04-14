
import React from 'react';

interface PaymentSummaryProps {
  selectedNumbers: string[];
  price: number;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({ selectedNumbers, price }) => {
  const totalAmount = selectedNumbers.length * price;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md mb-4 shadow-sm">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        {selectedNumbers.length > 1 ? 'Números seleccionados:' : 'Número seleccionado:'}
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {selectedNumbers.map((number) => (
          <span key={number} className="bg-rifa-purple text-white px-2 py-1 text-xs rounded-md">
            {number}
          </span>
        ))}
      </div>
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedNumbers.length} número(s) x ${price.toFixed(2)}
          </span>
          <span className="font-medium text-lg dark:text-gray-200">
            ${totalAmount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
