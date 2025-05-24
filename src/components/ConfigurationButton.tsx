
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import ConfigurationModal from './ConfigurationModal';
import { shouldShowDevNotice } from '@/lib/supabase-env';

const ConfigurationButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Solo renderizar si showDevNotice es true
  if (!shouldShowDevNotice()) {
    return null;
  }
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="text-xs"
      >
        <Settings className="w-3 h-3 mr-1" />
        Ver configuración
      </Button>
      
      <ConfigurationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ConfigurationButton;
