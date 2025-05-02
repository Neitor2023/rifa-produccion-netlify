
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Organization } from '@/lib/constants';

interface UseRaffleDataProps {
  raffleId: string;
  sellerId: string;
}

export function useRaffleData({ raffleId, sellerId }: UseRaffleDataProps) {
  const [organizationData, setOrganizationData] = useState<Organization | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [allowVoucherPrint, setAllowVoucherPrint] = useState(true);
  const [maxNumbersAllowed, setMaxNumbersAllowed] = useState<number>(33);

  // Fetch seller data
  const { data: seller, isLoading: isLoadingSeller } = useQuery({
    queryKey: ['seller', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('cedula', sellerId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });
  
  // Fetch raffle data
  const { data: raffle, isLoading: isLoadingRaffle } = useQuery({
    queryKey: ['raffle', raffleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('id', raffleId)
        .single();
      
      if (error) throw error;
      
      if (data?.modal === 'programador') {
        setDebugMode(true);
      }
      
      return data;
    }
  });
  
  // Fetch prizes
  const { data: prizes, isLoading: isLoadingPrizes } = useQuery({
    queryKey: ['prizes', raffleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prizes')
        .select('*')
        .eq('raffle_id', raffleId)
        .order('created_at');
      
      if (error) throw error;
      return data || [];
    }
  });
  
  // Obtener imágenes de premios
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
      }));
    },
    enabled: !!prizes?.length
  });
  
  // Obtener datos de la organización
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
  
  // Obtener usuario administrador
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
  
  // Recuperar usuario del organizador
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
  
  // Obtener números de rifa
  const { data: raffleNumbers, isLoading: isLoadingRaffleNumbers, refetch: refetchRaffleNumbers } = useQuery({
    queryKey: ['raffleNumbers', raffleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raffle_numbers')
        .select('*')
        .eq('raffle_id', raffleId)
        .lte('number', 99);
      
      if (error) throw error;
      return data || [];
    }
  });
  
  // Busca al vendedor de rifa
  const { data: raffleSeller } = useQuery({
    queryKey: ['raffleSeller', raffleId, seller?.id],
    queryFn: async () => {
      if (!seller?.id) return null;
      
      const { data, error } = await supabase
        .from('raffle_sellers')
        .select('*')
        .eq('raffle_id', raffleId)
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

  const formatNumbersForGrid = () => {
    const formattedNumbers = [];
    
    for (let i = 0; i < 100; i++) {
      const paddedNumber = i.toString().padStart(2, '0');
      const existingNumber = raffleNumbers?.find(n => n.number === parseInt(paddedNumber));
      
      formattedNumbers.push({
        id: existingNumber?.id || `num-${paddedNumber}`,
        raffle_id: raffleId,
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

  const isLoading = 
    isLoadingSeller || 
    isLoadingRaffle || 
    isLoadingPrizes || 
    isLoadingOrganization || 
    isLoadingRaffleNumbers;

  return {
    seller,
    raffle,
    prizes,
    prizeImages,
    organization: organizationData,
    raffleNumbers,
    raffleSeller,
    formatNumbersForGrid,
    isLoading,
    refetchRaffleNumbers,
    maxNumbersAllowed,
    debugMode,
    allowVoucherPrint
  };
}
