
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle2, CreditCard, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface RaffleSeller {
  id: string;
  raffle_id: string;
  seller_id: string;
  active: boolean;
  cant_max: number;
}

interface NumberGridControlsProps {
  selectedNumbers: string[];
  raffleSeller: RaffleSeller;
  onClearSelection: () => void;
  onReserve: () => void;
  onPayReserved: () => void;
  onProceedToPayment: () => void;
}

export const NumberGridControls: React.FC<NumberGridControlsProps> = ({
  selectedNumbers,
  raffleSeller,
  onClearSelection,
  onReserve,
  onPayReserved,
  onProceedToPayment
}) => {
  return (
    <Card className="p-3 sm:p-4 mb-4 bg-white dark:bg-gray-800">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          <span>Seleccionados:</span> {selectedNumbers.length} de {raffleSeller.cant_max}
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={onClearSelection}
          >
            <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Limpiar</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-600"
            onClick={onReserve}
          >
            <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Apartar</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500 bg-amber-500 text-white hover:bg-amber-600 dark:border-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
            onClick={onPayReserved}
          >
            <Wallet className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">💰 Pagar Apartados</span>
          </Button>
          
          <Button
            size="sm"
            className="bg-rifa-purple hover:bg-rifa-darkPurple text-white dark:bg-purple-700 dark:hover:bg-purple-800"
            onClick={onProceedToPayment}
          >
            <CreditCard className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Pagar</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
