
import React, { useState } from 'react';
import RaffleHeader from '@/components/RaffleHeader';
import PrizeCarousel from '@/components/PrizeCarousel';
import PrizeDetailModal from '@/components/PrizeDetailModal';
import OrganizerInfo from '@/components/OrganizerInfo';
import NumberGrid from '@/components/NumberGrid';
import PaymentModal from '@/components/PaymentModal';
import DigitalVoucher from '@/components/DigitalVoucher';

import { 
  mockOrganization, 
  mockRaffle, 
  mockPrizes, 
  mockPrizeImages, 
  mockRaffleNumbers,
  mockRaffleSeller,
  mockSeller,
  Prize,
  RaffleNumber
} from '@/lib/constants';
import { PaymentFormData } from '@/components/PaymentModal';
import { Card, CardContent } from '@/components/ui/card';
import { User, Phone } from 'lucide-react';
import { toast } from 'sonner';

const VentaBoletos: React.FC = () => {
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [raffleNumbers, setRaffleNumbers] = useState<RaffleNumber[]>(mockRaffleNumbers);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null);
  
  const handleViewPrizeDetails = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsPrizeModalOpen(true);
  };
  
  const handleReserveNumbers = (numbers: string[]) => {
    // In a real app, this would call an API to update the numbers' status
    const updatedNumbers = raffleNumbers.map(num => {
      if (numbers.includes(num.number) && num.status === 'available') {
        return { ...num, status: 'reserved', seller_id: mockSeller.id };
      }
      return num;
    });
    
    setRaffleNumbers(updatedNumbers);
    setSelectedNumbers([]);
    toast.success(`${numbers.length} número(s) apartados exitosamente`);
  };
  
  const handleProceedToPayment = (numbers: string[]) => {
    setSelectedNumbers(numbers);
    setIsPaymentModalOpen(true);
  };
  
  const handleCompletePayment = (data: PaymentFormData) => {
    // In a real app, this would call an API to update the payment status
    const updatedNumbers = raffleNumbers.map(num => {
      if (selectedNumbers.includes(num.number) && (num.status === 'available' || num.status === 'reserved')) {
        return {
          ...num,
          status: 'sold',
          seller_id: mockSeller.id,
          buyer_name: data.buyerName,
          buyer_phone: data.buyerPhone,
          payment_method: data.paymentMethod,
          payment_proof: data.paymentProof || null,
          payment_date: new Date().toISOString()
        };
      }
      return num;
    });
    
    setRaffleNumbers(updatedNumbers);
    setPaymentData(data);
    setIsPaymentModalOpen(false);
    setIsVoucherOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <RaffleHeader organization={mockOrganization} />
      
      <div className="container px-4 py-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {mockRaffle.title}
        </h1>
        
        <PrizeCarousel 
          prizes={mockPrizes} 
          onViewDetails={handleViewPrizeDetails}
        />
        
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-gray-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">{mockSeller.name}</h3>
                <div className="flex items-center text-gray-600 text-sm mt-1">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>{mockSeller.phone_number}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Vendedor ID: {mockSeller.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <OrganizerInfo organization={mockOrganization} />
        
        <NumberGrid 
          numbers={raffleNumbers}
          raffleSeller={mockRaffleSeller}
          onReserve={handleReserveNumbers}
          onProceedToPayment={handleProceedToPayment}
        />
      </div>
      
      <PrizeDetailModal 
        isOpen={isPrizeModalOpen}
        onClose={() => setIsPrizeModalOpen(false)}
        prize={selectedPrize}
        prizeImages={mockPrizeImages}
      />
      
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedNumbers={selectedNumbers}
        price={mockRaffle.price_per_number}
        onComplete={handleCompletePayment}
      />
      
      <DigitalVoucher 
        isOpen={isVoucherOpen}
        onClose={() => setIsVoucherOpen(false)}
        paymentData={paymentData}
        selectedNumbers={selectedNumbers}
      />
    </div>
  );
};

export default VentaBoletos;
