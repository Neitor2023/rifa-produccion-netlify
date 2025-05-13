
import React from 'react';

interface PrizeDescriptionProps {
  description: string;
  detail?: string | null;
}

const PrizeDescription: React.FC<PrizeDescriptionProps> = ({ description, detail }) => {
  // Function to preserve line breaks in text
  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };
  
  return (
    <div className="px-2 pb-4">
      {description && (
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">DescripciónQQ</h3>
          <div className="text-base font-bold text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">
            {formatText(description)}
          </div>
        </div>
      )}
      
      {detail && (
        <div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Detalles</h3>
          <div className="text-base font-bold text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">
            {formatText(detail)}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrizeDescription;
