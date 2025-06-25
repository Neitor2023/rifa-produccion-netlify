
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface Bank {
  id: string;
  name: string;
}

interface PaymentUploadZoneProps {
  previewUrl: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
  selectedBankId?: string;
  onBankSelect?: (bankId: string) => void;
  paymentMethod?: "cash" | "transfer";
}

const PaymentUploadZone: React.FC<PaymentUploadZoneProps> = ({
  previewUrl,
  onFileUpload,
  onFileRemove,
  selectedBankId,
  onBankSelect,
  paymentMethod
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);

  console.log('[PaymentUploadZone.tsx] Props recibidas:', {
    selectedBankId,
    hasOnBankSelect: !!onBankSelect,
    paymentMethod
  });

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        console.log('[PaymentUploadZone.tsx] Mostrando mensaje de instrucciones bancarias y listado de bancos desde tabla');
        
        const { data, error } = await supabase
          .from('banks')
          .select('id, name')
          .order('name');

        if (error) {
          console.error('[PaymentUploadZone.tsx] Error al obtener bancos:', error);
          return;
        }

        setBanks(data || []);
        console.log('[PaymentUploadZone.tsx] ✅ Bancos cargados:', data?.length || 0);
      } catch (error) {
        console.error('[PaymentUploadZone.tsx] Error en fetchBanks:', error);
      }
    };

    fetchBanks();
  }, []);

  const handleBankSelection = (value: string) => {
    console.log('[PaymentUploadZone.tsx] handleBankSelection llamado con:', value);
    console.log('[PaymentUploadZone.tsx] onBankSelect disponible:', !!onBankSelect);
    
    if (onBankSelect) {
      console.log('[PaymentUploadZone.tsx] Ejecutando onBankSelect con:', value);
      onBankSelect(value);
    } else {
      console.error('[PaymentUploadZone.tsx] ❌ onBankSelect no está disponible');
    }
  };

  // Obtener el nombre del banco seleccionado para logs internos (no mostrar en UI)
  const selectedBankName = selectedBankId ? banks.find(bank => bank.id === selectedBankId)?.name : '';
  
  // Log interno para verificar selección sin mostrar en UI
  useEffect(() => {
    if (selectedBankId && selectedBankName) {
      console.log('[PaymentUploadZone.tsx] Banco seleccionado por el participante:', selectedBankId);
      console.log('[PaymentUploadZone.tsx] Nombre del banco seleccionado:', selectedBankName);
    }
  }, [selectedBankId, selectedBankName]);

  return (
    <div className="space-y-4">
      {/* Mensaje de instrucciones bancarias */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p className="font-semibold">Por Favor Hacer las Transferencias por unos de los siguientes Bancos:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Todas están a nombre de: <strong>Romy Garcia</strong></li>
            <li>Cédula: <strong>1759091091</strong></li>
            <li>Todas son cuentas de <strong>Ahorro</strong></li>
          </ul>
          
          {banks.length > 0 && (
            <div className="mt-3">
              <p className="font-semibold mb-2">Bancos disponibles:</p>
              <div className="space-y-1">
                {banks.map((bank) => (
                  <p key={bank.id} className="ml-2">• {bank.name}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selector de banco - Con estilos de contraste mejorados */}
      {banks.length > 0 && paymentMethod === "transfer" && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecciona el banco para la transferencia:
          </label>
          <Select 
            value={selectedBankId || ""} 
            onValueChange={handleBankSelection}
          >
            <SelectTrigger className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary">
              <SelectValue 
                placeholder="Selecciona un banco..." 
                className="text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              {banks.map((bank) => (
                <SelectItem 
                  key={bank.id} 
                  value={bank.id}
                  className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                >
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedBankId && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              ✓ Banco seleccionado: {selectedBankName}
            </p>
          )}
        </div>
      )}

      {/* Selección automática del primer banco disponible si no hay selección */}
      {banks.length > 0 && !selectedBankId && onBankSelect && paymentMethod === "transfer" && (
        <div className="hidden">
          {(() => {
            // Auto-seleccionar el primer banco disponible
            setTimeout(() => {
              console.log('[PaymentUploadZone.tsx] Auto-seleccionando primer banco:', banks[0].id);
              onBankSelect(banks[0].id);
            }, 100);
            return null;
          })()}
        </div>
      )}
      
      <div className="space-y-4">
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
        
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-gray-800 dark:text-white">
            Comprobante de Pago <span className="text-red-500">*</span>
          </label>
          
          <div className="flex flex-col items-center p-4 border-2 border-dashed border-black rounded-md ">
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
      </div>
    </div>
  );
};

console.log('[PaymentUploadZone.tsx] 🎨 Se aplicaron estilos de contraste al selector de bancos');

export default PaymentUploadZone;
