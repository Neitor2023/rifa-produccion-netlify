
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Configuración por defecto (fallback)
const DEFAULT_SUPABASE_URL = "https://ngpedcqmktcosghpeyvi.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncGVkY3Fta3Rjb3NnaHBleXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzMzMzUsImV4cCI6MjA1OTA0OTMzNX0.TC6nH1RL9dYbFvK7YrLfDVRmRJhLIO_quYfI1kB_PPk";

// const DEFAULT_SUPABASE_URL = "https://ehjljyuwlwcdiscxpbdr.supabase.co";
// const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoamxqeXV3bHdjZGlzY3hwYmRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk3MTIyMiwiZXhwIjoyMDYzNTQ3MjIyfQ.ms1NF83VojtylWPVp9IaTXtCOxUL0jZiUgDqHzrDzso";

// Nombres de buckets por defecto
const DEFAULT_BUCKET_PAYMENT_PROOFS = "payment-proofs";

// Control de visibilidad del aviso de desarrollo
// Por defecto true - mostrar aviso de desarrollo
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
  const envBucketPaymentProofs = import.meta.env.VITE_BUCKET_PAYMENT_PROOFS || window?.ENV?.BUCKET_PAYMENT_PROOFS;
  const envShowDevNotice = import.meta.env.VITE_SHOW_DEV_NOTICE || window?.ENV?.SHOW_DEV_NOTICE;
  
  // Usar variables de entorno si están disponibles, sino usar valores por defecto
  const supabaseUrl = envUrl || DEFAULT_SUPABASE_URL;
  const supabaseKey = envKey || DEFAULT_SUPABASE_KEY;
  const bucketPaymentProofs = envBucketPaymentProofs || DEFAULT_BUCKET_PAYMENT_PROOFS;
  
  // Convertir string a boolean para showDevNotice
  // Si la variable existe y es "false", será false; en cualquier otro caso será true
  const showDevNotice = envShowDevNotice === 'false' ? false : DEFAULT_SHOW_DEV_NOTICE;
  
  // Detectar si es entorno de desarrollo
  const isDevelopment = supabaseUrl.toLowerCase().includes('dev') || 
                       import.meta.env.DEV || 
                       window.location.hostname === 'localhost';
  
  const environment = isDevelopment ? 'development' : 'production';
  
  console.log(`[supabase-env.ts] Configuración cargada - Entorno: ${environment}`);
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
 * Variable de entorno: VITE_SHOW_DEV_NOTICE
 * - Si es "false" (string), no se mostrará el aviso
 * - Si es cualquier otro valor o no está definida, se mostrará el aviso (por defecto: true)
 * 
 * Uso recomendado:
 * - Desarrollo: dejar sin definir o establecer en "true" para ver avisos
 * - Producción: establecer en "false" para ocultar avisos
 */
export function shouldShowDevNotice(): boolean {
  const config = getEnvironmentConfig();
  return config.showDevNotice;
}
