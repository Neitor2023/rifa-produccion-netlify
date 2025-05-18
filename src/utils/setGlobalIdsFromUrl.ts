
import { supabase } from "@/integrations/supabase/client";
import { RAFFLE_ID as DEFAULT_RAFFLE_ID, SELLER_ID as DEFAULT_SELLER_ID } from "@/lib/constants/ids";

// Exportamos con los valores por defecto inicialmente
export let RAFFLE_ID = DEFAULT_RAFFLE_ID;
export let SELLER_ID = DEFAULT_SELLER_ID;

export async function setGlobalIdsFromUrl(): Promise<void> {
  console.log('[setGlobalIdsFromUrl.ts] Aqui estoy');
  try {
    const params = new URLSearchParams(window.location.search);
    const prmtrRaffle = params.get('prmtrRaffle');
    const prmtrDNI = params.get('prmtrDNI');

    // Validación y asignación del ID de rifa
    if (prmtrRaffle && /^[0-9a-fA-F-]{36}$/.test(prmtrRaffle)) {
      RAFFLE_ID = prmtrRaffle;
    } else if (prmtrRaffle) {
      console.log('[setGlobalIdsFromUrl.ts] Raffle ID inválido en URL - valor:', prmtrRaffle);
    }

    // Validación y asignación del ID del vendedor
    if (prmtrDNI) {
      try {
        const { data, error } = await supabase
          .from('sellers')
          .select('id')
          .eq('cedula', prmtrDNI)
          .maybeSingle();

        if (error) {
          console.log('[setGlobalIdsFromUrl.ts] Error al buscar ID del vendedor - cédula:', prmtrDNI, '-', error.message);
        } else if (data?.id) {
          SELLER_ID = data.id;
        } else {
          console.log('[setGlobalIdsFromUrl.ts] No se encontró el vendedor con cédula:', prmtrDNI);
        }
      } catch (dbError) {
        console.log('[setGlobalIdsFromUrl.ts] Error en la consulta a la base de datos:', dbError);
      }
    }
  } catch (err) {
    console.log('[setGlobalIdsFromUrl.ts] Error inesperado al procesar parámetros de URL - Detalle:', err);
  }
}
