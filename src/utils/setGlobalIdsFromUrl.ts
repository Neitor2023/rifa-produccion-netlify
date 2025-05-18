
import { supabase } from "@/integrations/supabase/client";
import { RAFFLE_ID as DEFAULT_RAFFLE_ID, SELLER_ID as DEFAULT_SELLER_ID } from "@/lib/constants/ids";

// Exportamos con los valores por defecto inicialmente
export let RAFFLE_ID = DEFAULT_RAFFLE_ID;
export let SELLER_ID = DEFAULT_SELLER_ID;

export async function setGlobalIdsFromUrl(): Promise<void> {
  console.log("[setGlobalIdsFromUrl.ts] – Iniciando extracción de variables de la URL");
  
  try {
    const params = new URLSearchParams(window.location.search);
    const prmtrRaffle = params.get('prmtrRaffle');
    const prmtrDNI = params.get('prmtrDNI');

    console.log("[setGlobalIdsFromUrl.ts] Parámetros encontrados:", { prmtrRaffle, prmtrDNI });

    // Validación y asignación del ID de rifa
    if (prmtrRaffle && /^[0-9a-fA-F-]{36}$/.test(prmtrRaffle)) {
      RAFFLE_ID = prmtrRaffle;
      console.log("[setGlobalIdsFromUrl.ts] RAFFLE_ID asignado:", RAFFLE_ID);
    } else if (prmtrRaffle) {
      console.log('[setGlobalIdsFromUrl.ts] Raffle ID inválido en URL - valor:', prmtrRaffle);
    } else {
      console.log("[setGlobalIdsFromUrl.ts] – prmtrRaffle ausente, se usará valor por defecto");
    }

    // Validación y asignación del ID del vendedor
    if (prmtrDNI) {
      console.log("[setGlobalIdsFromUrl.ts] Buscando vendedor con cédula:", prmtrDNI);
      try {
        const { data, error } = await supabase
          .from('sellers')
          .select('id')
          .eq('cedula', prmtrDNI)
          .maybeSingle();

        if (error) {
          console.log('[setGlobalIdsFromUrl.ts] Error al buscar ID del vendedor - cédula:', prmtrDNI, '-', error.message);
        } else if (data?.id) {
          console.log("[setGlobalIdsFromUrl.ts] sellerId appears to be a cedula, looking up UUID");
          console.log("[setGlobalIdsFromUrl.ts] Looking up seller UUID for cedula:", prmtrDNI);
          SELLER_ID = data.id;
          console.log("[setGlobalIdsFromUrl.ts] Found seller UUID for cedula", prmtrDNI + ":", SELLER_ID);
          console.log("[setGlobalIdsFromUrl.ts] Using UUID", SELLER_ID, "instead of cedula", prmtrDNI);
        } else {
          console.log('[setGlobalIdsFromUrl.ts] Fallo al buscar cédula – prmtrDNI:', prmtrDNI);
        }
      } catch (dbError) {
        console.log('[setGlobalIdsFromUrl.ts] Error en la consulta a la base de datos:', dbError);
      }
    } else {
      console.log("[setGlobalIdsFromUrl.ts] – prmtrDNI ausente, se usará valor por defecto");
    }
  } catch (err) {
    console.log('[setGlobalIdsFromUrl.ts] Error inesperado al procesar parámetros de URL - Detalle:', err);
  }
  
  console.log("[setGlobalIdsFromUrl.ts] – Finalizando extracción de variables de la URL con valores:", { 
    RAFFLE_ID, 
    SELLER_ID 
  });
}
