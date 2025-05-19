
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRaffleNumbersData(raffleId: string, sellerId: string) {
  const [allowVoucherPrint, setAllowVoucherPrint] = useState(true);
  const [maxNumbersAllowed, setMaxNumbersAllowed] = useState<number>(33);

  // Fetch raffle numbers - ensuring we filter by both raffle_id AND seller_id
  const { data: raffleNumbers, isLoading: isLoadingRaffleNumbers, refetch: refetchRaffleNumbers } = useQuery({
    queryKey: ['raffleNumbers', raffleId, sellerId],
    queryFn: async () => {
      try {
        console.log(`[useRaffleNumbersData.ts] Consultando números con raffle_id=${raffleId} y seller_id=${sellerId}`);
        
        const { data, error } = await supabase
          .from('raffle_numbers')
          .select('*')
          .eq('raffle_id', raffleId)
          .eq('seller_id', sellerId) // Agregamos filtro por seller_id para garantizar separación de datos
          .lte('number', 99);
        
        if (error) {
          console.error(`[useRaffleNumbersData.ts] Error al consultar números:`, error);
          throw error;
        }
        
        console.log(`[useRaffleNumbersData.ts] Encontrados ${data?.length || 0} números para el vendedor actual`);
        return data || [];
      } catch (err) {
        console.error(`[useRaffleNumbersData.ts] Error inesperado al consultar números:`, err);
        throw err;
      }
    },
    enabled: !!raffleId && !!sellerId
  });
  
  // Fetch raffle seller
  const { data: raffleSeller, isLoading: isLoadingRaffleSeller } = useQuery({
    queryKey: ['raffleSeller', raffleId, sellerId],
    queryFn: async () => {
      if (!sellerId || !raffleId) {
        console.warn(`[useRaffleNumbersData.ts] No se pudo consultar información del vendedor - falta sellerId o raffleId`);
        return null;
      }
      
      try {
        console.log(`[useRaffleNumbersData.ts] Consultando información del vendedor ${sellerId} para rifa ${raffleId}`);
        
        const { data, error } = await supabase
          .from('raffle_sellers')
          .select('*')
          .eq('raffle_id', raffleId)
          .eq('seller_id', sellerId)
          .maybeSingle();
        
        if (error) {
          console.error('[useRaffleNumbersData.ts] Error al consultar información del vendedor:', error);
          return null;
        }
        
        if (data) {
          // Store allow_voucher_print to use it later
          setAllowVoucherPrint(data.allow_voucher_print || false);
          console.log(`[useRaffleNumbersData.ts] Configuración de impresión de voucher: ${data.allow_voucher_print}`);
        } else {
          console.warn(`[useRaffleNumbersData.ts] No se encontró información para el vendedor ${sellerId} en la rifa ${raffleId}`);
        }
        
        return data;
      } catch (err) {
        console.error('[useRaffleNumbersData.ts] Error inesperado al consultar información del vendedor:', err);
        return null;
      }
    },
    enabled: !!sellerId && !!raffleId
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
