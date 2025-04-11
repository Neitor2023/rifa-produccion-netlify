import React, { useState, useEffect } from 'react';
import RaffleHeader from '@/components/RaffleHeader';
import PrizeCarousel from '@/components/PrizeCarousel';
import PrizeDetailModal from '@/components/PrizeDetailModal';
import OrganizerInfo from '@/components/OrganizerInfo';
import NumberGrid from '@/components/NumberGrid';
import PaymentModal from '@/components/PaymentModal';
import DigitalVoucher from '@/components/DigitalVoucher';
import DarkModeToggle from '@/components/DarkModeToggle';
import RaffleInfo from '@/components/RaffleInfo';
import SellerInfo from '@/components/SellerInfo';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/components/PaymentModal';
import { Prize, PrizeImage } from '@/lib/constants';

// Define the seller and raffle IDs as constants
const SELLER_ID = "0102030405";
const RAFFLE_ID = "fd6bd3bc-d81f-48a9-be58-8880293a0472";

// Type to handle both url_image and image_url fields
type ExtendedPrizeImage = PrizeImage & {
  image_url?: string;
};

const VentaBoletos: React.FC = () => {
  const [selectedPrize, setSelectedPrize] = useState<any | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null);
  const [maxNumbersAllowed, setMaxNumbersAllowed] = useState<number>(33);
  
  // Fetch seller data
  const { data: seller, isLoading: isLoadingSeller } = useQuery({
    queryKey: ['seller', SELLER_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('cedula', SELLER_ID)
        .single();
      
      if (error) throw error;
      return data;
    }
  });
  
  // Fetch raffle data
  const { data: raffle, isLoading: isLoadingRaffle } = useQuery({
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
  
  // Fetch prizes data
  const { data: prizes, isLoading: isLoadingPrizes } = useQuery({
    queryKey: ['prizes', RAFFLE_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prizes')
        .select('*')
        .eq('raffle_id', RAFFLE_ID)
        .order('created_at');
      
      if (error) throw error;
      return data;
    }
  });
  
  // Fetch prize images
  const { data: prizeImages, isLoading: isLoadingPrizeImages } = useQuery({
    queryKey: ['prizeImages', prizes?.map(p => p.id)],
    queryFn: async () => {
      if (!prizes?.length) return [];
      
      const { data, error } = await supabase
        .from('raffle_prize_images')
        .select('*')
        .in('prize_id', prizes.map(p => p.id));
      
      if (error) throw error;
      
      // Transform the data to include url_image field for compatibility
      return (data || []).map(img => ({
        ...img,
        url_image: img.image_url // Map image_url to url_image
      })) as PrizeImage[];
    },
    enabled: !!prizes?.length
  });
  
  // Fetch organization data
  const { data: organization, isLoading: isLoadingOrganization } = useQuery({
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
  
  // Fetch raffle numbers
  const { data: raffleNumbers, isLoading: isLoadingRaffleNumbers, refetch: refetchRaffleNumbers } = useQuery({
    queryKey: ['raffleNumbers', RAFFLE_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raffle_numbers')
        .select('*')
        .eq('raffle_id', RAFFLE_ID)
        .lte('number', 99);
      
      if (error) throw error;
      return data || [];
    }
  });
  
  // Fetch raffle seller data to get max numbers allowed
  const { data: raffleSeller } = useQuery({
    queryKey: ['raffleSeller', RAFFLE_ID, seller?.id],
    queryFn: async () => {
      if (!seller?.id) return null;
      
      const { data, error } = await supabase
        .from('raffle_sellers')
        .select('*')
        .eq('raffle_id', RAFFLE_ID)
        .eq('seller_id', seller.id)
        .single();
      
      if (error) {
        console.error('Error fetching raffle seller:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!seller?.id
  });
  
  // Update max numbers allowed when raffle seller data is available
  useEffect(() => {
    if (raffleSeller?.cant_max) {
      setMaxNumbersAllowed(raffleSeller.cant_max);
    }
  }, [raffleSeller]);
  
  // Function to format raffle numbers for the grid component
  const formatNumbersForGrid = () => {
    const formattedNumbers = [];
    
    for (let i = 0; i < 100; i++) {
      const paddedNumber = i.toString().padStart(2, '0');
      const existingNumber = raffleNumbers?.find(n => n.number === parseInt(paddedNumber));
      
      formattedNumbers.push({
        id: existingNumber?.id || `num-${paddedNumber}`,
        raffle_id: RAFFLE_ID,
        number: paddedNumber,
        status: existingNumber?.status || 'available',
        seller_id: existingNumber?.seller_id || null,
        buyer_name: existingNumber?.participant_id ? 'Comprador' : null,
        buyer_phone: null,
        payment_method: null,
        payment_proof: existingNumber?.payment_proof || null,
        payment_date: null
      });
    }
    
    return formattedNumbers;
  };
  
  const handleViewPrizeDetails = (prize: any) => {
    setSelectedPrize(prize);
    setIsPrizeModalOpen(true);
  };
  
  const handleReserveNumbers = async (numbers: string[]) => {
    if (!seller?.id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    
    try {
      // Update the status to 'reserved' in the raffle_numbers table
      const updatePromises = numbers.map(async (numStr) => {
        const num = parseInt(numStr);
        const existingNumber = raffleNumbers?.find(n => n.number === num);
        
        if (existingNumber) {
          const { error } = await supabase
            .from('raffle_numbers')
            .update({ 
              status: 'reserved', 
              seller_id: seller.id,
              reservation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
            })
            .eq('id', existingNumber.id);
          
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('raffle_numbers')
            .insert({ 
              raffle_id: RAFFLE_ID, 
              number: num, 
              status: 'reserved', 
              seller_id: seller.id,
              reservation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
            });
          
          if (error) throw error;
        }
      });
      
      await Promise.all(updatePromises);
      
      // Refetch raffle numbers to update the UI
      await refetchRaffleNumbers();
      
      setSelectedNumbers([]);
      toast.success(`${numbers.length} número(s) apartados exitosamente`);
    } catch (error) {
      console.error('Error reserving numbers:', error);
      toast.error('Error al apartar números');
    }
  };
  
  const handleProceedToPayment = (numbers: string[]) => {
    setSelectedNumbers(numbers);
    setIsPaymentModalOpen(true);
  };
  
  const handleCompletePayment = async (data: PaymentFormData) => {
    if (!seller?.id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    
    try {
      // If payment proof is provided, upload it to Supabase Storage
      let paymentProofUrl = null;
      
      if (data.paymentProof && data.paymentProof instanceof File) {
        const fileName = `${RAFFLE_ID}_${Date.now()}_${data.paymentProof.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment_proofs')
          .upload(fileName, data.paymentProof);
        
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('payment_proofs')
          .getPublicUrl(fileName);
          
        paymentProofUrl = urlData.publicUrl;
      }
      
      // Check if there's a participant with this phone number
      let participantId = null;
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id')
        .eq('phone', data.buyerPhone)
        .eq('raffle_id', RAFFLE_ID)
        .maybeSingle();
      
      if (existingParticipant) {
        participantId = existingParticipant.id;
      } else {
        // Create a new participant
        const { data: newParticipant, error: participantError } = await supabase
          .from('participants')
          .insert({
            name: data.buyerName,
            phone: data.buyerPhone,
            email: '', // Required field but not collected in form
            raffle_id: RAFFLE_ID,
            seller_id: seller.id
          })
          .select('id')
          .single();
        
        if (participantError) throw participantError;
        
        participantId = newParticipant.id;
      }
      
      // Update the raffle numbers
      const updatePromises = selectedNumbers.map(async (numStr) => {
        const num = parseInt(numStr);
        const existingNumber = raffleNumbers?.find(n => n.number === num);
        
        if (existingNumber) {
          const { error } = await supabase
            .from('raffle_numbers')
            .update({ 
              status: 'sold', 
              seller_id: seller.id,
              participant_id: participantId,
              payment_proof: paymentProofUrl,
              payment_approved: true,
              reservation_expires_at: null
            })
            .eq('id', existingNumber.id);
          
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('raffle_numbers')
            .insert({ 
              raffle_id: RAFFLE_ID, 
              number: num, 
              status: 'sold', 
              seller_id: seller.id,
              participant_id: participantId,
              payment_proof: paymentProofUrl,
              payment_approved: true
            });
          
          if (error) throw error;
        }
      });
      
      await Promise.all(updatePromises);
      
      // Refetch raffle numbers to update the UI
      await refetchRaffleNumbers();
      
      // Set the payment data for the voucher
      setPaymentData({
        ...data,
        paymentProof: paymentProofUrl
      });
      
      setIsPaymentModalOpen(false);
      setIsVoucherOpen(true);
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.error('Error al completar el pago');
    }
  };

  // Show loading state if data is still loading
  if (isLoadingSeller || isLoadingRaffle || isLoadingPrizes || isLoadingOrganization || isLoadingRaffleNumbers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin h-12 w-12 text-rifa-purple" />
        <span className="ml-2 text-xl font-medium dark:text-white">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="container px-4 py-6 max-w-3xl mx-auto">
        {/* 1. Logo and organization name */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            {organization && <RaffleHeader organization={organization} />}
          </div>
          <DarkModeToggle />
        </div>
        
        {/* 2. Raffle title */}
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
          {raffle?.title || 'Cargando...'}
        </h1>
        
        {/* 3. Prize carousel (only image) */}
        {prizes && (
          <PrizeCarousel 
            prizes={prizes} 
            onViewDetails={handleViewPrizeDetails}
          />
        )}
        
        {/* 4. Number grid */}
        {raffleNumbers && (
          <div className="mb-8">
            <NumberGrid 
              numbers={formatNumbersForGrid()}
              raffleSeller={{
                id: raffleSeller?.id || 'default',
                raffle_id: RAFFLE_ID,
                seller_id: seller?.id || SELLER_ID,
                active: true,
                cant_max: maxNumbersAllowed
              }}
              onReserve={handleReserveNumbers}
              onProceedToPayment={handleProceedToPayment}
            />
          </div>
        )}
        
        {/* 6-10. Raffle information */}
        {raffle && (
          <RaffleInfo
            description={raffle.description}
            lottery={raffle.lottery}
            dateLottery={raffle.date_lottery}
            paymentInstructions={raffle.payment_instructions}
            price={raffle.price}
            currency={raffle.currency}
          />
        )}
        
        {/* 11. Seller information */}
        {seller && (
          <SellerInfo
            name={seller.name}
            phone={seller.phone}
            avatar={seller.avatar}
            id={seller.id}
          />
        )}
        
        {/* 12. Organizer info */}
        {organization && <OrganizerInfo organization={organization} />}
        
        {/* 13. Legal note */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 italic mb-8">
          Las plataformas de redes sociales no están asociadas a esta rifa.
        </div>
      </div>
      
      {/* Modals */}
      <PrizeDetailModal 
        isOpen={isPrizeModalOpen}
        onClose={() => setIsPrizeModalOpen(false)}
        prize={selectedPrize}
        prizeImages={(prizeImages || []) as PrizeImage[]}
      />
      
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedNumbers={selectedNumbers}
        price={raffle?.price || 0}
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
