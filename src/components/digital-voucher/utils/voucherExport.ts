import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getSellerUuidFromCedula } from '@/hooks/useRaffleData/useSellerIdMapping';

export const exportVoucherAsImage = async (
  content: HTMLDivElement | null,
  fileName: string
): Promise<string | null> => {
  if (!content) return null;
  
  try {
    console.log('[DigitalVoucher.tsx] - Preparando imagen del comprobante...');
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(content, {
      scale: 2, // Higher scale for better quality
      logging: false,
      useCORS: true,
      allowTaint: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    console.log('[DigitalVoucher.tsx] - Imagen del comprobante generada exitosamente');
    return imgData;
  } catch (error) {
    console.error('[DigitalVoucher.tsx] - Error al generar imagen del comprobante:', error);
    toast.error("No se pudo crear la imagen del comprobante. Intente nuevamente.");
    return null;
  }
};

export const downloadVoucherImage = (imgData: string, fileName: string): void => {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = imgData;
  link.click();
  
  toast.success("¡Descarga exitosa! El comprobante ha sido guardado en tus descargas.");
};

export const presentVoucherImage = (imgData: string): void => {
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(`
      <html>
        <head>
          <title>Comprobante de Pago</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              background: rgba(0, 0, 0, 0.9);
              min-height: 100vh;
              overflow: auto;
            }
            img {
              max-width: 95%;
              max-height: 95vh;
              object-fit: contain;
            }
            .close-btn {
              position: fixed;
              top: 20px;
              right: 20px;
              background: white;
              color: black;
              border: none;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              font-size: 20px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          </style>
        </head>
        <body>
          <button class="close-btn" onclick="window.close()">×</button>
          <img src="${imgData}" alt="Comprobante de pago" />
        </body>
      </html>
    `);
    newWindow.document.close();
  } else {
    toast.error("No se pudo abrir la ventana de presentación. Verifique que no tenga bloqueadores de ventanas emergentes activados.");
  }
};

// Improved upload function with better error handling and bucket creation
export const uploadVoucherToStorage = async (
  imgData: string, 
  raffleTitle: string, 
  numberId: string
): Promise<string | null> => {
  try {
    if (!imgData || !numberId) {
      console.error('[DigitalVoucher.tsx] - No se puede subir: falta la imagen o ID');
      return null;
    }

    console.log('[DigitalVoucher.tsx] - Subiendo imagen del comprobante a Supabase...');

    // Convert base64 to blob
    const base64Data = imgData.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
    const blob = new Blob([new Uint8Array(byteArrays)], { type: 'image/png' });
    
    // Create a unique filename
    const fileName = `receipt_${raffleTitle.replace(/\s+/g, '_')}_${numberId}_${new Date().getTime()}.png`;
    
    // Try to upload file directly, if it fails due to missing bucket we'll create it
    try {
      console.log('[DigitalVoucher.tsx] - Intentando subir archivo:', fileName);
      
      const { data, error: uploadError } = await supabase.storage
        .from('paymentreceipturl')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true
        });
        
      if (uploadError) {
        // Check if error is due to bucket not existing
        if (uploadError.message.includes('The resource was not found') || 
            uploadError.message.includes('Bucket not found')) {
          
          console.log('[DigitalVoucher.tsx] - El bucket no existe, se creará uno nuevo');
          
          // Create bucket with public access
          const { error: createBucketError } = await supabase.storage.createBucket('paymentreceipturl', {
            public: true
          });
          
          if (createBucketError) {
            console.error('[DigitalVoucher.tsx] - Error al crear bucket:', createBucketError.message);
            throw new Error(`Error creating bucket: ${createBucketError.message}`);
          }
          
          console.log('[DigitalVoucher.tsx] - Bucket creado exitosamente, reintentando subida');
          
          // Try upload again
          const { error: retryError } = await supabase.storage
            .from('paymentreceipturl')
            .upload(fileName, blob, {
              contentType: 'image/png',
              upsert: true
            });
            
          if (retryError) {
            console.error('[DigitalVoucher.tsx] - Error en segundo intento de subida:', retryError);
            throw new Error(`Error on retry upload: ${retryError.message}`);
          }
        } else {
          // Other upload error
          console.error('[DigitalVoucher.tsx] - Error al subir archivo:', uploadError);
          throw new Error(`Error uploading file: ${uploadError.message}`);
        }
      }
    } catch (bucketError: any) {
      // If this isn't about bucket not found, rethrow
      if (!bucketError.message?.includes('Bucket not found') && 
          !bucketError.message?.includes('The resource was not found')) {
        throw bucketError;
      }
      
      // Otherwise we've handled it above
      console.log('[DigitalVoucher.tsx] - Manejo de error de bucket completado');
    }
    
    // Get public URL (do this regardless of the path taken above)
    const { data: urlData } = supabase.storage
      .from('paymentreceipturl')
      .getPublicUrl(fileName);
    
    const imageUrl = urlData.publicUrl;
    console.log('[DigitalVoucher.tsx] - Imagen subida correctamente:', imageUrl);
    
    return imageUrl;
    
  } catch (error) {
    console.error('[DigitalVoucher.tsx] - Error al subir comprobante:', error);
    toast.error("No se pudo guardar el comprobante en el servidor. Intente nuevamente.");
    return null;
  }
};

