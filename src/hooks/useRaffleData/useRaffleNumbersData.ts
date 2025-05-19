
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRaffleNumbersData(raffleId: string, sellerId: string) {
  const [allowVoucherPrint, setAllowVoucherPrint] = useState(true);
  const [maxNumbersAllowed, setMaxNumbersAllowed] = useState<number>(33);

  // Fetch raffle numbers
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
  
  // Fetch raffle seller
  const { data: raffleSeller, isLoading: isLoadingRaffleSeller } = useQuery({
    queryKey: ['raffleSeller', raffleId, sellerId],
    queryFn: async () => {
      if (!sellerId) return null;
      
      try {
        console.log('[useRaffleNumbersData.ts] Fetching raffle seller with raffleId:', raffleId, 'sellerId:', sellerId);
        
        const { data, error } = await supabase
          .from('raffle_sellers')
          .select('*')
          .eq('raffle_id', raffleId)
          .eq('seller_id', sellerId)
          .maybeSingle();
        
        if (error) {
          console.error('[useRaffleNumbersData.ts] Error fetching raffle seller:', error);
          return null;
        }
        
        if (data) {
          // Explicitly set allowVoucherPrint based on the value from the database
          // Default to true if the field is null or undefined
          const shouldAllowPrint = data.allow_voucher_print !== false;
          console.log('[useRaffleNumbersData.ts] Setting allowVoucherPrint to:', shouldAllowPrint, 'based on DB value:', data.allow_voucher_print);
          setAllowVoucherPrint(shouldAllowPrint);
          
          return data;
        } else {
          console.log('[useRaffleNumbersData.ts] No raffle seller found, using default allowVoucherPrint: true');
          return null;
        }
      } catch (err) {
        console.error('[useRaffleNumbersData.ts] Exception in fetching raffle seller:', err);
        return null;
      }
    },
    enabled: !!sellerId
  });

  // Update max numbers allowed when raffle seller data changes
  useEffect(() => {
    if (raffleSeller?.cant_max) {
      setMaxNumbersAllowed(raffleSeller.cant_max);
    }
  }, [raffleSeller]);

  // Format numbers for the grid display
  const formatNumbersForGrid = () => {
    const formattedNumbers = [];
    
    for (let i = 0; i < 100; i++) {
      const paddedNumber = i.toString().padStart(2, '0');
      const existingNumber = raffleNumbers?.find(n => n.number === parseInt(paddedNumber));
      
      formattedNumbers.push({
        id: existingNumber?.id || `num-${paddedNumber}`,
        raffle_id: raffleId,
        number: paddedNumber,
        status: existingNumber?.status || "available",
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

  return {
    raffleNumbers,
    raffleSeller,
    formatNumbersForGrid,
    refetchRaffleNumbers,
    maxNumbersAllowed,
    allowVoucherPrint,
    isLoading: isLoadingRaffleNumbers || isLoadingRaffleSeller
  };
}
