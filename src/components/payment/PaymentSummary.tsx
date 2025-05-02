
import React from 'react';

interface PaymentSummaryProps {
  selectedNumbers: string[];
  price: number;
  clickedButton?: string; // Add the new prop
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({ selectedNumbers, price, clickedButton }) => {
  const totalPrice = selectedNumbers.length * price;
  
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Resumen de Pago</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Números seleccionados:</div>
        <div className="font-medium text-right">
          {selectedNumbers.join(', ')}
        </div>
        <div>Precio por número:</div>
        <div className="font-medium text-right">
          ${price.toFixed(2)}
        </div>
        <div>Total a pagar:</div>
        <div className="font-medium text-right">
          ${totalPrice.toFixed(2)}
        </div>
        {clickedButton && (
          <>
            <div>Botón presionado:</div>
            <div className="font-medium text-right">
              {clickedButton}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSummary;
