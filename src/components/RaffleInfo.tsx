
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarClock, CreditCard, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RaffleInfoProps {
  description: string;
  lottery: string;
  dateLottery: string;
  paymentInstructions: string;
  price: number;
  currency: string;
}

// Function to preserve line breaks in text
const formatText = (text: string) => {
  if (!text) return null;
  
  return text.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < text.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));
};

const RaffleInfo: React.FC<RaffleInfoProps> = ({
  description,
  lottery,
  dateLottery,
  paymentInstructions,
  price,
  currency
}) => {
  const formattedDate = dateLottery
    ? format(new Date(dateLottery), "d 'de' MMMM, yyyy", { locale: es })
    : 'Fecha por definir';
  
  return (
    <Card className="mb-8 bg-white dark:bg-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
          <Info className="h-5 w-5 mr-2 text-rifa-purple" />
          Información
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-base font-medium mb-1 text-gray-700 dark:text-gray-300">Descripción</h3>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
            {formatText(description)}
          </CardDescription>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-base font-medium mb-1 text-gray-700 dark:text-gray-300 flex items-center">
            <CalendarClock className="h-4 w-4 mr-1 text-blue-500" />
            Sorteo
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {lottery} - {formattedDate}
          </p>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-base font-medium mb-1 text-gray-700 dark:text-gray-300 flex items-center">
            <CreditCard className="h-4 w-4 mr-1 text-green-500" />
            Precio
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currency} {price.toFixed(2)}
          </p>
        </div>
        
        {paymentInstructions && (
          <>
            <Separator />
            <div>
              <h3 className="text-base font-medium mb-1 text-gray-700 dark:text-gray-300">
                Instrucciones de pago
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {formatText(paymentInstructions)}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RaffleInfo;
