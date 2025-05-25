
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Variables de entorno para PRODUCCIÓN
const DEFAULT_SUPABASE_URL_PROD = "https://ngpedcqmktcosghpeyvi.supabase.co";
const DEFAULT_SUPABASE_KEY_PROD = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncGVkY3Fta3Rjb3NnaHBleXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzMzMzUsImV4cCI6MjA1OTA0OTMzNX0.TC6nH1RL9dYbFvK7YrLfDVRmRJhLIO_quYfI1kB_PPk";

// Variables de entorno para DESARROLLO
const DEFAULT_SUPABASE_URL_DEV = "https://ehjljyuwlwcdiscxpbdr.supabase.co";
const DEFAULT_SUPABASE_KEY_DEV = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoamxqeXV3bHdjZGlzY3hwYmRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk3MTIyMiwiZXhwIjoyMDYzNTQ3MjIyfQ.ms1NF83VojtylWPVp9IaTXtCOxUL0jZiUgDqHzrDzso";

// Variable de entorno explícita
// Valores permitidos: "dev" | "prod"
// Por defecto: "prod" para producción
const DEFAULT_ENVIRONMENT: "dev" | "prod" = "dev";

// Nombres de buckets por defecto
const DEFAULT_BUCKET_PAYMENT_PROOFS = "payment-proofs";

// Control de visibilidad del aviso de desarrollo
// Por defecto false - no mostrar aviso de desarrollo en producción
const DEFAULT_SHOW_DEV_NOTICE = false;

export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseKey: string;
  isDevelopment: boolean;
  environment: 'development' | 'production';
  bucketPaymentProofs: string;
  showDevNotice: boolean;
}

/**
 * Función centralizada para obtener la configuración del entorno
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // Intentar obtener variables de entorno
  const envUrl = import.meta.env.VITE_SUPABASE_URL || window?.ENV?.SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_KEY || window?.ENV?.SUPABASE_KEY;
  const envEnvironment = import.meta.env.VITE_ENVIRONMENT || window?.ENV?.ENVIRONMENT;
  const envBucketPaymentProofs = import.meta.env.VITE_BUCKET_PAYMENT_PROOFS || window?.ENV?.BUCKET_PAYMENT_PROOFS;
  const envShowDevNotice = import.meta.env.VITE_SHOW_DEV_NOTICE || window?.ENV?.SHOW_DEV_NOTICE;
  
  // Determinar el entorno actual
  const currentEnvironment = envEnvironment || DEFAULT_ENVIRONMENT;
  
  // Seleccionar las variables correctas según el entorno
  let supabaseUrl: string;
  let supabaseKey: string;
  
  if (currentEnvironment === "dev") {
    supabaseUrl = envUrl || DEFAULT_SUPABASE_URL_DEV;
    supabaseKey = envKey || DEFAULT_SUPABASE_KEY_DEV;
  } else {
    supabaseUrl = envUrl || DEFAULT_SUPABASE_URL_PROD;
    supabaseKey = envKey || DEFAULT_SUPABASE_KEY_PROD;
  }
  
  const bucketPaymentProofs = envBucketPaymentProofs || DEFAULT_BUCKET_PAYMENT_PROOFS;
  
  // Convertir string a boolean para showDevNotice
  // Si la variable existe y es "true", será true; en cualquier otro caso será false
  const showDevNotice = envShowDevNotice === 'true' ? true : DEFAULT_SHOW_DEV_NOTICE;
  
  // Detectar si es entorno de desarrollo
  const isDevelopment = currentEnvironment === "dev" || 
                       import.meta.env.DEV || 
                       window.location.hostname === 'localhost';

  const environment = isDevelopment ? 'development' : 'production';
  
  console.log(`[supabase-env.ts] Configuración cargada - Entorno: ${environment} (${currentEnvironment})`);
  console.log(`[supabase-env.ts] Bucket de comprobantes de pago: ${bucketPaymentProofs}`);
  console.log(`[supabase-env.ts] Mostrar aviso de desarrollo: ${showDevNotice}`);
  
  return {
    supabaseUrl,
    supabaseKey,
    isDevelopment,
    environment,
    bucketPaymentProofs,
    showDevNotice
  };
}

/**
 * Función para crear el cliente de Supabase con configuración dinámica
 */
export function createSupabaseClient() {
  const config = getEnvironmentConfig();
  
  console.log(`[supabase-env.ts] Creando cliente Supabase para: ${config.environment}`);
  
  return createClient<Database>(config.supabaseUrl, config.supabaseKey);
}

/**
 * Función para obtener solo la configuración visible (sin claves sensibles)
 */
export function getVisibleConfig() {
  const config = getEnvironmentConfig();
  
  return {
    supabaseUrl: config.supabaseUrl,
    supabaseKey: `${config.supabaseKey.substring(0, 20)}...`, // Solo mostrar inicio
    environment: config.environment,
    isDevelopment: config.isDevelopment,
    bucketPaymentProofs: config.bucketPaymentProofs,
    showDevNotice: config.showDevNotice,
    hostname: window.location.hostname,
    isDev: import.meta.env.DEV
  };
}

/**
 * Función para obtener el nombre del bucket de comprobantes de pago
 */
export function getPaymentProofsBucket(): string {
  const config = getEnvironmentConfig();
  return config.bucketPaymentProofs;
}

/**
 * Función para verificar si se debe mostrar el aviso de desarrollo
 * 
 * Variables de entorno relacionadas:
 * - VITE_SHOW_DEV_NOTICE: controla si mostrar elementos de desarrollo ("true" | "false")
 * 
 * Lógica:
 * - Solo se muestra si VITE_SHOW_DEV_NOTICE es explícitamente "true"
 * - Por defecto es false para garantizar seguridad en producción
 * 
 * Uso recomendado:
 * - Desarrollo: VITE_SHOW_DEV_NOTICE="true"
 * - Producción: VITE_SHOW_DEV_NOTICE="false" (o sin definir)
 * 
 * Controla la visibilidad de:
 * - Botón "Ver configuración"
 * - Modal de configuración
 * - Alertas de desarrollo
 */
export function shouldShowDevNotice(): boolean {
  const config = getEnvironmentConfig();
  return config.showDevNotice;
}
