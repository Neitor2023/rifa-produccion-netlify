
import React, { useRef, useContext } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, AlertTriangle, Maximize2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { PaymentFormData } from './PaymentModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/hooks/use-toast';

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
  const { theme } = useTheme();
  const { toast } = useToast();
  
  // Determine text color based on theme
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-800';

  const formattedDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const paymentMethod = paymentData?.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia bancaria';

  const handleDownload = () => {
    const content = printRef.current;
    if (content) {
      // Create a canvas from the content
      const canvas = document.createElement('canvas');
      const scale = 2; // Higher scale for better quality
      
      import('html2canvas').then(({ default: html2canvas }) => {
        html2canvas(content, {
          scale: scale,
          logging: false,
          useCORS: true,
          allowTaint: true
        }).then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `comprobante_${formattedDate.replace(/\s+/g, '_')}.png`;
          link.href = imgData;
          link.click();
          toast({
            title: "¡Descarga exitosa!",
            description: "El comprobante ha sido guardado en tus descargas.",
          });
        });
      }).catch(() => {
        toast({
          title: "Error al descargar",
          description: "No se pudo generar la imagen. Intente nuevamente.",
          variant: "destructive"
        });
      });
    }
  };
  
  // Nueva función para presentar el comprobante a pantalla completa
  const handlePresent = () => {
    const content = printRef.current;
    if (content) {
      import('html2canvas').then(({ default: html2canvas }) => {
        html2canvas(content, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true
        }).then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          
          // Mostrar imagen a pantalla completa (similar a lo que hace handleDownloadImage en RaffleInfo)
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>Comprobante de Pago</title>
                  <style>
                    body {
                      margin: 0;
                      padding: 0;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      background: rgba(0, 0, 0, 0.9);
                      min-height: 100vh;
                      overflow: auto;
                    }
                    img {
                      max-width: 95%;
                      max-height: 95vh;
                      object-fit: contain;
                    }
                    .close-btn {
                      position: fixed;
                      top: 20px;
                      right: 20px;
                      background: white;
                      color: black;
                      border: none;
                      border-radius: 50%;
                      width: 40px;
                      height: 40px;
                      font-size: 20px;
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }
                  </style>
                </head>
                <body>
                  <button class="close-btn" onclick="window.close()">×</button>
                  <img src="${imgData}" alt="Comprobante de pago" />
                </body>
              </html>
            `);
            newWindow.document.close();
          } else {
            toast({
              title: "Error",
              description: "No se pudo abrir la ventana de presentación. Verifique que no tenga bloqueadores de ventanas emergentes activados.",
              variant: "destructive"
            });
          }
        });
      }).catch(() => {
        toast({
          title: "Error al presentar",
          description: "No se pudo generar la imagen para presentación. Intente nuevamente.",
          variant: "destructive"
        });
      });
    }
  };

  const qrData = raffleDetails ? JSON.stringify({
    title: raffleDetails.title,
    numbers: selectedNumbers,
    price: raffleDetails.price,
    lottery: raffleDetails.lottery,
    dateLottery: raffleDetails.dateLottery,
    timestamp: formattedDate
  }) : '';
  
  // If voucher printing is not allowed, show the alert message
  if (!allowVoucherPrint) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] flex flex-col bg-background dark:bg-gray-900 rounded-xl border-0 shadow-xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold text-center text-red-600">
              Importante: Pide al vendedor tu comprobante de pago
            </DialogTitle>
          </DialogHeader>
          
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold">Important Notice</AlertTitle>
            <AlertDescription className={`text-base leading-relaxed ${textColor}`}>
              <p className="mb-4">
                Su comprobante de pago está en revisión, es importante que le exija su comprobante de pago a su vendedor, este es su constancia de reclamo de premios; cualquier novedad comuníquese a los teléfonos de los organizadores que se encuentran al final de la página web.
              </p>
              <Button 
                onClick={onClose} 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                Entendido
              </Button>
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] flex flex-col bg-background dark:bg-gray-900 rounded-xl border-0 shadow-xl">
        <DialogHeader className="pt-6 pb-4">
          <Card className="bg-[#9b87f5] dark:bg-[#7E69AB] shadow-md border-0">
            <div className="py-3 px-4">
              <DialogTitle className="text-2xl font-bold text-center text-white">
                COMPROBANTE DE PAGO
              </DialogTitle>
            </div>
          </Card>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh] overflow-y-auto px-1 bg-background dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700">
          <div ref={printRef} className="print-content p-4">
            <Card className="p-6 mb-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
              <div className="flex flex-col space-y-4">
                {/* Raffle Details */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="font-bold text-xl mb-2 text-purple-700 dark:text-purple-400">
                    {raffleDetails?.title || 'Rifa'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-900 dark:text-gray-200">
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
                      <div>
                        {raffleDetails?.dateLottery || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex justify-center py-4">
                  <QRCodeSVG
                    value={qrData}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                {/* Transaction Details */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formattedDate}</p>
                </div>
                
                <div className="border-t border-gray-300 dark:border-gray-700 my-2 pt-2">
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-300">Detalles de la Transacción</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-400">Método de pago: {paymentMethod}</p>
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-300">Números comprados:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedNumbers.map((num) => (
                        <span key={num} className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs font-medium">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {paymentData?.paymentProof && typeof paymentData.paymentProof === 'string' && (
                  <div className="border-t border-gray-300 dark:border-gray-700 my-2 pt-2">
                    <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-300 mb-2">Comprobante de Pago</h3>
                    <img 
                      src={paymentData.paymentProof} 
                      alt="Comprobante de pago" 
                      className="w-full h-auto object-contain"
                    />
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
        </ScrollArea>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2 mt-4">                    
          <Button 
            type="button" 
            className="bg-purple-700 hover:bg-purple-800 text-white w-full sm:w-auto"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
          
          {/* Nuevo botón "Presentar" */}
          <Button
            type="button"
            variant="outline"
            onClick={handlePresent}
            className="bg-purple-500 hover:bg-purple-600 text-white w-full sm:w-auto mb-2 sm:mb-0"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Presentar
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="bg-gray-400 hover:bg-gray-500 text-white w-full sm:w-auto mb-2 sm:mb-0"
          >
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
          
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DigitalVoucher;
