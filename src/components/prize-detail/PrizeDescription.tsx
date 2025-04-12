
import React from 'react';

interface PrizeDescriptionProps {
  description: string;
  detail?: string;
}

const PrizeDescription: React.FC<PrizeDescriptionProps> = ({ description, detail }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</h3>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{description}</p>
      </div>
      
      {detail && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Detalles</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{detail}</p>
        </div>
      )}
    </div>
  );
};

export default PrizeDescription;
