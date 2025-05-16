
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSellerUuidFromCedula } from './useSellerIdMapping';

export function useSellerData(sellerId: string) {
  const { data: seller, isLoading: isLoadingSeller } = useQuery({
    queryKey: ['seller', sellerId],
    queryFn: async () => {
      // Check if the sellerId looks like a UUID or a cedula
      const isUuid = sellerId.includes('-') && sellerId.length > 30;
      
      let idToUse = sellerId;
      
      // If it's not a UUID, try to get the UUID from the cedula
      if (!isUuid) {
        console.log('sellerId appears to be a cedula, looking up UUID');
        const uuid = await getSellerUuidFromCedula(sellerId);
        
        if (uuid) {
          console.log(`Using UUID ${uuid} instead of cedula ${sellerId}`);
          idToUse = uuid;
        } else {
          // If we couldn't find a UUID, try with the original ID as cedula
          console.log('Falling back to querying by cedula');
          const { data, error } = await supabase
            .from('sellers')
            .select('*')
            .eq('cedula', sellerId)
            .single();
          
          if (error) throw error;
          return data;
        }
      }
      
      // Query with the UUID
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', idToUse)
        .maybeSingle();
      
      if (data) {
        return data;
      }
      
      // If no data found by ID, try with cedula as fallback
      const { data: cedulaData, error: cedulaError } = await supabase
        .from('sellers')
        .select('*')
        .eq('cedula', sellerId)
        .maybeSingle();
      
      if (cedulaError) throw cedulaError;
      return cedulaData;
    }
  });

  return { seller, isLoadingSeller };
}
