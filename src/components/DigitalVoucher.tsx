
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
import { Share } from 'lucide-react';
import { PaymentFormData } from './PaymentModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DigitalVoucherProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PaymentFormData | null;
  selectedNumbers: string[];
}

const RAFFLE_ID = "fd6bd3bc-d81f-48a9-be58-8880293a0472";

const DigitalVoucher: React.FC<DigitalVoucherProps> = ({ 
  isOpen, 
  onClose, 
  paymentData,
  selectedNumbers
}) => {
  // Generate a random ID for the purchase - moved outside of render conditions
  const purchaseId = React.useMemo(() => Math.random().toString(36).substring(2, 10).toUpperCase(), []);
  
  // Fetch raffle data for the title
  const { data: raffle } = useQuery({
    queryKey: ['raffle', RAFFLE_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('id', RAFFLE_ID)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch organization data for sharing
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Generate QR code data and URL - moved outside of render conditions
  const qrData = React.useMemo(() => {
    if (!paymentData) return '';
    
    return JSON.stringify({
      purchaseId,
      raffleId: RAFFLE_ID,
      numbers: selectedNumbers,
      buyerName: paymentData.buyerName,
      buyerPhone: paymentData.buyerPhone,
      paymentMethod: paymentData.paymentMethod,
      date: new Date().toISOString()
    });
  }, [paymentData, purchaseId, selectedNumbers]);
  
  const qrCodeUrl = React.useMemo(() => {
    if (!qrData) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
  }, [qrData]);

  const handleShareWhatsApp = () => {
    if (!raffle || !organization || !paymentData) return;
    
    const numbersText = selectedNumbers.join(', ');
    const message = `¡Acabo de comprar mis números para la rifa "${raffle.title || 'Rifa'}"! Mis números son: ${numbersText}. ¡Organizado por ${organization.organization_name || 'Romy Rifa'}!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };
  
  if (!paymentData) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-gray-800 dark:text-gray-100">
            ¡Compra Exitosa!
          </DialogTitle>
          <DialogDescription className="text-center">
            Guarde este comprobante para futuras referencias
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{raffle?.title || 'Rifa'}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Comprobante #{purchaseId}</p>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white">
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" width="150" height="150" />}
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Comprador:</span>
              <span className="font-medium dark:text-gray-100">{paymentData.buyerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Teléfono:</span>
              <span className="font-medium dark:text-gray-100">{paymentData.buyerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Método de pago:</span>
              <span className="font-medium dark:text-gray-100">
                {paymentData.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Fecha:</span>
              <span className="font-medium dark:text-gray-100">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Números:</span>
              <div className="flex flex-wrap justify-end gap-1 max-w-[60%]">
                {selectedNumbers.map(number => (
                  <span key={number} className="bg-rifa-purple text-white px-2 py-0.5 text-xs rounded-md">
                    {number}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center italic mb-4">
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
