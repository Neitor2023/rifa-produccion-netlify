
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-base font-medium text-gray-800 dark:text-white">
          Comprobante de Pago <span className="text-red-500">*</span>
        </label>
        
        <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-md">
          <div className="space-y-2 text-center">
            
            <div className="text-gray-500">
              <label htmlFor="file-upload" className="relative cursor-pointer dark:text-white font-semibold  hover:underline">
                <Upload className="mx-auto h-8 w-8 text-black dark:text-white" />                                
                <span>Suba una imagen del comprobante</span>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onFileUpload}
                />
              <p>JPG, PNG, GIF hasta 10MB</p>                
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {previewUrl && (
        <div className="mt-4">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Comprobante"
              className="rounded-md max-h-64 mx-auto"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
              onClick={onFileRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentUploadZone;
