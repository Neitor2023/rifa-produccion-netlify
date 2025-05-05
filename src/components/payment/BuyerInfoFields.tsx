
import React from 'react';
import { ValidatedBuyerInfo } from '@/types/participant';

interface BuyerInfoFieldsProps {
  buyerData: ValidatedBuyerInfo | null | undefined;
}

const BuyerInfoFields: React.FC<BuyerInfoFieldsProps> = ({ buyerData }) => {
  if (!buyerData) return null;

  return (
    <div className="p-4 rounded-lg bg-gray-200 border border-gray-300 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm mb-4">
      <h3 className="text-base font-medium text-gray-800 dark:text-white mb-2">Información del Comprador (Validada)</h3>
      <div className="grid grid-cols-1 gap-1">
        <div>
          <span className="font-semibold text-gray-800 dark:text-white">Nombre:</span> {buyerData.name || ''}
        </div>
        <div>
          <span className="font-semibold text-gray-800 dark:text-white">Teléfono:</span> {buyerData.phone || ''}
        </div>
        <div>
          <span className="font-semibold text-gray-800 dark:text-white">Cédula:</span> {buyerData.cedula || 'No disponible'}
        </div>
        {buyerData.email && (
          <div>
            <span className="font-semibold text-gray-800 dark:text-white">Email:</span> {buyerData.email}
          </div>
        )}
        {buyerData.direccion && (
          <div>
            <span className="font-semibold text-gray-800 dark:text-white">Dirección:</span> {buyerData.direccion}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerInfoFields;
