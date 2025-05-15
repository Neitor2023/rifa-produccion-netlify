
import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogClose,
  DialogHeader,
  DialogTitle,  
} from '@/components/ui/dialog';
import { X, LoaderCircle } from 'lucide-react';
import { Toaster } from 'sonner';
import { ValidatedBuyerInfo } from '@/types/participant';

import { PaymentModalActions } from './payment/PaymentModalActions';
import PaymentModalContent from './payment/PaymentModalContent';
import { NumberSelectionProvider } from '@/contexts/NumberSelectionContext';
import { usePaymentForm } from '@/hooks/usePaymentForm';
import { PaymentFormData } from '@/schemas/paymentFormSchema';
import { Card, CardHeader } from "@/components/ui/card";
import { Organization } from '@/lib/constants/types';
import { useNumberSelection } from '@/contexts/NumberSelectionContext';
import { exportVoucherAsImage, uploadVoucherToStorage, updatePaymentReceiptUrlForNumbers } from './digital-voucher/utils/voucherExport';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  price: number;
  onComplete: (paymentData: PaymentFormData) => void;
  buyerData?: ValidatedBuyerInfo;
  debugMode?: boolean;
  clickedButton?: string;
  organization?: Organization | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedNumbers,
  price,
  onComplete,
  buyerData,
  debugMode = false,
  clickedButton,
  organization
}) => {
  const {
    form,
    isSubmitting,
    previewUrl,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit
  } = usePaymentForm({
    buyerData,
    onComplete,
    isOpen,
    debugMode,
    clickedButton
  });
  
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { clearSelectionState } = useNumberSelection();
  const voucherRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Enhanced function for saving voucher for all numbers
  const saveVoucherForAllNumbers = async (paymentData: PaymentFormData): Promise<string | null> => {
    if (selectedNumbers.length === 0) return null;
    
    try {
      console.log('[PaymentModal.tsx] Iniciando el guardado automático de cupones para números:', selectedNumbers);
      
      // 1. First, get IDs for all selected numbers (existing ones)
      const numberIds: string[] = [];
      
      // Convert selected numbers to integers for proper database comparison
      const selectedNumberInts = selectedNumbers.map(num => parseInt(num, 10));
      
      // Query to get IDs of existing numbers
      const { data: existingNumbers, error: queryError } = await supabase
        .from('raffle_numbers')
        .select('id, number, participant_id')
        .eq('raffle_id', 'fd6bd3bc-d81f-48a9-be58-8880293a0472') // Using RAFFLE_ID constant
        .in('number', selectedNumberInts);
      
      if (queryError) {
        console.error('[PaymentModal.tsx] Error checking existing numbers:', queryError);
      } else if (existingNumbers && existingNumbers.length > 0) {
        // Store IDs of existing numbers
        numberIds.push(...existingNumbers.map(item => item.id));
        console.log('[PaymentModal.tsx] Found existing number IDs:', numberIds);
        
        // If this is the "Pagar Apartados" flow, filter only for current participant's numbers
        if (clickedButton === "Pagar Apartados" && paymentData.participantId) {
          console.log('[PaymentModal.tsx] Filtering numbers for participant:', paymentData.participantId);
          const participantNumberIds = existingNumbers
            .filter(item => item.participant_id === paymentData.participantId)
            .map(item => item.id);
            
          if (participantNumberIds.length > 0) {
            numberIds.length = 0; // Clear the array
            numberIds.push(...participantNumberIds); // Add only participant's numbers
            console.log('[PaymentModal.tsx] Filtered to participant number IDs:', numberIds);
          }
        }
      } else {
        console.log('[PaymentModal.tsx] No existing numbers found, receipt will be created but associated later');
      }
      
      // 2. Generate receipt content
      // Create temporary div for receipt rendering
      const tempReceiptContainer = document.createElement('div');
      tempReceiptContainer.style.position = 'absolute';
      tempReceiptContainer.style.left = '-9999px';
      document.body.appendChild(tempReceiptContainer);
      
      // 3. Prepare raffle details for voucher
      const raffleDetails = {
        title: organization?.organization_name || 'Rifa',
        price: price,
        lottery: '',
        dateLottery: new Date().toLocaleDateString()
      };
      
      // 4. Generate receipt image
      console.log('[PaymentModal.tsx] Generating voucher image');
      
      // Generate receipt URL based on domain using first number's ID or a placeholder
      const domain = window.location.hostname || 'rifamax.com';
      const protocol = window.location.protocol || 'https:';
      const receiptBaseUrl = `${protocol}//${domain}/receipt/`;
      const receiptUrl = receiptBaseUrl + (numberIds.length > 0 ? numberIds[0] : 'pending');
      
      // Create formatted date for receipt
      const formattedDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Calculate total payment amount
      const totalAmount = price * selectedNumbers.length;
      
      // Create content for voucher in temporary container
      tempReceiptContainer.innerHTML = `
        <div class="print-content p-1">
          <div class="p-6 mb-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
            <div class="flex flex-col space-y-4">
              <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 class="font-bold text-xl mb-2 text-purple-700 dark:text-purple-400 text-center">
                  ${raffleDetails.title}
                </h3>
                
                ${raffleDetails.lottery ? `
                <div class="w-full text-center font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                  ${raffleDetails.lottery}
                </div>` : ''}
                
                ${paymentData.buyerName ? `
                <div class="mb-2 text-md font-semibold text-gray-800 dark:text-gray-200">
                  Cliente: ${paymentData.buyerName}
                </div>` : ''}
                
                <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-900 dark:text-gray-200">
                  <div>
                    <span class="font-semibold">Valor por número:</span> 
                    ${raffleDetails.price.toFixed(2)}
                  </div>
                  <div>
                    <span class="font-semibold">Total a pagar:</span> 
                    <span class="font-bold">${totalAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span class="font-semibold">Fecha Emisión:</span> 
                    <div class="text-xs">${formattedDate}</div>
                  </div>
                  <div>
                    <span class="font-semibold">Fecha Sorteo:</span> 
                    <div class="text-xs">
                      ${raffleDetails.dateLottery || '-'}
                    </div>
                  </div>
                  <div>
                    <span class="font-semibold">Método de pago:</span> 
                    ${paymentData.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia bancaria'}
                  </div>
                  <div>
                    <span class="font-semibold">Núm. seleccionados:</span> 
                    ${selectedNumbers.length}
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex justify-center items-center">
                  <!-- QR code placeholder -->
                  <div style="width: 150px; height: 150px; background-color: #f0f0f0; display: flex; justify-content: center; align-items: center;">
                    QR: ${receiptUrl}
                  </div>
                </div>

                <div class="flex flex-col justify-center">
                  <p class="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-1">Números comprados:</p>
                  <div class="flex flex-wrap gap-1 mt-1">
                    ${selectedNumbers.map(num => `
                      <span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs font-medium">
                        ${num}
                      </span>
                    `).join('')}
                  </div>
                </div>
              </div>
              
              ${paymentData.paymentMethod === 'transfer' && paymentData.paymentProof && typeof paymentData.paymentProof === 'string' ? `
              <div class="border-t border-gray-300 dark:border-gray-700 my-2 pt-2">
                <h3 class="font-semibold text-sm text-gray-800 dark:text-gray-300 mb-2">Comprobante de Transferencia</h3>
                <div class="flex justify-center">
                  <img 
                    src="${paymentData.paymentProof}" 
                    alt="Comprobante de pago" 
                    class="w-auto h-auto max-h-[150px] object-contain"
                  />
                </div>
              </div>` : ''}
              
              <div class="border-t border-gray-300 dark:border-gray-700 mt-2 pt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                <p>Este comprobante valida la compra de los números seleccionados.</p>
                <p>Guárdelo como referencia para futuras consultas.</p>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Generate receipt image
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(tempReceiptContainer, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Clean up temporary element
      document.body.removeChild(tempReceiptContainer);
      
      // If we have image data, upload it to storage
      if (imgData && raffleDetails) {
        // Upload with first number ID if available, otherwise use a timestamp
        const firstNumberId = numberIds.length > 0 ? numberIds[0] : `temp_${new Date().getTime()}`;
        
        console.log('[PaymentModal.tsx] Uploading receipt image for ID:', firstNumberId);
        const imageUrl = await uploadVoucherToStorage(
          imgData, 
          raffleDetails.title,
          firstNumberId
        );
        
        if (imageUrl) {
          console.log('[PaymentModal.tsx] Successfully uploaded receipt. URL:', imageUrl);
          
          // If we have number IDs, update all raffle numbers with the receipt URL
          if (numberIds.length > 0) {
            console.log('[PaymentModal.tsx] Updating existing raffle numbers with receipt URL:', numberIds);
            const updateSuccess = await updatePaymentReceiptUrlForNumbers(imageUrl, numberIds);
            
            if (updateSuccess) {
              toast({
                title: "Comprobante guardado automáticamente",
                description: "El comprobante ha sido almacenado en el sistema para todos los números.",
              });
            }
          } else {
            // Store URL for later association (after numbers are created)
            console.log('[PaymentModal.tsx] No existing numbers to update now, storing URL for later');
            // We'll add the URL to formData to be used in the onComplete handler
          }
          
          return imageUrl;
        }
      }
      
      return null;
    } catch (error) {
      console.error('[PaymentModal.tsx] Error in saveVoucherForAllNumbers:', error);
      return null;
    }
  };
  
  // Compruebe si el formulario es válido según los campos obligatorios
  const formValues = form.getValues();
  const isFormValid = (): boolean => {
    //Campos obligatorios predeterminados
    const requiredFields = ['buyerName', 'buyerPhone', 'buyerCedula', 'paymentMethod'];
    
    // Agregar campos según el contexto del botón
    if (clickedButton === 'Pagar') {
      // Para "Pagar Directo" necesitamos todos los campos
      requiredFields.push('buyerEmail', 'direccion');
    } else if (clickedButton === 'Pagar Apartados') {
      // Para "Pagar Apartados" necesitamos correo electrónico y dirección.
      requiredFields.push('buyerEmail', 'direccion');
    }
    
    // Verificar si el método de pago es transferencia y necesita comprobante
    if (formValues.paymentMethod === 'transfer' && !previewUrl) {
      return false;
    }
    
    // Verifique todos los campos obligatorios
    return requiredFields.every(field => 
      formValues[field as keyof PaymentFormData] && 
      String(formValues[field as keyof PaymentFormData]).trim() !== ''
    );
  };

  const submissionHandler = async (): Promise<void> => {
    setIsSearching(true);
    try {
      if (!isFormValid()) {
        console.log("Form validation failed");
        form.trigger(); // Validación de disparadores para mostrar mensajes de error
        setIsSearching(false);
        return;
      }
      
      // Obtener los datos del formulario
      const formData = form.getValues();
      
      console.log(`[PaymentModal.tsx] Processing submission with button type: ${clickedButton}`);
      
      // Store the button type in the form data for later use
      formData.clickedButtonType = clickedButton;
      
      // Ensure payment proof is included in the form data if it exists
      if (previewUrl && formData.paymentMethod === 'transfer') {
        formData.paymentProof = previewUrl;
      }
      
      // IMPORTANTE: Guarde automáticamente el comprobante de pago para todos los números ANTES del envío
      // Esto garantiza que los cupones se guarden incluso si el usuario no abre o ve el modal del cupón.
      const imageUrl = await saveVoucherForAllNumbers(formData);
      
      // Envíe el formulario para completar el proceso de pago
      await handleSubmit();
      
      // Incluya la URL de la imagen guardada con los datos del formulario
      if (imageUrl) {
        formData.paymentReceiptUrl = imageUrl;
      }
      
      // Ahora onComplete con los datos del formulario actualizado
      onComplete(formData);
      
    } finally {
      setIsSearching(false);
    }
  };

  // Manejar el modal cerca de borrar selecciones
  const handleCloseModal = (): void => {
    console.log("[PaymentModal.tsx] Cerrar modalidad de pago y compensar selecciones");
    clearSelectionState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
      <DialogContent className="sm:max-w-md md:max-w-xl min-h-[85vh] max-h-[90vh] flex flex-col bg-white/20 backdrop-blur-md rounded-xl border-0 shadow-xl">
        <Card className="bg-transparent border-0 shadow-none">
          <DialogHeader className="pt-1 pb-1">
            <Card className="bg-[#9b87f5] dark:bg-[#7E69AB] shadow-md border-0">
              <CardHeader className="py-3 px-4">

                <DialogTitle asChild>
                  <button
                    type="button"
                    className="w-full cursor-pointer text-lg text-white font-bold text-center flex items-center justify-center"
                    onClick={submissionHandler}
                    disabled={isSubmitting || isSearching}
                  >
                    {(isSubmitting || isSearching) && (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirma tu pago
                  </button>
                </DialogTitle>                
                
                <DialogClose 
                  className="absolute right-10 top-9 rounded-sm bg-[#3d3d3d] hover:bg-[#1a1a1a] opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-white"
                  onClick={handleCloseModal}
                >
                  <X className="h-4 w-4"/>
                  <span className="sr-only">Close</span>
                </DialogClose>                                      
              </CardHeader>
            </Card>
          </DialogHeader>
          
          <PaymentModalContent
            form={form}
            selectedNumbers={selectedNumbers}
            price={price}
            previewUrl={previewUrl}
            buyerData={buyerData}
            onFileUpload={handleImageUpload}
            onFileRemove={handleRemoveImage}
            clickedButton={clickedButton}
            organization={organization}
          />
          
          <PaymentModalActions 
            isSubmitting={isSubmitting || isSearching}
            isFormValid={isFormValid()}
            onClose={handleCloseModal}
            onSubmit={submissionHandler}
          />
        </Card>
        
        <Toaster
          position="top-right"
          visibleToasts={10}
          gap={12}
          closeButton
        />
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
export type { PaymentFormData };
