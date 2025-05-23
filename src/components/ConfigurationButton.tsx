
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import ConfigurationModal from './ConfigurationModal';

const ConfigurationButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