// Update payment receipt URL for multiple numbers
export const updatePaymentReceiptUrlForNumbers = async (
  imageUrl: string,
  numberIds: string[]
): Promise<boolean> => {
  try {
    console.log('[voucherExport.ts] Updating payment_receipt_url for multiple numbers:', numberIds);
    
    if (!numberIds || numberIds.length === 0) {
      console.warn('[voucherExport.ts] No number IDs provided to update');
      return false;
    }
    
    const updatePromises = numberIds.map(async (id) => {
      const { error } = await supabase
        .from('raffle_numbers')
        .update({ payment_receipt_url: imageUrl })
        .eq('id', id);
        
      if (error) {
        console.error(`[voucherExport.ts] Error updating receipt URL for number ID ${id}:`, error);
        return false;
      }
      
      return true;
    });
    
    const results = await Promise.all(updatePromises);
    const allSuccessful = results.every(Boolean);
    
    if (allSuccessful) {
      console.log('[voucherExport.ts] Successfully updated receipt URL for all numbers');
    } else {
      console.error('[voucherExport.ts] Some updates failed');
    }
    
    return allSuccessful;
  } catch (error) {
    console.error('[voucherExport.ts] Error in updatePaymentReceiptUrlForNumbers:', error);
    return false;
  }
};

// Update payment receipt URL only for specific participant's numbers
export const updatePaymentReceiptUrlForParticipant = async (
  imageUrl: string,
  participantId: string,
  raffleId: string,
  sellerIdOrCedula?: string
): Promise<boolean> => {
  try {
    console.log('[voucherExport.ts] Actualizando payment_receipt_url para participante:', participantId);
    
    if (!participantId || !raffleId || !imageUrl) {
      console.error('[voucherExport.ts] Missing required parameters');
      return false;
    }
    
    // Get the actual UUID for the seller if a cedula was provided
    let sellerUuid = sellerIdOrCedula;
    
    if (sellerIdOrCedula && !sellerIdOrCedula.includes('-')) {
      // This looks like a cedula, not a UUID - get the UUID
      console.log('[voucherExport.ts] sellerIdOrCedula appears to be a cedula, looking up UUID');
      sellerUuid = await getSellerUuidFromCedula(sellerIdOrCedula);
      
      if (!sellerUuid) {
        console.error('[voucherExport.ts] Could not find seller UUID for cedula:', sellerIdOrCedula);
      } else {
        console.log('[voucherExport.ts] Found seller UUID:', sellerUuid);
      }
    }
    
    // Create the query to update only records belonging to this participant and raffle
    let query = supabase
      .from('raffle_numbers')
      .update({ payment_receipt_url: imageUrl })
      .eq('participant_id', participantId)
      .eq('raffle_id', raffleId);
      
    // If seller_id is provided, add it to the filter
    if (sellerUuid) {
      query = query.eq('seller_id', sellerUuid);
    }

    // Execute the update
    const { error, count } = await query;
      
    if (error) {
      console.error('[voucherExport.ts] Error updating receipt URL for participant:', error);
      return false;
    }
    
    console.log(`[voucherExport.ts] Successfully updated receipt URLs for participant. Records updated: ${count || 'unknown'}`);
    return true;
  } catch (error) {
    console.error('[voucherExport.ts] Error in updatePaymentReceiptUrlForParticipant:', error);
    return false;
  }
};

