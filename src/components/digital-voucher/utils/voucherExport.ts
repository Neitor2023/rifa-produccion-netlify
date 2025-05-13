
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const exportVoucherAsImage = async (
  content: HTMLDivElement | null,
  fileName: string
): Promise<string | null> => {
  if (!content) return null;
  
  try {
    console.log('[DigitalVoucher.tsx] Exportando comprobante a imagen');
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(content, {
      scale: 2, // Higher scale for better quality
      logging: false,
      useCORS: true,
      allowTaint: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    return imgData;
  } catch (error) {
    console.error('[DigitalVoucher.tsx] Error al exportar comprobante:', error);
    toast({
      title: "Error al generar la imagen",
      description: "No se pudo crear la imagen del comprobante. Intente nuevamente.",
      variant: "destructive"
    });
    return null;
  }
};

export const downloadVoucherImage = (imgData: string, fileName: string): void => {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = imgData;
  link.click();
  
  toast({
    title: "¡Descarga exitosa!",
    description: "El comprobante ha sido guardado en tus descargas.",
  });
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
    toast({
      title: "Error",
      description: "No se pudo abrir la ventana de presentación. Verifique que no tenga bloqueadores de ventanas emergentes activados.",
      variant: "destructive"
    });
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
      console.error('[DigitalVoucher.tsx] No se puede subir: falta la imagen o ID');
      return null;
    }

    console.log('[DigitalVoucher.tsx] Iniciando subida de comprobante para numberId:', numberId);

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
      console.log('[DigitalVoucher.tsx] Intentando subir archivo:', fileName);
      
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
          
          console.log('[DigitalVoucher.tsx] El bucket no existe, se creará uno nuevo');
          
          // Create bucket with public access
          const { error: createBucketError } = await supabase.storage.createBucket('paymentreceipturl', {
            public: true
          });
          
          if (createBucketError) {
            console.error('[DigitalVoucher.tsx] Error al crear bucket:', createBucketError.message);
            throw new Error(`Error creating bucket: ${createBucketError.message}`);
          }
          
          console.log('[DigitalVoucher.tsx] Bucket creado exitosamente, reintentando subida');
          
          // Try upload again
          const { error: retryError } = await supabase.storage
            .from('paymentreceipturl')
            .upload(fileName, blob, {
              contentType: 'image/png',
              upsert: true
            });
            
          if (retryError) {
            console.error('[DigitalVoucher.tsx] Error en segundo intento de subida:', retryError);
            throw new Error(`Error on retry upload: ${retryError.message}`);
          }
        } else {
          // Other upload error
          console.error('[DigitalVoucher.tsx] Error al subir archivo:', uploadError);
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
      console.log('[DigitalVoucher.tsx] Manejo de error de bucket completado');
    }
    
    // Get public URL (do this regardless of the path taken above)
    const { data: urlData } = supabase.storage
      .from('paymentreceipturl')
      .getPublicUrl(fileName);
    
    const imageUrl = urlData.publicUrl;
    console.log('[DigitalVoucher.tsx] Imagen subida a Storage en paymentreceipturl:', imageUrl);
    
    // Update all raffle_numbers for this purchase
    console.log('[DigitalVoucher.tsx] Actualizando raffle_numbers.payment_receipt_url para id:', numberId);
    const { error: updateError } = await supabase
      .from('raffle_numbers')
      .update({ payment_receipt_url: imageUrl })
      .eq('id', numberId);
    
    if (updateError) {
      console.error('[DigitalVoucher.tsx] Error al actualizar raffle_numbers:', updateError);
      throw new Error(`Error updating raffle_numbers: ${updateError.message}`);
    }
    
    console.log('[DigitalVoucher.tsx] Actualización completada con éxito');
    return imageUrl;
    
  } catch (error) {
    console.error('[DigitalVoucher.tsx] Error al subir comprobante:', error);
    toast({
      title: "Error al guardar el comprobante",
      description: "No se pudo guardar el comprobante en el servidor. Intente nuevamente.",
      variant: "destructive"
    });
    return null;
  }
};

// Function to update payment receipt URL for multiple numbers
export const updatePaymentReceiptUrlForNumbers = async (
  imageUrl: string,
  numberIds: string[]
): Promise<boolean> => {
  try {
    console.log('[voucherExport.ts] Updating payment_receipt_url for multiple numbers:', numberIds);
    
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
