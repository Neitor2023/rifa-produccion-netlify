
import React from 'react';
import { ValidatedBuyerInfo } from '@/types/participant';

interface BuyerInfoFieldsProps {
  buyerData: ValidatedBuyerInfo | null | undefined;
}

const BuyerInfoFields: React.FC<BuyerInfoFieldsProps> = ({ buyerData }) => {
  if (!buyerData) return null;

  console.log("BuyerInfoFields.tsx:10 - Mostrando información del comprador:", buyerData);

  return (
    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-50 text-sm mb-4">
      <h3 className="font-medium mb-2">Información del Comprador (Validada)</h3>
      <div className="grid grid-cols-1 gap-1">
        <div>
          <span className="font-semibold">Nombre:</span> {buyerData.name || ''}
        </div>
        <div>
          <span className="font-semibold">Teléfono:</span> {buyerData.phone || ''}
        </div>
        <div>
          <span className="font-semibold">Cédula:</span> {buyerData.cedula || 'No disponible'}
        </div>
        {buyerData.direccion && (
          <div>
            <span className="font-semibold">Dirección:</span> {buyerData.direccion}
          </div>
        )}   
        {buyerData.email && (
          <div>
            <span className="font-semibold">Correo:</span> {buyerData.email}
          </div>
        )}              
      </div>
    </div>
  );
};

export default BuyerInfoFields;
