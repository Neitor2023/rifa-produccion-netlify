
import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Eye, X } from 'lucide-react';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { toast } from 'sonner';
import { exportVoucherAsImage, downloadVoucherImage, presentVoucherImage, ensureReceiptSavedForParticipant } from '@/components/digital-voucher/utils/voucherExport';

interface DigitalVoucherProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PaymentFormData | null;
  selectedNumbers: string[];
  raffleDetails?: {
    title: string;
    price: number;
    lottery: string;
    dateLottery: string;
  };
  debugMode?: boolean;
  participantId?: string;
  raffleId?: string;
  sellerId?: string;
}

const DigitalVoucher: React.FC<DigitalVoucherProps> = ({
  isOpen,
  onClose,
  paymentData,
  selectedNumbers,
  raffleDetails,
  debugMode = false,
  participantId,
  raffleId,
  sellerId
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [hasAutoSaved, setHasAutoSaved] = useState(false);

  // CORRECCIÓN DEFINITIVA: Eliminar el useEffect que cierra automáticamente el modal
  // El modal debe permanecer abierto hasta que el usuario lo cierre manualmente
  useEffect(() => {
    const handleAutoSave = async () => {
      // Solo ejecutar el guardado automático una vez cuando el modal se abre
      if (isOpen && !hasAutoSaved && paymentData && participantId && raffleId && selectedNumbers.length > 0) {
        console.log("[src/components/DigitalVoucher.tsx] Iniciando guardado automático de comprobante para participante:", paymentData.buyerName, "ID:", participantId, "números:", selectedNumbers);
        
        // Pequeño delay para asegurar que el DOM esté completamente renderizado
        setTimeout(async () => {
          try {
            const voucherUrl = await ensureReceiptSavedForParticipant(
              printRef,
              raffleDetails,
              participantId,
              raffleId || '',
              sellerId || '',
              selectedNumbers
            );
            
            if (voucherUrl) {
              console.log("[src/components/DigitalVoucher.tsx] Comprobante guardado automáticamente para participante:", paymentData.buyerName, "ID:", participantId, "URL:", voucherUrl);
              setHasAutoSaved(true);
            } else {
              console.error("[src/components/DigitalVoucher.tsx] Error al guardar comprobante para participante:", paymentData.buyerName, "participantId:", participantId, "no se pudo guardar la URL");
            }
          } catch (error) {
            console.error("[src/components/DigitalVoucher.tsx] Error durante el guardado automático:", error);
          }
        }, 1000);
      }
    };

    handleAutoSave();
  }, [isOpen, hasAutoSaved, paymentData, participantId, raffleId, sellerId, selectedNumbers, raffleDetails]);

  // Resetear el estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      console.log("[src/components/DigitalVoucher.tsx] Modal cerrado, reseteando estado de guardado automático");
      setHasAutoSaved(false);
    }
  }, [isOpen]);

  if (!paymentData) {
    console.log("[src/components/DigitalVoucher.tsx] No hay datos de pago disponibles");
    return null;
  }

  console.log("[src/components/DigitalVoucher.tsx] Renderizando comprobante para participante:", paymentData.buyerName, "ID:", participantId, "con números:", selectedNumbers);

  const handleDownload = async () => {
    console.log("[src/components/DigitalVoucher.tsx] Iniciando descarga de comprobante para participante:", paymentData.buyerName, "ID:", participantId);
    
    const imgData = await exportVoucherAsImage(printRef.current, '');
    if (imgData) {
      const fileName = `comprobante_${paymentData.buyerName.replace(/\s+/g, '_')}_${selectedNumbers.join('-')}_${new Date().getTime()}.png`;
      downloadVoucherImage(imgData, fileName);
      console.log("[src/components/DigitalVoucher.tsx] Descarga completada para participante:", paymentData.buyerName, "archivo:", fileName);
    } else {
      console.error("[src/components/DigitalVoucher.tsx] Error al generar imagen para descarga - participante:", paymentData.buyerName, "ID:", participantId);
    }
  };

  const handlePresent = async () => {
    console.log("[src/components/DigitalVoucher.tsx] Iniciando presentación de comprobante para participante:", paymentData.buyerName, "ID:", participantId);
    
    const imgData = await exportVoucherAsImage(printRef.current, '');
    if (imgData) {
      presentVoucherImage(imgData);
      console.log("[src/components/DigitalVoucher.tsx] Presentación iniciada para participante:", paymentData.buyerName);
    } else {
      console.error("[src/components/DigitalVoucher.tsx] Error al generar imagen para presentación - participante:", paymentData.buyerName, "ID:", participantId);
    }
  };

  // CORRECCIÓN: Función de cierre manual del modal
  const handleManualClose = () => {
    console.log("[src/components/DigitalVoucher.tsx] Cierre manual del modal por el participante:", paymentData.buyerName, "ID:", participantId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-auto bg-white/95 backdrop-blur-sm"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="text-xl font-bold text-gray-800">
            Comprobante de Pago Digital
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Voucher Content */}
          <Card className="border-2 border-gray-300 bg-white">
            <CardContent className="p-6" ref={printRef}>
              <div className="text-center space-y-4">
                <div className="border-b-2 border-gray-200 pb-4">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {raffleDetails?.title || 'Comprobante de Pago'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Fecha: {new Date().toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-gray-600">Participante:</p>
                    <p className="font-semibold text-gray-800">{paymentData.buyerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono:</p>
                    <p className="font-semibold text-gray-800">{paymentData.buyerPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cédula:</p>
                    <p className="font-semibold text-gray-800">{paymentData.buyerCedula || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email:</p>
                    <p className="font-semibold text-gray-800">{paymentData.buyerEmail || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-sm text-gray-600">Números Comprados:</p>
                      <p className="font-bold text-xl text-blue-600">
                        {selectedNumbers.join(', ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cantidad:</p>
                      <p className="font-semibold text-gray-800">{selectedNumbers.length} números</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-sm text-gray-600">Precio por número:</p>
                      <p className="font-semibold text-gray-800">
                        ${raffleDetails?.price?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Pagado:</p>
                      <p className="font-bold text-xl text-green-600">
                        ${((raffleDetails?.price || 0) * selectedNumbers.length).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-sm text-gray-600">Método de Pago:</p>
                      <p className="font-semibold text-gray-800 capitalize">
                        {paymentData.paymentMethod === 'cash' ? 'Efectivo' : 
                         paymentData.paymentMethod === 'transfer' ? 'Transferencia' : 
                         paymentData.paymentMethod}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sorteo:</p>
                      <p className="font-semibold text-gray-800">
                        {raffleDetails?.lottery || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {raffleDetails?.dateLottery && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600">Fecha del Sorteo:</p>
                    <p className="font-semibold text-gray-800">{raffleDetails.dateLottery}</p>
                  </div>
                )}

                {paymentData.direccion && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600">Dirección:</p>
                    <p className="font-semibold text-gray-800">{paymentData.direccion}</p>
                  </div>
                )}

                <div className="border-t-2 border-gray-200 pt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Este comprobante es válido como prueba de participación en la rifa.
                    <br />
                    Conserve este documento hasta la fecha del sorteo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Descargar Comprobante
            </Button>
            
            <Button
              onClick={handlePresent}
              variant="outline"
              className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4" />
              Ver en Pantalla Completa
            </Button>
            
            <Button
              onClick={handleManualClose}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cerrar
            </Button>
          </div>

          {debugMode && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>Participant ID: {participantId}</p>
              <p>Raffle ID: {raffleId}</p>
              <p>Auto-saved: {hasAutoSaved ? 'Sí' : 'No'}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DigitalVoucher;
