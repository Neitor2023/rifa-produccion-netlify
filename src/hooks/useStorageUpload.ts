
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  url: string | null;
  error: Error | null;
}

export const useStorageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);

  const uploadFile = async (file: File, filePath: string): Promise<UploadResult> => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(data.path);

      return {
        url: urlData.publicUrl,
        error: null
      };
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadError(error);
      
      return {
        url: null,
        error
      };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    uploadError,
    isUploading,
  };
};
