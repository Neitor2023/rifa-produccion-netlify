
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, Ticket, CalendarDays, DollarSign } from 'lucide-react';

interface RaffleInfoProps {
  description: string;
  lottery?: string;
  dateLottery?: string;
  paymentInstructions?: string;
  price: number;
  currency: string;
}

const RaffleInfo: React.FC<RaffleInfoProps> = ({
  description,
  lottery,
  dateLottery,
  paymentInstructions,
  price,
  currency,
}) => {
  return (
    <Card className="mb-8 bg-white dark:bg-gray-800">
      <CardContent className="p-5 space-y-4">
        {/* Raffle description */}
        <div>
          <h3 className="flex items-center font-medium mb-2 text-gray-800 dark:text-gray-100">
            <Info className="h-5 w-5 mr-2 text-rifa-purple" />
            Descripción
          </h3>
          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{description}</p>
        </div>
        
        {/* Lottery info */}
        {lottery && (
          <div>
            <h3 className="flex items-center font-medium mb-2 text-gray-800 dark:text-gray-100">
              <Ticket className="h-5 w-5 mr-2 text-rifa-purple" />
              Lotería
            </h3>
            <p className="text-gray-600 dark:text-gray-300">{lottery}</p>
          </div>
        )}
        
        {/* Raffle date */}
        {dateLottery && (
          <div>
            <h3 className="flex items-center font-medium mb-2 text-gray-800 dark:text-gray-100">
              <CalendarDays className="h-5 w-5 mr-2 text-rifa-purple" />
              Fecha del Sorteo
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {new Date(dateLottery).toLocaleDateString()}
            </p>
          </div>
        )}
        
        {/* Payment instructions */}
        {paymentInstructions && (
          <div>
            <h3 className="flex items-center font-medium mb-2 text-gray-800 dark:text-gray-100">
              <DollarSign className="h-5 w-5 mr-2 text-rifa-purple" />
              Instrucciones de Pago
            </h3>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{paymentInstructions}</p>
          </div>
        )}
        
        {/* Price */}
        <div>
          <h3 className="flex items-center font-medium mb-2 text-gray-800 dark:text-gray-100">
            <DollarSign className="h-5 w-5 mr-2 text-rifa-purple" />
            Precio
          </h3>
          <p className="text-lg font-semibold text-rifa-purple dark:text-rifa-lightPurple">
            {price} {currency}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RaffleInfo;
