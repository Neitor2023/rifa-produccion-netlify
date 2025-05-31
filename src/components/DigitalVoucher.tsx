
import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Eye, X } from 'lucide-react';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { toast } from 'sonner';
import { exportVoucherAsImage, downloadVoucherImage, presentVoucherImage, ensureReceiptSavedForParticipant } from '@/components/digital-voucher/utils/voucherExport';
import { Organization } from '@/lib/constants/types';

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
  organization?: Organization | null;
  allowVoucherPrint?: boolean;
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
  sellerId,
  organization,
  allowVoucherPrint = true
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [hasAutoSaved, setHasAutoSaved] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Efecto para guardar automáticamente el comprobante cuando el modal esté completamente cargado
  useEffect(() => {
    const handleAutoSave = async () => {
      // Solo ejecutar si el modal está abierto, no se ha guardado antes, y hay datos válidos
      if (isOpen && !hasAutoSaved && paymentData && participantId && raffleId && selectedNumbers.length > 0 && !isGeneratingImage) {
        console.log("[src/components/DigitalVoucher.tsx] + Iniciando emisión de voucher del participante", {
          nombreParticipante: paymentData.buyerName,
          emailParticipante: paymentData.buyerEmail,
          idParticipante: participantId,
          numerosSeleccionados: selectedNumbers,
          cantidadNumeros: selectedNumbers.length
        });
        
        // Dar tiempo para que el DOM se renderice completamente
        setTimeout(async () => {
          try {
            setIsGeneratingImage(true);
            console.log("[src/components/DigitalVoucher.tsx] + Generando imagen del comprobante para participante:", paymentData.buyerName, "con números:", selectedNumbers);
            
            const voucherUrl = await ensureReceiptSavedForParticipant(
              printRef,
              raffleDetails,
              participantId,
              raffleId || '',
              sellerId || '',
              selectedNumbers
            );
            
            if (voucherUrl) {
              console.log("[src/components/DigitalVoucher.tsx] + ✅ Comprobante guardado automáticamente para participante:", {
                nombreParticipante: paymentData.buyerName,
                idParticipante: participantId,
                urlComprobante: voucherUrl,
                numerosGuardados: selectedNumbers
              });
              setHasAutoSaved(true);
              toast.success('Comprobante generado y guardado correctamente', {
                id: 'voucher-success-toast',
                duration: 3000
              });
            } else {
              console.error("[src/components/DigitalVoucher.tsx] + ❌ Error al guardar comprobante para participante:", {
                nombreParticipante: paymentData.buyerName,
                idParticipante: participantId,
                error: "No se pudo generar la URL del comprobante"
              });
            }
          } catch (error) {
            console.error("[src/components/DigitalVoucher.tsx] + ❌ Error durante generación automática del comprobante:", {
              nombreParticipante: paymentData.buyerName,
              idParticipante: participantId,
              error: error
            });
          } finally {
            setIsGeneratingImage(false);
          }
        }, 1500); // Incrementar el tiempo para asegurar renderizado completo
      }
    };

    handleAutoSave();
  }, [isOpen, hasAutoSaved, paymentData, participantId, raffleId, sellerId, selectedNumbers, raffleDetails, isGeneratingImage]);

  // Resetear el estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      console.log("[src/components/DigitalVoucher.tsx] + Modal cerrado manualmente, reseteando estados");
      setHasAutoSaved(false);
      setIsGeneratingImage(false);
    }
  }, [isOpen]);

  if (!paymentData) {
    console.log("[src/components/DigitalVoucher.tsx] + ⚠️ No hay datos de pago disponibles para mostrar el comprobante");
    return null;
  }

  console.log("[src/components/DigitalVoucher.tsx] + Renderizando comprobante digital para participante:", {
    nombreParticipante: paymentData.buyerName,
    emailParticipante: paymentData.buyerEmail,
    idParticipante: participantId,
    numerosSeleccionados: selectedNumbers,
    estadoGuardado: hasAutoSaved ? 'Guardado' : 'Pendiente'
  });

  const handleDownload = async () => {
    console.log("[src/components/DigitalVoucher.tsx] + Iniciando descarga manual de comprobante para participante:", {
      nombreParticipante: paymentData.buyerName,
      idParticipante: participantId
    });
    
    try {
      const imgData = await exportVoucherAsImage(printRef.current, '');
      if (imgData) {
        const fileName = `comprobante_${paymentData.buyerName.replace(/\s+/g, '_')}_${selectedNumbers.join('-')}_${new Date().getTime()}.png`;
        downloadVoucherImage(imgData, fileName);
        console.log("[src/components/DigitalVoucher.tsx] + ✅ Descarga completada para participante:", paymentData.buyerName, "archivo:", fileName);
      } else {
        console.error("[src/components/DigitalVoucher.tsx] + ❌ Error al generar imagen para descarga - participante:", paymentData.buyerName);
      }
    } catch (error) {
      console.error("[src/components/DigitalVoucher.tsx] + ❌ Error durante descarga manual:", error);
    }
  };

  const handlePresent = async () => {
    console.log("[src/components/DigitalVoucher.tsx] + Iniciando presentación de comprobante para participante:", {
      nombreParticipante: paymentData.buyerName,
      idParticipante: participantId
    });
    
    try {
      const imgData = await exportVoucherAsImage(printRef.current, '');
      if (imgData) {
        presentVoucherImage(imgData);
        console.log("[src/components/DigitalVoucher.tsx] + ✅ Presentación iniciada para participante:", paymentData.buyerName);
      } else {
        console.error("[src/components/DigitalVoucher.tsx] + ❌ Error al generar imagen para presentación - participante:", paymentData.buyerName);
      }
    } catch (error) {
      console.error("[src/components/DigitalVoucher.tsx] + ❌ Error durante presentación:", error);
    }
  };

  // Función de cierre manual - ÚNICA forma de cerrar el modal
  const handleManualClose = () => {
    console.log("[src/components/DigitalVoucher.tsx] + Cierre manual del modal por participante:", {
      nombreParticipante: paymentData.buyerName,
      idParticipante: participantId,
      comprobanteGuardado: hasAutoSaved
    });
    onClose();
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={() => {}} // Prevenir cierre automático
    >
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-auto bg-white/98 backdrop-blur-sm border border-gray-200 shadow-2xl rounded-lg"
        onInteractOutside={(e) => e.preventDefault()} // Prevenir cierre por click fuera
        onEscapeKeyDown={(e) => e.preventDefault()} // Prevenir cierre por ESC
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            📄 Comprobante de Pago Digital
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualClose}
            className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
            <span className="sr-only">Cerrar comprobante</span>
          </Button>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Contenido del Comprobante - Diseño Original Restaurado */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50/30 shadow-lg rounded-lg">
            <CardContent className="p-8" ref={printRef}>
              <div className="text-center space-y-6">
                {/* Encabezado del Comprobante */}
                <div className="border-b-2 border-blue-300 pb-6 mb-6">
                  <h2 className="text-3xl font-bold text-blue-800 mb-3">
                    {raffleDetails?.title || 'Comprobante de Pago'}
                  </h2>
                  <p className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full inline-block">
                    📅 Emitido: {new Date().toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Información del Participante */}
                <div className="grid grid-cols-2 gap-6 text-left bg-white/60 p-6 rounded-lg border border-gray-200">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">👤 Participante:</p>
                    <p className="font-bold text-lg text-gray-800">{paymentData.buyerName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">📱 Teléfono:</p>
                    <p className="font-semibold text-gray-800">{paymentData.buyerPhone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">🆔 Cédula:</p>
                    <p className="font-semibold text-gray-800">{paymentData.buyerCedula || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">📧 Email:</p>
                    <p className="font-semibold text-gray-800 text-sm break-all">{paymentData.buyerEmail || 'N/A'}</p>
                  </div>
                </div>

                {/* Números Comprados */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                  <div className="grid grid-cols-2 gap-6 text-left">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">🎯 Números Comprados:</p>
                      <p className="font-bold text-2xl text-green-700 bg-white px-4 py-2 rounded-lg border border-green-300">
                        {selectedNumbers.join(', ')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">📊 Cantidad:</p>
                      <p className="font-semibold text-xl text-gray-800">{selectedNumbers.length} número{selectedNumbers.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                {/* Información de Pago */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
                  <div className="grid grid-cols-2 gap-6 text-left">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">💰 Precio por número:</p>
                      <p className="font-semibold text-lg text-gray-800">
                        ${raffleDetails?.price?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">💵 Total Pagado:</p>
                      <p className="font-bold text-2xl text-green-600 bg-white px-4 py-2 rounded-lg border border-green-300">
                        ${((raffleDetails?.price || 0) * selectedNumbers.length).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detalles del Sorteo */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                  <div className="grid grid-cols-2 gap-6 text-left">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">💳 Método de Pago:</p>
                      <p className="font-semibold text-lg text-gray-800 capitalize bg-white px-3 py-1 rounded border">
                        {paymentData.paymentMethod === 'cash' ? '💵 Efectivo' : 
                         paymentData.paymentMethod === 'transfer' ? '🏦 Transferencia' : 
                         paymentData.paymentMethod}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">🎲 Sorteo:</p>
                      <p className="font-semibold text-lg text-gray-800 bg-white px-3 py-1 rounded border">
                        {raffleDetails?.lottery || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {raffleDetails?.dateLottery && (
                  <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                    <p className="text-sm font-medium text-gray-600 mb-1">📅 Fecha del Sorteo:</p>
                    <p className="font-bold text-xl text-yellow-800">{raffleDetails.dateLottery}</p>
                  </div>
                )}

                {paymentData.direccion && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-600 mb-1">🏠 Dirección:</p>
                    <p className="font-semibold text-gray-800">{paymentData.direccion}</p>
                  </div>
                )}

                {/* Pie del Comprobante */}
                <div className="border-t-2 border-gray-300 pt-6 text-center bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-2xl">✅</span>
                    <p className="text-lg font-bold text-green-700">Comprobante Válido</p>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Este comprobante es válido como prueba de participación en la rifa.
                    <br />
                    <strong>Conserve este documento hasta la fecha del sorteo.</strong>
                    <br />
                    <span className="text-xs text-gray-500">
                      Generado automáticamente por el sistema Romy Rifa
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción - Diseño Mejorado */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center bg-gray-50 p-6 rounded-lg border border-gray-200">
            <Button
              onClick={handleDownload}
              disabled={isGeneratingImage}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all transform hover:scale-105"
            >
              <Download className="h-5 w-5" />
              Descargar Comprobante
            </Button>
            
            <Button
              onClick={handlePresent}
              disabled={isGeneratingImage}
              variant="outline"
              className="flex items-center gap-3 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg shadow-md transition-all transform hover:scale-105"
            >
              <Eye className="h-5 w-5" />
              Ver Pantalla Completa
            </Button>
            
            <Button
              onClick={handleManualClose}
              variant="secondary"
              className="flex items-center gap-3 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg shadow-md transition-all"
            >
              <X className="h-5 w-5" />
              Cerrar
            </Button>
          </div>

          {/* Estado del Guardado */}
          {isGeneratingImage && (
            <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <p className="text-blue-700 font-medium">Generando y guardando comprobante...</p>
            </div>
          )}
          
          {hasAutoSaved && !isGeneratingImage && (
            <div className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-600 text-xl">✅</span>
              <p className="text-green-700 font-medium">Comprobante guardado automáticamente</p>
            </div>
          )}

          {/* Información de Debug */}
          {debugMode && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300 text-xs font-mono">
              <p><strong>🔧 Debug Info:</strong></p>
              <p>Participant ID: {participantId}</p>
              <p>Raffle ID: {raffleId}</p>
              <p>Auto-saved: {hasAutoSaved ? 'Sí' : 'No'}</p>
              <p>Generating Image: {isGeneratingImage ? 'Sí' : 'No'}</p>
              <p>Allow Voucher Print: {allowVoucherPrint ? 'Sí' : 'No'}</p>
              <p>Organization: {organization?.organization_name || 'N/A'}</p>
              <p>Selected Numbers: {selectedNumbers.join(', ')}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DigitalVoucher;
