
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRaffleNumbersData(raffleId: string, sellerId: string) {
  const [allowVoucherPrint, setAllowVoucherPrint] = useState(true);
  const [maxNumbersAllowed, setMaxNumbersAllowed] = useState<number>(33);

  // Fetch raffle numbers
  const { data: raffleNumbers, isLoading: isLoadingRaffleNumbers, refetch: refetchRaffleNumbers } = useQuery({
    queryKey: ['raffleNumbers', raffleId, sellerId], // Added sellerId to queryKey for proper cache invalidation
    queryFn: async () => {
      console.log(`[useRaffleNumbersData.ts] Consultando números para: raffleId=${raffleId}, sellerId=${sellerId}`);
      
      try {
        // First, filter numbers by raffle_id and seller_id to ensure data separation
        const { data, error } = await supabase
          .from('raffle_numbers')
          .select('*')
          .eq('raffle_id', raffleId)
          .eq('seller_id', sellerId)
          .lte('number', 99);
        
        if (error) {
          console.error(`[useRaffleNumbersData.ts] Error en consulta de números: ${error.message}`);
          throw error;
        }
        
        console.log(`[useRaffleNumbersData.ts] Números encontrados: ${data?.length || 0}`);
        return data || [];
      } catch (err) {
        console.error(`[useRaffleNumbersData.ts] Error en fetchRaffleNumbers:`, err);
        return [];
      }
    }
  });
  
  // Fetch raffle seller
  const { data: raffleSeller, isLoading: isLoadingRaffleSeller } = useQuery({
    queryKey: ['raffleSeller', raffleId, sellerId],
    queryFn: async () => {
      if (!sellerId) {
        console.log(`[useRaffleNumbersData.ts] No hay sellerId, omitiendo consulta de vendedor`);
        return null;
      }
      
      try {
        console.log(`[useRaffleNumbersData.ts] Consultando vendedor: raffleId=${raffleId}, sellerId=${sellerId}`);
        
        const { data, error } = await supabase
          .from('raffle_sellers')
          .select('*')
          .eq('raffle_id', raffleId)
          .eq('seller_id', sellerId)
          .maybeSingle();
        
        if (error) {
          console.error(`[useRaffleNumbersData.ts] Error consultando vendedor: ${error.message}`);
          return null;
        }
        
        if (data) {
          console.log(`[useRaffleNumbersData.ts] Vendedor encontrado: allowVoucherPrint=${data.allow_voucher_print}`);
          // Actualizamos el estado de allow_voucher_print
          setAllowVoucherPrint(data.allow_voucher_print !== false); // Si es null o true, lo tratamos como verdadero
        } else {
          console.log(`[useRaffleNumbersData.ts] No se encontró vendedor para raffleId=${raffleId}, sellerId=${sellerId}`);
        }
        
        return data;
      } catch (err) {
        console.error(`[useRaffleNumbersData.ts] Error en fetchRaffleSeller:`, err);
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
        seller_id: existingNumber?.seller_id || sellerId, // Usar el sellerId actual para nuevos números
        buyer_name: existingNumber?.participant_id ? 'Comprador' : null,
        buyer_phone: null,
        payment_method: null,
        payment_proof: existingNumber?.payment_receipt_url || null, // Use payment_receipt_url instead
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
