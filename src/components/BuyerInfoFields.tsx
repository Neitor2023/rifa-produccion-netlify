
import React from 'react';
import { ValidatedBuyerInfo } from '@/types/participant';

interface BuyerInfoFieldsProps {
  buyerData: ValidatedBuyerInfo;
}

// This component shows read-only buyer data when we have validated information
const BuyerInfoFields: React.FC<BuyerInfoFieldsProps> = ({ buyerData }) => {
  console.log("▶️ BuyerInfoFields.tsx: Mostrando campos de solo lectura para:", buyerData);
  
  return (
    <div className="mb-6">
      <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Información del Comprador</h3>
      <div className="grid grid-cols-1 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <div className="space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">Nombre</p>
          <p className="font-medium">{buyerData.name || 'No disponible'}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">Teléfono</p>
          <p className="font-medium">{buyerData.phone || 'No disponible'}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">Cédula/DNI</p>
          <p className="font-medium">{buyerData.cedula || 'No disponible'}</p>
        </div>
      </div>
    </div>
  );
};

export default BuyerInfoFields;
