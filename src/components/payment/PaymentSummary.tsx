
import React from 'react';

interface PaymentSummaryProps {
  selectedNumbers: string[];
  price: number;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({ selectedNumbers, price }) => {
  const totalAmount = selectedNumbers.length * price;

  return (
    <div className="bg-gray-50 p-3 rounded-md mb-4">
      <div className="text-sm text-gray-500 mb-1">Números seleccionados:</div>
      <div className="flex flex-wrap gap-1">
        {selectedNumbers.map((number) => (
          <span key={number} className="bg-rifa-purple text-white px-2 py-1 text-xs rounded-md">
            {number}
          </span>
        ))}
      </div>
      <div className="mt-2 text-right font-medium">
        Total: ${totalAmount.toFixed(2)}
      </div>
    </div>
  );
};

export default PaymentSummary;
