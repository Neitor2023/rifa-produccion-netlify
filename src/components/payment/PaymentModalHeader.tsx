
import React from 'react';

interface PaymentModalHeaderProps {
  children?: React.ReactNode;
}

export const PaymentModalHeader: React.FC<PaymentModalHeaderProps> = ({ children }) => {
  return (
    <div className="pt-6">
      <h2 
        className="text-3xl font-extrabold text-center"
        style={{
          background: "linear-gradient(90deg,#8B5CF6 0%, #D946EF 50%, #1EAEDB 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textFillColor: "transparent",
        }}
      >
        Completa tu información en pantalla
      </h2>
      <p className="text-center mt-2 text-base text-gray-600 dark:text-gray-100/80">
        Completa tu información para finalizar la compra
      </p>
      {children}
    </div>
  );
};
