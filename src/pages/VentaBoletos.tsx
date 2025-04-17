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
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';

import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Prize, PrizeImage, Organization } from '@/lib/constants';

const SELLER_ID = "0102030405";
const RAFFLE_ID = "fd6bd3bc-d81f-48a9-be58-8880293a0472";

const VentaBoletos: React.FC = () => {
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [maxNumbersAllowed, setMaxNumbersAllowed] = useState<number>(33);
  const [organizationData, setOrganizationData] = useState<Organization | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [allowVoucherPrint, setAllowVoucherPrint] = useState(true);
  
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
  
  const { data: raffle, isLoading: isLoadingRaffle } = useQuery({
    queryKey: ['raffle', RAFFLE_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('id', RAFFLE_ID)
        .single();
      
      if (error) throw error;
      
      if (data?.modal === 'programador') {
        setDebugMode(true);
      }
      
      return data;
    }
  });
  
  const { data: prizes, isLoading: isLoadingPrizes } = useQuery({
    queryKey: ['prizes', RAFFLE_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prizes')
        .select('*')
        .eq('raffle_id', RAFFLE_ID)
        .order('created_at');
      
      if (error) throw error;
      return data || [];
    }
  });
  
  const { data: prizeImages, isLoading: isLoadingPrizeImages } = useQuery({
    queryKey: ['prizeImages', prizes?.map(p => p.id)],
    queryFn: async () => {
      if (!prizes?.length) return [];
      
      const { data, error } = await supabase
        .from('raffle_prize_images')
        .select('*')
        .in('prize_id', prizes.map(p => p.id));
      
      if (error) throw error;
      
      return (data || []).map(img => ({
        ...img,
        url_image: img.image_url
      })) as PrizeImage[];
    },
    enabled: !!prizes?.length
  });
  
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
  
  const { data: adminUser, isLoading: isLoadingAdmin } = useQuery({
    queryKey: ['admin', raffle?.id_admin],
    queryFn: async () => {
      if (!raffle?.id_admin) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', raffle.id_admin)
        .single();
      
      if (error) {
        console.error('Error fetching admin:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!raffle?.id_admin
  });
  
  const { data: organizerUser, isLoading: isLoadingOrganizer } = useQuery({
    queryKey: ['organizer', raffle?.id_organizer],
    queryFn: async () => {
      if (!raffle?.id_organizer) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', raffle.id_organizer)
        .single();
      
      if (error) {
        console.error('Error fetching organizer:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!raffle?.id_organizer
  });
  
  useEffect(() => {
    if (organization && (adminUser || organizerUser)) {
      const updatedOrganization = { ...organization };
      
      if (adminUser) {
        updatedOrganization.admin_name = adminUser.name;
        updatedOrganization.admin_phone_number = adminUser.phone_number || '';
        updatedOrganization.admin_photo = adminUser.avatar;
      }
      
      if (organizerUser) {
        updatedOrganization.org_name = organizerUser.name;
        updatedOrganization.org_phone_number = organizerUser.phone_number || '';
        updatedOrganization.org_photo = organizerUser.avatar;
      }
      
      setOrganizationData(updatedOrganization);
    }
  }, [organization, adminUser, organizerUser]);
  
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
      
      if (data) {
        setAllowVoucherPrint(data.allow_voucher_print || false);
      }
      
      return data;
    },
    enabled: !!seller?.id
  });
  
  useEffect(() => {
    if (raffleSeller?.cant_max) {
      setMaxNumbersAllowed(raffleSeller.cant_max);
    }
  }, [raffleSeller]);
  
  const {
    selectedNumbers,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData,
    validatedBuyerData,
    debugMode: paymentDebugMode,
    handleReserveNumbers,
    handleProceedToPayment,
    handleCompletePayment,
    getSoldNumbersCount
  } = usePaymentProcessor({
    raffleSeller: seller ? { 
      id: raffleSeller?.id || 'default', 
      seller_id: seller.id,
      active: raffleSeller?.active || true,
      cant_max: raffleSeller?.cant_max || 33
    } : null,
    raffleId: RAFFLE_ID,
    raffleNumbers,
    refetchRaffleNumbers,
    debugMode: debugMode
  });
  
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
  
  const handleViewPrizeDetails = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsPrizeModalOpen(true);
  };

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
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            {organization && <RaffleHeader organization={organization} />}
          </div>
          <DarkModeToggle />
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
          {raffle?.title || 'Cargando...'}
        </h1>
        
        {prizes && (
          <PrizeCarousel 
            prizes={prizes} 
            onViewDetails={handleViewPrizeDetails}
          />
        )}
        
        {raffleNumbers && (
          <div className="mb-8">
            <NumberGrid 
              numbers={formatNumbersForGrid()}
              raffleSeller={{
                id: raffleSeller?.id || 'default',
                raffle_id: RAFFLE_ID,
                seller_id: seller?.id || SELLER_ID,
                active: raffleSeller?.active || true,
                cant_max: maxNumbersAllowed
              }}
              onReserve={handleReserveNumbers}
              onProceedToPayment={handleProceedToPayment}
              debugMode={debugMode}
              soldNumbersCount={getSoldNumbersCount(seller?.id || '')}
            />
          </div>
        )}
        
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
        
        {seller && (
          <SellerInfo
            name={seller.name}
            phone={seller.phone}
            avatar={seller.avatar}
            id={seller.id}
          />
        )}
        
        {organizationData && <OrganizerInfo organization={organizationData} />}
        
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 italic mb-8">
          Las plataformas de redes sociales no están asociadas a esta rifa.
        </div>
      </div>
      
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
        buyerData={validatedBuyerData}
      />
      
      <DigitalVoucher 
        isOpen={isVoucherOpen}
        onClose={() => setIsVoucherOpen(false)}
        paymentData={paymentData}
        selectedNumbers={selectedNumbers}
        allowVoucherPrint={allowVoucherPrint}
      />
    </div>
  );
};

export default VentaBoletos;
