
import React from 'react';

interface PaymentSummaryProps {
  selectedNumbers: string[];
  price: number;
  clickedButton?: string;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({ selectedNumbers, price, clickedButton }) => {
  // All content has been removed as requested
  return (
    <div className="space-y-2">
      {/* The summary content has been removed as per requirements */}
    </div>
  );
};

export default PaymentSummary;
