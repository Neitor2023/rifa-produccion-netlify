
import React from 'react';
import { FormLabel } from '@/components/ui/form';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentUploadZoneProps {
  previewUrl: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
}

const PaymentUploadZone: React.FC<PaymentUploadZoneProps> = ({
  previewUrl,
  onFileUpload,
  onFileRemove
}) => {
  return (
    <div className="space-y-2">
      <FormLabel>Comprobante de pago</FormLabel>
      
      {previewUrl ? (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Comprobante" 
            className="w-full h-48 object-cover rounded-md border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={onFileRemove}
          >
            Eliminar
          </Button>
        </div>
      ) : (
        <div className="border border-dashed border-gray-300 rounded-md p-6 text-center relative">
          <Upload className="h-8 w-8 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            Haga clic para subir o arrastre su comprobante aquí
          </p>
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*"
            onChange={onFileUpload}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentUploadZone;
