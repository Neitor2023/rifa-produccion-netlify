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

// Improved upload function with better error handling and logging
export const uploadVoucherToStorage = async (
  imgData: string, 
  raffleId: string, 
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
    const fileName = `receipt_${raffleId}_${numberId}_${new Date().getTime()}.png`;
    
    console.log('[DigitalVoucher.tsx] Verificando si existe el bucket paymentreceipturl');
    
    // First try to get the bucket to see if it exists
    const { data: bucketData, error: bucketError } = await supabase.storage
      .getBucket('paymentreceipturl');
    
    // Handle bucket creation if needed
    if (bucketError) {
      console.log('[DigitalVoucher.tsx] Error al obtener bucket:', bucketError.message);
      
      if (bucketError.message.includes('The resource was not found')) {
        console.log('[DigitalVoucher.tsx] El bucket no existe, se creará uno nuevo');
        
        // Create bucket with public access
        const { error: createBucketError } = await supabase.storage.createBucket('paymentreceipturl', {
          public: true
        });
        
        if (createBucketError) {
          console.error('[DigitalVoucher.tsx] Error al crear bucket:', createBucketError.message);
          throw new Error(`Error creating bucket: ${createBucketError.message}`);
        }
        
        console.log('[DigitalVoucher.tsx] Bucket creado exitosamente');
      } else {
        // Other errors with bucket operations
        throw new Error(`Error checking bucket: ${bucketError.message}`);
      }
    }
    
    console.log('[DigitalVoucher.tsx] Subiendo archivo:', fileName);
    
    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from('paymentreceipturl')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true
      });
      
    if (uploadError) {
      console.error('[DigitalVoucher.tsx] Error al subir archivo:', uploadError);
      throw new Error(`Error uploading file: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('paymentreceipturl')
      .getPublicUrl(fileName);
    
    const imageUrl = urlData.publicUrl;
    console.log('[DigitalVoucher.tsx] Imagen subida a Storage en paymentreceipturl:', imageUrl);
    
    // Update raffle_numbers table
    console.log('[DigitalVoucher.tsx] Actualizando raffle_numbers.payment_receipt_url para id:', numberId);
    const { error: updateError } = await supabase
      .from('raffle_numbers')
      .update({ payment_receipt_url: imageUrl })
      .eq('id', numberId);
    
    if (updateError) {
      console.error('[DigitalVoucher.tsx] Error al actualizar raffle_numbers:', updateError);
      throw new Error(`Error updating raffle_numbers: ${updateError.message}`);
    }
    
    console.log('[DigitalVoucher.tsx] Actualizando raffle_numbers.payment_receipt_url con:', imageUrl);
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
