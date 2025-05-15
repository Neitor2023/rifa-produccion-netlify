
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PaymentFormData } from '@/schemas/paymentFormSchema';

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
  qrUrl: string;
  textColor: string;
  numberId?: string;
  paymentProofImage?: string | null;
}

const VoucherContent: React.FC<VoucherContentProps> = ({
  printRef,
  formattedDate,
  paymentMethod,
  paymentData,
  selectedNumbers,
  raffleDetails,
  qrUrl,
  textColor,
  numberId,
  paymentProofImage
}) => {
  // Calculate total to display
  const totalAmount = raffleDetails ? (raffleDetails.price * selectedNumbers.length) : 0;

  return (
    <div ref={printRef} className="print-content p-1">
      <div className="p-6 mb-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
        <div className="flex flex-col space-y-4">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="font-bold text-xl mb-2 text-purple-700 dark:text-purple-400 text-center">
              {raffleDetails?.title || 'Comprobante de Rifa'}
            </h3>
            
            {raffleDetails?.lottery ? (
              <div className="w-full text-center font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                {raffleDetails.lottery}
              </div>
            ) : null}
            
            {paymentData?.buyerName ? (
              <div className="mb-2 text-md font-semibold text-gray-800 dark:text-gray-200">
                Cliente: {paymentData.buyerName}
              </div>
            ) : null}
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-900 dark:text-gray-200">
              <div>
                <span className="font-semibold">Valor por número:</span> 
                {raffleDetails ? raffleDetails.price.toFixed(2) : '0.00'}
              </div>
              <div>
                <span className="font-semibold">Total a pagar:</span> 
                <span className="font-bold">{totalAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="font-semibold">Fecha Emisión:</span> 
                <div className="text-xs">{formattedDate}</div>
              </div>
              <div>
                <span className="font-semibold">Fecha Sorteo:</span> 
                <div className="text-xs">
                  {raffleDetails?.dateLottery || '-'}
                </div>
              </div>
              <div>
                <span className="font-semibold">Método de pago:</span> 
                {paymentMethod}
              </div>
              <div>
                <span className="font-semibold">Cant. de Núms. seleccionados:</span> 
                {selectedNumbers.length}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-center items-center">
              <div className="h-[150px] w-[150px] bg-white p-2 rounded-lg">
                <QRCodeSVG 
                  value={qrUrl || 'https://rifamax.com'} 
                  size={140}
                />
                {numberId && (
                  <div className="text-center text-xs text-gray-500 mt-1">
                    {numberId.slice(0, 8)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-1">Números comprados:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedNumbers.map(num => (
                  <span 
                    key={num}
                    className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs font-medium"
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Include payment proof image if available */}
          {paymentProofImage && (
            <div className="border-t border-gray-300 dark:border-gray-700 my-2 pt-2">
              <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-300 mb-2">Comprobante de Transferencia</h3>
              <div className="flex justify-center">
                <img 
                  src={paymentProofImage} 
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
        </div>
      </div>
    </div>
  );
};

export default VoucherContent;
