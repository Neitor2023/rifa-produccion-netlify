
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, InfoIcon } from 'lucide-react';

interface RaffleInfoProps {
  title: string;
  details: string;
  drawInfo: string;
  instructions?: string;
  priceInfo: string;
}

const RaffleInfo: React.FC<RaffleInfoProps> = ({ 
  title, 
  details, 
  drawInfo, 
  instructions, 
  priceInfo 
}) => {
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
    <Card className="mb-6 bg-white dark:bg-gray-800">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Detalles de la Rifa
        </h2>
        
        <div className="space-y-3">
          <div>
            <span className="text-gray-600 dark:text-gray-400 font-bold text-sm">Nombre:</span>
            <p className="text-gray-800 dark:text-gray-200 font-bold">{title}</p>
          </div>
          
          <div>
            <span className="text-gray-600 dark:text-gray-400 font-bold text-sm">Precio:</span>
            <p className="text-gray-800 dark:text-gray-200 font-bold">{priceInfo}</p>
          </div>
          
          <div className="flex items-start">
            <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 mr-1" />
            <div>
              <span className="text-gray-600 dark:text-gray-400 font-bold text-sm">Fecha del Sorteo:</span>
              <p className="text-gray-800 dark:text-gray-200 font-bold">{drawInfo}</p>
            </div>
          </div>
          
          {details && (
            <div className="flex items-start">
              <InfoIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 mr-1" />
              <div>
                <span className="text-gray-600 dark:text-gray-400 font-bold text-sm">Detalles:</span>
                <div className="text-gray-800 dark:text-gray-200 font-bold whitespace-pre-line">
                  {formatText(details)}
                </div>
              </div>
            </div>
          )}
          
          {instructions && (
            <div className="flex items-start">
              <InfoIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 mr-1" />
              <div>
                <span className="text-gray-600 dark:text-gray-400 font-bold text-sm">Instrucciones de Pago:</span>
                <div className="text-gray-800 dark:text-gray-200 font-bold whitespace-pre-line">
                  {formatText(instructions)}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RaffleInfo;
