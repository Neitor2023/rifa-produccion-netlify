
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSellerUuidFromCedula, isValidUuid } from './useSellerIdMapping';

export function useSellerData(sellerId: string) {
  const { data: seller, isLoading: isLoadingSeller } = useQuery({
    queryKey: ['seller', sellerId],
    queryFn: async () => {
      // Validar que sellerId esté definido
      if (!sellerId) {
        console.error('[useSellerData.ts] sellerId no está definido');
        throw new Error('ID del vendedor no proporcionado');
      }

      console.log('[useSellerData.ts] Iniciando consulta para sellerId:', sellerId);
      
      // Check if the sellerId looks like a UUID or a cedula
      const isUuid = isValidUuid(sellerId);
      
      let idToUse = sellerId;
      
      // Si no es un UUID, intentar obtener el UUID desde la cédula
      if (!isUuid) {
        console.log('[useSellerData.ts] sellerId parece ser una cédula, buscando UUID');
        const uuid = await getSellerUuidFromCedula(sellerId);
        
        if (uuid) {
          console.log(`[useSellerData.ts] Usando UUID ${uuid} en lugar de cédula ${sellerId}`);
          idToUse = uuid;
        } else {
          // Si no encontramos un UUID, intentar con el ID original como cédula
          console.log('[useSellerData.ts] Fallback: consultando por cédula directamente');
          const { data, error } = await supabase
            .from('sellers')
            .select('*')
            .eq('cedula', sellerId)
            .maybeSingle();
          
          if (error) {
            console.error('[useSellerData.ts] Error al buscar vendedor por cédula:', error.message);
            throw error;
          }
          
          if (data) return data;
          console.error('[useSellerData.ts] No se encontró vendedor con cédula:', sellerId);
        }
      }
      
      // Intentar consultar con el UUID
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', idToUse)
        .maybeSingle();
      
      if (error) {
        console.error('[useSellerData.ts] Error al buscar vendedor por UUID:', error.message);
        throw error;
      }
      
      if (data) {
        console.log('[useSellerData.ts] Vendedor encontrado:', data.name);
        return data;
      }
      
      // Si aún no encontramos datos, intentar una última vez por cédula
      console.log('[useSellerData.ts] Último intento: consultando por cédula');
      const { data: cedulaData, error: cedulaError } = await supabase
        .from('sellers')
        .select('*')
        .eq('cedula', sellerId)
        .maybeSingle();
      
      if (cedulaError) {
        console.error('[useSellerData.ts] Error al buscar vendedor por cédula (fallback):', cedulaError.message);
        throw cedulaError;
      }
      
      if (!cedulaData) {
        console.error('[useSellerData.ts] No se encontró ningún vendedor con ID o cédula:', sellerId);
      }
      
      return cedulaData;
    }
  });

  return { seller, isLoadingSeller };
}
