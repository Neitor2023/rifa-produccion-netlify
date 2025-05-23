
Este archivo se genera automáticamente. No lo edites directamente.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ngpedcqmktcosghpeyvi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncGVkY3Fta3Rjb3NnaHBleXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzMzMzUsImV4cCI6MjA1OTA0OTMzNX0.TC6nH1RL9dYbFvK7YrLfDVRmRJhLIO_quYfI1kB_PPk";

// Importa el cliente de supabase de la siguiente manera:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