// New function to ensure automatic saving of receipt for selected numbers
export const ensureReceiptSavedForParticipant = async (
  voucherRef: React.RefObject<HTMLDivElement>,
  raffleDetails: {
    title: string;
    price?: number;
    lottery?: string;
    dateLottery?: string;
  } | undefined,
  participantId: string,
  raffleId: string,
  sellerIdOrCedula?: string,
  numbers?: string[]
): Promise<string | null> => {
  try {
    console.log('[DigitalVoucher.tsx] – Iniciando guardado automático de comprobante de pago...');
    
    if (!voucherRef.current || !raffleDetails || !participantId) {
      console.error('[DigitalVoucher.tsx] - Error al guardar comprobante: Faltan datos requeridos');
      return null;
    }
    
    // Generate the voucher image
    const imgData = await exportVoucherAsImage(voucherRef.current, '');
    if (!imgData) {
      console.error('[DigitalVoucher.tsx] - Error al guardar comprobante: No se pudo generar la imagen');
      return null;
    }
    
    // Create a unique identifier for this receipt
    const receiptId = `receipt_${new Date().getTime()}_${participantId}`;
    
    // Upload the image to storage
    const imageUrl = await uploadVoucherToStorage(imgData, raffleDetails.title || 'Rifa', receiptId);
    if (!imageUrl) {
      console.error('[DigitalVoucher.tsx] - Error al guardar comprobante: No se pudo subir la imagen');
      return null;
    }
    
    // Get the actual UUID for the seller if a cedula was provided
    let sellerUuid = sellerIdOrCedula;
    
    if (sellerIdOrCedula && !sellerIdOrCedula.includes('-')) {
      // This looks like a cedula, not a UUID - get the UUID
      sellerUuid = await getSellerUuidFromCedula(sellerIdOrCedula);
      console.log('[DigitalVoucher.tsx] - Convertido cédula de vendedor a UUID:', sellerUuid);
    }
    
    // Update the receipt URL for this participant's numbers
    const updateSuccess = await updatePaymentReceiptUrlForParticipant(
      imageUrl,
      participantId,
      raffleId,
      sellerUuid || sellerIdOrCedula
    );

    // Log result for each number (if numbers array provided)
    if (numbers && numbers.length > 0) {
      numbers.forEach(numero => {
        console.log('[DigitalVoucher.tsx] - Comprobante guardado correctamente para número:', numero);
      });
    }
    
    if (updateSuccess) {
      console.log('[DigitalVoucher.tsx] - Finalizando guardado automático de comprobante de pago');
      toast.success('Comprobante guardado automáticamente', {
        id: 'receipt-saved-toast',
        duration: 3000
      });
      return imageUrl;
    } else {
      console.error('[DigitalVoucher.tsx] - Error al guardar comprobante: Fallo al actualizar URLs');
      return null;
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Error desconocido';
    // If numbers array is provided, log the error for each number
    if (numbers && numbers.length > 0) {
      numbers.forEach(numero => {
        console.error('[DigitalVoucher.tsx] – Error al guardar comprobante – número:', numero, '– Error:', errorMessage);
      });
    } else {
      console.error('[DigitalVoucher.tsx] - Error al guardar comprobante:', errorMessage);
    }
    return null;
  }
};
