
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, InfoIcon, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SafeImage from '@/components/SafeImage';

interface RaffleInfoProps {
  title: string;
  details: string;
  drawInfo: string;
  instructions?: string;
  priceInfo: string;
  copyWriting?: string;
  sellerAdvertisingImage?: string;
}

const RaffleInfo: React.FC<RaffleInfoProps> = ({ 
  title, 
  details, 
  drawInfo, 
  instructions, 
  priceInfo,
  copyWriting,
  sellerAdvertisingImage
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
  
  const handleCopyText = () => {
    if (copyWriting) {
      navigator.clipboard.writeText(copyWriting)
        .then(() => {
          toast.success('Texto copiado al portapapeles');
        })
        .catch(() => {
          toast.error('No se pudo copiar el texto');
        });
    }
  };
  
  const handleDownloadImage = () => {
    if (sellerAdvertisingImage) {
      const link = document.createElement('a');
      link.href = sellerAdvertisingImage;
      link.download = 'imagen-publicitaria.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
      
      {/* Copy writing section with copy button */}
      {copyWriting && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start">
              <InfoIcon className="h-4 w-4 mt-0.5 mr-1" />
              <div className="flex-grow">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">Mensaje para compartir:</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCopyText}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="font-bold whitespace-pre-line mt-1">
                  {formatText(copyWriting)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Seller advertising image with download button */}
      {sellerAdvertisingImage && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm">Imagen promocional:</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDownloadImage}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2">
              <SafeImage
                src={sellerAdvertisingImage}
                alt="Imagen promocional"
                className="w-full h-auto rounded-md"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RaffleInfo;
