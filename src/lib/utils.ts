
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to consistently handle conflicts with numbers
export function handleNumberConflict(conflictingNumbers: string[]) {
  if (!conflictingNumbers || conflictingNumbers.length === 0) return false;
  
  toast.error(`Estos números ya pertenecen a otro participante: ${conflictingNumbers.join(', ')}. Por favor elija otros números.`);
  return true;
}

// Function to upload files to Supabase storage
export async function uploadFile(file: File, bucket: string, path: string = ''): Promise<string | null> {
  if (!file) return null;
  
  try {
    const fileName = `${path}${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}
