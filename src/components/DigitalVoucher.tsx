
import React, { useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { PaymentFormData } from './PaymentModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QRCode from 'qrcode.react';

interface DigitalVoucherProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData?: PaymentFormData | null;
  selectedNumbers: string[];
  allowVoucherPrint?: boolean;
  raffleDetails?: {
    title: string;
    price: number;
    lottery: string;
    dateLottery: string;
  };
}

const DigitalVoucher: React.FC<DigitalVoucherProps> = ({ 
  isOpen, 
  onClose, 
  paymentData,
  selectedNumbers,
  allowVoucherPrint = true,
  raffleDetails
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const formattedDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const paymentMethod = paymentData?.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia bancaria';
  
  // Generate QR code data
  const qrData = {
    title: raffleDetails?.title || '',
    numbers: selectedNumbers,
    price: raffleDetails?.price || 0,
    lottery: raffleDetails?.lottery || '',
    date: raffleDetails?.dateLottery || ''
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (content) {
      const originalContents = document.body.innerHTML;
      const printContents = content.innerHTML;
      
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-violet-700 to-purple-700 text-white py-3 rounded-lg shadow-lg">
            COMPROBANTE DE PAGO
          </DialogTitle>
        </DialogHeader>
        
        {!allowVoucherPrint && (
          <Alert className="mb-4 bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
            <AlertDescription className="text-sm">
              Este vendedor no ha habilitado la impresión automática. Solicita el comprobante directamente al vendedor.
            </AlertDescription>
          </Alert>
        )}
        
        <ScrollArea className="max-h-[70vh]">
          <div ref={printRef} className="print-content p-4">
            <Card className="p-6 mb-4 bg-white border border-gray-300">
              <div className="flex flex-col space-y-4">
                {/* QR Code */}
                <div className="flex justify-center mb-4">
                  <QRCode 
                    value={JSON.stringify(qrData)}
                    size={128}
                    level="H"
                    className="p-2 bg-white rounded shadow-sm"
                  />
                </div>

                {/* Raffle Details */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-bold text-xl mb-2 text-purple-700">
                    {raffleDetails?.title || 'Rifa'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-semibold">Valor:</span>{' '}
                      {raffleDetails?.price?.toFixed(2) || 0}
                    </div>
                    <div>
                      <span className="font-semibold">Lotería:</span>{' '}
                      {raffleDetails?.lottery || '-'}
                    </div>
                    <div>
                      <span className="font-semibold">Fecha Sorteo:</span>{' '}
                      {raffleDetails?.dateLottery || '-'}
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">{formattedDate}</p>
                </div>
                
                <div className="border-t border-gray-300 my-2 pt-2">
                  <h3 className="font-semibold text-sm text-gray-800">Detalles de la Transacción</h3>
                  <p className="text-sm">Método de pago: {paymentMethod}</p>
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Números comprados:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedNumbers.map((num) => (
                        <span key={num} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {paymentData?.paymentProof && typeof paymentData.paymentProof === 'string' && (
                  <div className="border-t border-gray-300 my-2 pt-2">
                    <h3 className="font-semibold text-sm text-gray-800 mb-2">Comprobante de Pago</h3>
                    <img 
                      src={paymentData.paymentProof} 
                      alt="Comprobante de pago" 
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}
                
                <div className="border-t border-gray-300 mt-2 pt-4 text-center text-xs text-gray-500">
                  <p>Este comprobante valida la compra de los números seleccionados.</p>
                  <p>Guárdelo como referencia para futuras consultas.</p>
                </div>
              </div>
            </Card>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="mt-3 sm:mt-0"
          >
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
          
          {allowVoucherPrint && (
            <Button 
              type="button" 
              className="bg-purple-700 hover:bg-purple-800"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DigitalVoucher;
