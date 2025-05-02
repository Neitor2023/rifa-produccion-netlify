
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRaffleBasicData(raffleId: string) {
  const [debugMode, setDebugMode] = useState(false);
  
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

  return { raffle, isLoadingRaffle, debugMode };
}
