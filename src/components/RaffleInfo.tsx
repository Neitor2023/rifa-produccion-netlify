
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
    <div className="mb-6 space-y-4">
      <h2 className="text-lg font-semibold mb-4">
        Detalles de la Rifa
      </h2>
      
      <Card>
        <CardContent className="p-4">
          <div>
            <span className="font-bold text-sm">Nombre:</span>
            <p className="font-bold">{title}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div>
            <span className="font-bold text-sm">Precio:</span>
            <p className="font-bold">{priceInfo}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start">
            <CalendarIcon className="h-4 w-4 mt-0.5 mr-1" />
            <div>
              <span className="font-bold text-sm">Fecha del Sorteo:</span>
              <p className="font-bold">{drawInfo}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {details && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start">
              <InfoIcon className="h-4 w-4 mt-0.5 mr-1" />
              <div>
                <span className="font-bold text-sm">Detalles:</span>
                <div className="font-bold whitespace-pre-line">
                  {formatText(details)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {instructions && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start">
              <InfoIcon className="h-4 w-4 mt-0.5 mr-1" />
              <div>
                <span className="font-bold text-sm">Instrucciones de Pago:</span>
                <div className="font-bold whitespace-pre-line">
                  {formatText(instructions)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RaffleInfo;
