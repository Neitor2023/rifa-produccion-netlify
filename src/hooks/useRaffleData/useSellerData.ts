
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSellerData(sellerId: string) {
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

  return { seller, isLoadingSeller };
}
