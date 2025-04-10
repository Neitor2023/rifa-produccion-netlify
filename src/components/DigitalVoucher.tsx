
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Share } from 'lucide-react';
import { PaymentFormData } from './PaymentModal';
import { mockRaffle, mockOrganization } from '@/lib/constants';

interface DigitalVoucherProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PaymentFormData | null;
  selectedNumbers: string[];
}

const DigitalVoucher: React.FC<DigitalVoucherProps> = ({ 
  isOpen, 
  onClose, 
  paymentData,
  selectedNumbers
}) => {
  if (!paymentData) return null;
  
  const handleShareWhatsApp = () => {
    const numbersText = selectedNumbers.join(', ');
    const message = `¡Acabo de comprar mis números para la rifa "${mockRaffle.title}"! Mis números son: ${numbersText}. ¡Organizado por ${mockOrganization.organization_name}!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };
  
  // Generate a random ID for the purchase
  const purchaseId = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const qrData = JSON.stringify({
    purchaseId,
    numbers: selectedNumbers,
    buyerName: paymentData.buyerName,
    buyerPhone: paymentData.buyerPhone,
    paymentMethod: paymentData.paymentMethod,
    date: new Date().toISOString()
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-gray-800">
            ¡Compra Exitosa!
          </DialogTitle>
          <DialogDescription className="text-center">
            Guarde este comprobante para futuras referencias
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg text-gray-800">{mockRaffle.title}</h3>
            <p className="text-gray-500 text-sm">Comprobante #{purchaseId}</p>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="p-2 border border-gray-200 rounded-md">
              {/* In a real app, this would generate an actual QR code */}
              <QrCode size={150} className="text-gray-800" />
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">Comprador:</span>
              <span className="font-medium">{paymentData.buyerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Teléfono:</span>
              <span className="font-medium">{paymentData.buyerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Método de pago:</span>
              <span className="font-medium">
                {paymentData.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha:</span>
              <span className="font-medium">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Números:</span>
              <div className="flex flex-wrap justify-end gap-1 max-w-[60%]">
                {selectedNumbers.map(number => (
                  <span key={number} className="bg-rifa-purple text-white px-2 py-0.5 text-xs rounded-md">
                    {number}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 text-center italic mb-4">
            Las plataformas de redes sociales no están asociadas a esta rifa.
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto border-rifa-purple text-rifa-purple hover:bg-rifa-purple hover:text-white"
            onClick={handleShareWhatsApp}
          >
            <Share className="h-4 w-4 mr-2" />
            Compartir por WhatsApp
          </Button>
          
          <Button 
            className="w-full sm:w-auto bg-rifa-purple hover:bg-rifa-darkPurple"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DigitalVoucher;
