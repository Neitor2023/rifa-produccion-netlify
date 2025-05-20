
import { supabase } from '@/integrations/supabase/client';

/**
 * Utility function to get the seller UUID from a cedula
 * This resolves the issue where SELLER_ID is a cedula but database tables expect a UUID
 */
export async function getSellerUuidFromCedula(cedula: string): Promise<string | null> {
  try {
    console.log('[useSellerIdMapping.ts] Buscando UUID de vendedor para cédula:', cedula);
    
    if (!cedula) {
      console.error('[useSellerIdMapping.ts] No se proporcionó cédula para la búsqueda del vendedor');
      return null;
    }
    
    const { data, error } = await supabase
      .from('sellers')
      .select('id')
      .eq('cedula', cedula)
      .maybeSingle();
    
    if (error) {
      console.error('[useSellerIdMapping.ts] Error al buscar UUID del vendedor:', error.message);
      return null;
    }
    
    if (!data || !data.id) {
      console.error(`[useSellerIdMapping.ts] No se encontró vendedor con cédula ${cedula}`);
      return null;
    }
    
    console.log(`[useSellerIdMapping.ts] UUID de vendedor encontrado para cédula ${cedula}:`, data.id);
    return data.id;
  } catch (err) {
    console.error('[useSellerIdMapping.ts] Excepción en getSellerUuidFromCedula:', err);
    return null;
  }
}
