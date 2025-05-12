
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const ReceiptPage: React.FC = () => {
  const { id } = useParams<{id: string}>();
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [raffleNumber, setRaffleNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!id) {
        setError('ID del comprobante no proporcionado');
        setLoading(false);
        return;
      }

      try {
        console.log('[ReceiptPage] Fetch de payment_receipt_url para id:', id);
        
        const { data, error } = await supabase
          .from('raffle_numbers')
          .select('payment_receipt_url, number')
          .eq('id', id)
          .maybeSingle();
        
        if (error) {
          throw new Error(`Error al obtener el comprobante: ${error.message}`);
        }
        
        if (!data) {
          setError('Comprobante no encontrado');
          setLoading(false);
          return;
        }
        
        if (!data.payment_receipt_url) {
          setError('El comprobante aún no ha sido generado');
          setLoading(false);
          return;
        }
        
        console.log('[ReceiptPage] Comprobante encontrado:', data.payment_receipt_url);
        setReceiptUrl(data.payment_receipt_url);
        setRaffleNumber(data.number?.toString() || null);
        setLoading(false);
      } catch (error) {
        console.error('[ReceiptPage] Error en fetchReceipt:', error);
        setError('Error al cargar el comprobante. Por favor, intente nuevamente.');
        setLoading(false);
      }
    };
    
    fetchReceipt();
  }, [id]);

  const handleDownload = () => {
    if (receiptUrl) {
      const link = document.createElement('a');
      link.href = receiptUrl;
      link.download = `comprobante_numero_${raffleNumber || 'rifa'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Cargando comprobante..." size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <p className="text-center text-gray-600">
            Si cree que esto es un error, por favor contacte al organizador de la rifa.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Comprobante de Pago</h1>
          {raffleNumber && (
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded text-sm font-medium">
              Número: {raffleNumber}
            </span>
          )}
        </div>
        
        {receiptUrl ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <img 
                src={receiptUrl} 
                alt="Comprobante de pago" 
                className="max-w-full shadow-lg rounded-lg"
                onError={() => setError('Error al cargar la imagen del comprobante')}
              />
            </div>
            
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" /> Descargar comprobante
            </Button>
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>
              No se pudo cargar la imagen del comprobante
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Este documento es su comprobante oficial de pago.</p>
          <p>Guarde este enlace o descargue la imagen para futuras referencias.</p>
        </div>
      </Card>
    </div>
  );
};

export default ReceiptPage;
