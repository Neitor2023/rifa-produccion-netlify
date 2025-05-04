
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useDebugMode() {
  const [debugMode, setDebugMode] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  
  // Check for debug mode
  useEffect(() => {
    const checkDebugMode = async () => {
      try {
        const { data } = await supabase
          .from('organization')
          .select('modal')
          .limit(1)
          .single();
        
        setDebugMode(data?.modal === 'programador');
      } catch (error) {
        console.error('Error checking debug mode:', error);
      }
    };
    
    checkDebugMode();
  }, []);
  
  return {
    debugMode,
    isDebugModalOpen,
    setIsDebugModalOpen,
    debugData,
    setDebugData
  };
}
