
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Prize } from '@/lib/constants';

export function usePrizesData(raffleId: string) {
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
      
      // Add missing 'order' property to each prize (default to 0)
      return (data || []).map(prize => ({
        ...prize,
        order: 0
      })) as Prize[];
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
      
      return (data || []).map(img => ({
        ...img,
        url_image: img.image_url
      }));
    },
    enabled: !!prizes?.length
  });

  return { 
    prizes, 
    prizeImages, 
    isLoadingPrizes, 
    isLoadingPrizeImages 
  };
}
