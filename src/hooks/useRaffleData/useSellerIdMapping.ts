
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to get the seller UUID from a cedula
 * This resolves the issue where SELLER_ID is a cedula but database tables expect a UUID
 */
export async function getSellerUuidFromCedula(cedula: string): Promise<string | null> {
  try {
    console.log('Looking up seller UUID for cedula:', cedula);
    
    if (!cedula) {
      console.error('No cedula provided for seller lookup');
      return null;
    }
    
    const { data, error } = await supabase
      .from('sellers')
      .select('id')
      .eq('cedula', cedula)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching seller UUID:', error);
      return null;
    }
    
    if (!data || !data.id) {
      console.error(`No seller found with cedula ${cedula}`);
      return null;
    }
    
    console.log(`Found seller UUID for cedula ${cedula}:`, data.id);
    return data.id;
  } catch (err) {
    console.error('Exception in getSellerUuidFromCedula:', err);
    return null;
  }
}
