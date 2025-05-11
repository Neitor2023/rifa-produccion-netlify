
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PaymentFormData } from '@/components/PaymentModal';

interface VoucherContentProps {
  printRef: React.RefObject<HTMLDivElement>;
  formattedDate: string;
  paymentMethod: string;
  paymentData?: PaymentFormData | null;
  selectedNumbers: string[];
  raffleDetails?: {
    title: string;
    price: number;
    lottery: string;
    dateLottery: string;
  };
  qrData: string;
  textColor: string;
}

const VoucherContent: React.FC<VoucherContentProps> = ({
  printRef,
  formattedDate,
  paymentMethod,
  paymentData,
  selectedNumbers,
  raffleDetails,
  qrData,
  textColor
}) => {
  return (
    <div ref={printRef} className="print-content p-4">
      <Card className="p-6 mb-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
        <div className="flex flex-col space-y-4">
          {/* Raffle Details */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="font-bold text-xl mb-2 text-purple-700 dark:text-purple-400">
              {raffleDetails?.title || 'Rifa'}
            </h3>
            
            {/* Buyer Name */}
            {paymentData?.buyerName && (
              <div className="mb-2 text-md font-semibold text-gray-800 dark:text-gray-200">
                Cliente: {paymentData.buyerName}
              </div>
            )}
            
            {/* Reorganized layout with two columns */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-900 dark:text-gray-200">
              <div>
                <span className="font-semibold">Valor:</span>{' '}
                {raffleDetails?.price?.toFixed(2) || 0}
              </div>
              <div>
                <span className="font-semibold">Fecha Emisión:</span>{' '}
                <div className="text-xs">{formattedDate}</div>
              </div>
              <div>
                <span className="font-semibold">Lotería:</span>{' '}
                {raffleDetails?.lottery || '-'}
              </div>
              <div>
                <span className="font-semibold">Fecha Sorteo:</span>{' '}
                <div className="text-xs">
                  {raffleDetails?.dateLottery || '-'}
                </div>
              </div>
              <div>
                <span className="font-semibold">Método de pago:</span>{' '}
                {paymentMethod}
              </div>
              <div>
                <span className="font-semibold">Núm. seleccionados:</span>{' '}
                {selectedNumbers.length}
              </div>
            </div>
          </div>

          {/* QR Code and Transaction Details in a side-by-side layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* QR Code */}
            <div className="flex justify-center items-center">
              <QRCodeSVG
                value={qrData}
                size={150}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Numbers box */}
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-1">Números comprados:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedNumbers.map((num) => (
                  <span key={num} className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs font-medium">
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Payment proof image when payment is by transfer */}
          {paymentData?.paymentMethod === 'transfer' && paymentData?.paymentProof && typeof paymentData.paymentProof === 'string' && (
            <div className="border-t border-gray-300 dark:border-gray-700 my-2 pt-2">
              <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-300 mb-2">Comprobante de Transferencia</h3>
              <div className="flex justify-center">
                <img 
                  src={paymentData.paymentProof} 
                  alt="Comprobante de pago" 
                  className="w-auto h-auto max-h-[150px] object-contain"
                />
              </div>
            </div>
          )}
          
          <div className="border-t border-gray-300 dark:border-gray-700 mt-2 pt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>Este comprobante valida la compra de los números seleccionados.</p>
            <p>Guárdelo como referencia para futuras consultas.</p>
          </div>
          
          {/* In-modal notification instead of toast */}
          <Alert className="mt-4 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
            <AlertTitle className="text-green-700 dark:text-green-400">Comprobante Disponible</AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-300">
              Su comprobante ha sido generado correctamente. Puede descargarlo o guardarlo como referencia.
            </AlertDescription>
          </Alert>
        </div>
      </Card>
    </div>
  );
};

export default VoucherContent;
