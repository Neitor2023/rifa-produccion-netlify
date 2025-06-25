
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getSellerUuidFromCedula, isValidUuid } from '@/hooks/useRaffleData/useSellerIdMapping';

export const exportVoucherAsImage = async (
  content: HTMLDivElement | null,
  fileName: string
): Promise<string | null> => {
  if (!content) {
    console.error('[voucherExport.ts] ❌ No hay contenido para exportar');
    return null;
  }
  
  try {
    console.log('[voucherExport.ts] 📸 Preparando imagen del comprobante...');
    const html2canvas = (await import('html2canvas')).default;
    
    const canvas = await html2canvas(content, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      removeContainer: true,
      ignoreElements: (element) => {
        return element.tagName === 'IFRAME' || 
               element.tagName === 'SCRIPT' ||
               element.classList.contains('ignore-in-export');
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    console.log('[voucherExport.ts] ✅ Imagen del comprobante generada exitosamente');
    return imgData;
  } catch (error: any) {
    console.error('[voucherExport.ts] ❌ Error al generar imagen del comprobante:', error?.message || error);
    toast.error("No se pudo crear la imagen del comprobante. Intente nuevamente.");
    return null;
  }
};

export const downloadVoucherImage = (imgData: string, fileName: string): void => {
  try {
    console.log('[voucherExport.ts] 📥 Iniciando descarga:', fileName);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = imgData;
    link.click();
    
    toast.success("¡Descarga exitosa! El comprobante ha sido guardado en tus descargas.");
    console.log('[voucherExport.ts] ✅ Descarga completada');
  } catch (error: any) {
    console.error('[voucherExport.ts] ❌ Error en descarga:', error?.message || error);
    toast.error("Error al descargar el comprobante");
  }
};

export const presentVoucherImage = (imgData: string): void => {
  try {
    console.log('[voucherExport.ts] 👁️ Abriendo visualización de comprobante');
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
      console.log('[voucherExport.ts] ✅ Ventana de visualización abierta');
    } else {
      console.error('[voucherExport.ts] ❌ No se pudo abrir ventana de visualización');
      toast.error("No se pudo abrir la ventana de presentación. Verifique que no tenga bloqueadores de ventanas emergentes activados.");
    }
  } catch (error: any) {
    console.error('[voucherExport.ts] ❌ Error en visualización:', error?.message || error);
    toast.error("Error al visualizar el comprobante");
  }
};

// FUNCIÓN EXCLUSIVA PARA VOUCHERS - BUCKET paymentreceipturl
export const uploadVoucherToStorage = async (
  imgData: string, 
  raffleTitle: string, 
  numberId: string
): Promise<string | null> => {
  try {
    if (!imgData || !numberId) {
      console.error('[voucherExport.ts] ❌ INVESTIGACIÓN: No se puede subir VOUCHER - falta imagen o ID');
      return null;
    }

    const bucketName = 'paymentreceipturl'; // BUCKET EXCLUSIVO para vouchers
    console.log(`[voucherExport.ts] 🔄 INVESTIGACIÓN PROFUNDA: Subiendo VOUCHER exclusivamente a bucket correcto: ${bucketName}`);
    console.log('[voucherExport.ts] 🔍 VERIFICACIÓN: Esta función SOLO maneja vouchers, NO payment_proofs');

    // Convert base64 to blob
    const base64Data = imgData.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
    const blob = new Blob([new Uint8Array(byteArrays)], { type: 'image/png' });
    
    // Create a unique filename for voucher with clear identifier
    const fileName = `voucher_${raffleTitle.replace(/\s+/g, '_')}_${numberId}_${new Date().getTime()}.png`;
    console.log('[voucherExport.ts] 📋 INVESTIGACIÓN: Nombre de archivo del voucher:', fileName);
    
    // Note: Bucket creation is handled at infrastructure level
    
    console.log(`[voucherExport.ts] 📤 INVESTIGACIÓN: Subiendo VOUCHER a bucket exclusivo paymentreceipturl: ${fileName}`);
    
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true
      });
      
    if (uploadError) {
      console.error(`[voucherExport.ts] ❌ Error al subir VOUCHER a bucket ${bucketName}:`, uploadError);
      throw new Error(`Error uploading voucher: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    const imageUrl = urlData.publicUrl;
    console.log(`[voucherExport.ts] ✅ INVESTIGACIÓN: VOUCHER subido correctamente a bucket exclusivo ${bucketName}:`, imageUrl);
    console.log(`[voucherExport.ts] 🔍 VERIFICACIÓN FINAL: URL de voucher termina con /paymentreceipturl/:`, imageUrl.includes('/paymentreceipturl/'));
    
    return imageUrl;
    
  } catch (error) {
    console.error('[voucherExport.ts] ❌ ERROR CRÍTICO al subir VOUCHER:', error);
    toast.error("No se pudo guardar el comprobante en el servidor. Intente nuevamente.");
    return null;
  }
};

// CORRECCIÓN CRÍTICA: Función corregida para encontrar números del participante
const getParticipantNumbers = async (
  participantId: string,
  raffleId: string,
  sellerId: string,
  specificNumbers: string[]
): Promise<any[]> => {
  console.log('[voucherExport.ts] 🔍 CORRECCIÓN CRÍTICA: Buscando números del participante con datos:', { 
    participantId, 
    raffleId,
    specificNumbers, 
    sellerId 
  });
  
  try {
    // VALIDACIÓN CRÍTICA: Verificar que tenemos todos los datos necesarios
    if (!participantId || !raffleId || !sellerId || !specificNumbers || specificNumbers.length === 0) {
      console.error('[voucherExport.ts] ❌ CORRECCIÓN: Faltan datos críticos para búsqueda:', {
        tieneParticipantId: !!participantId,
        tieneRaffleId: !!raffleId,
        tieneSellerId: !!sellerId,
        tieneNumbers: !!(specificNumbers && specificNumbers.length > 0)
      });
      return [];
    }

    // Convert seller ID to UUID if necessary
    let sellerUuid: string | null = null;
    if (sellerId) {
      if (isValidUuid(sellerId)) {
        sellerUuid = sellerId;
        console.log('[voucherExport.ts] ✅ CORRECCIÓN: sellerId ya es UUID:', sellerUuid);
      } else {
        sellerUuid = await getSellerUuidFromCedula(sellerId);
        console.log('[voucherExport.ts] 🔄 CORRECCIÓN: Convirtiendo seller cédula a UUID:', sellerId, '->', sellerUuid);
      }
    }

    if (!sellerUuid) {
      console.error('[voucherExport.ts] ❌ CORRECCIÓN: No se pudo obtener UUID del vendedor');
      return [];
    }
    
    // Convert specificNumbers to integers for comparison
    const numericSpecificNumbers = specificNumbers.map(n => parseInt(n, 10));
    console.log('[voucherExport.ts] 🔢 CORRECCIÓN: Números específicos convertidos a enteros:', numericSpecificNumbers);
    
    // CORRECCIÓN CRÍTICA: Buscar con diferentes condiciones para diagnóstico
    console.log('[voucherExport.ts] 🚨 CORRECCIÓN: Iniciando búsqueda completa en raffle_numbers...');
    
    // Primero buscar TODOS los números del participante en esta rifa
    const { data: allParticipantNumbers, error: allError } = await supabase
      .from('raffle_numbers')
      .select('*')
      .eq('participant_id', participantId)
      .eq('raffle_id', raffleId);
    
    if (allError) {
      console.error('[voucherExport.ts] ❌ CORRECCIÓN: Error al buscar TODOS los números del participante:', allError);
    } else {
      console.log('[voucherExport.ts] 📊 CORRECCIÓN: TODOS los números del participante encontrados:', allParticipantNumbers?.length || 0);
      if (allParticipantNumbers && allParticipantNumbers.length > 0) {
        console.log('[voucherExport.ts] 🔍 CORRECCIÓN: Detalles de números encontrados:', allParticipantNumbers.map(n => ({
          id: n.id,
          number: n.number,
          status: n.status,
          seller_id: n.seller_id,
          participant_id: n.participant_id
        })));
      }
    }
    
    // Ahora buscar con la condición del seller específico
    const { data: participantNumbers, error } = await supabase
      .from('raffle_numbers')
      .select('id, number, updated_at, payment_method, seller_id, status, participant_id')
      .eq('participant_id', participantId)
      .eq('raffle_id', raffleId)
      .eq('seller_id', sellerUuid)
      .in('number', numericSpecificNumbers);
    
    if (error) {
      console.error('[voucherExport.ts] ❌ CORRECCIÓN: Error al buscar números específicos del participante:', error);
      return [];
    }
    
    if (participantNumbers && participantNumbers.length > 0) {
      console.log('[voucherExport.ts] ✅ CORRECCIÓN: Números específicos encontrados para el participante:', participantNumbers.length);
      console.log('[voucherExport.ts] 📋 CORRECCIÓN: Detalles de números específicos:', participantNumbers.map(n => ({
        id: n.id,
        number: n.number,
        status: n.status,
        seller_id: n.seller_id
      })));
      return participantNumbers;
    }
    
    // Si no encontramos con seller específico, intentar sin seller (más permisivo)
    console.log('[voucherExport.ts] ⚠️ CORRECCIÓN: No se encontraron números con seller específico, buscando sin seller...');
    const { data: participantNumbersNoSeller, error: noSellerError } = await supabase
      .from('raffle_numbers')
      .select('id, number, updated_at, payment_method, seller_id, status, participant_id')
      .eq('participant_id', participantId)
      .eq('raffle_id', raffleId)
      .in('number', numericSpecificNumbers);
    
    if (noSellerError) {
      console.error('[voucherExport.ts] ❌ CORRECCIÓN: Error al buscar números sin seller específico:', noSellerError);
      return [];
    }
    
    if (participantNumbersNoSeller && participantNumbersNoSeller.length > 0) {
      console.log('[voucherExport.ts] ✅ CORRECCIÓN: Números encontrados SIN filtro de seller:', participantNumbersNoSeller.length);
      console.log('[voucherExport.ts] 📋 CORRECCIÓN: Detalles números sin seller:', participantNumbersNoSeller.map(n => ({
        id: n.id,
        number: n.number,
        status: n.status,
        seller_id: n.seller_id,
        expected_seller: sellerUuid
      })));
      return participantNumbersNoSeller;
    }
    
    console.log('[voucherExport.ts] ❌ CORRECCIÓN: NO se encontraron números para el participante en ninguna búsqueda');
    return [];
    
  } catch (error) {
    console.error('[voucherExport.ts] ❌ CORRECCIÓN: Error CRÍTICO en getParticipantNumbers:', error);
    return [];
  }
};

export const updatePaymentReceiptUrlForParticipant = async (
  voucherUrl: string,
  participantId: string,
  raffleId: string,
  sellerId: string,
  clickedButtonType: string,
  specificNumbers: string[]
): Promise<boolean> => {
  try {
    console.log("[voucherExport.ts] 🔄 CORRECCIÓN CRÍTICA: Actualizando SOLO payment_receipt_url:", {
      voucherUrl,
      participantId,
      raffleId,
      specificNumbers,
      clickedButtonType,
      sellerId,
    });

    const numericSpecificNumbers = specificNumbers.map((n) => parseInt(n, 10));
    console.log("[voucherExport.ts] 🔢 CORRECCIÓN: Números convertidos:", numericSpecificNumbers);

    // Get participant numbers using the specific numbers provided
    const participantNumbers = await getParticipantNumbers(
      participantId,
      raffleId,
      sellerId,
      specificNumbers
    );

    if (participantNumbers.length === 0) {
      console.log('[voucherExport.ts] ❌ CORRECCIÓN: No se encontraron números para actualizar payment_receipt_url');
      return false;
    }

    console.log("[voucherExport.ts] 📋 CORRECCIÓN: Números encontrados para actualizar payment_receipt_url:", participantNumbers);

    let successCount = 0;

    for (const num of participantNumbers) {
      // CORRECCIÓN CRÍTICA: Solo actualizar payment_receipt_url, NO payment_proof
      const { error: updateError } = await supabase
        .from("raffle_numbers")
        .update({ payment_receipt_url: voucherUrl }) // SOLO este campo
        .eq("id", num.id);

      if (updateError) {
        console.error("[voucherExport.ts] ❌ CORRECCIÓN: Error al actualizar payment_receipt_url para número:", num.number, updateError.message);
      } else {
        console.log("[voucherExport.ts] ✅ CORRECCIÓN: payment_receipt_url actualizado correctamente para número:", num.number);
        console.log("[voucherExport.ts] 🔍 CORRECCIÓN: URL guardada termina con /paymentreceipturl/:", voucherUrl.includes('/paymentreceipturl/'));
        successCount++;
      }
    }

    console.log("[voucherExport.ts] 📊 CORRECCIÓN: Resumen de actualización payment_receipt_url:", {
      numerosEncontrados: participantNumbers.length,
      numerosActualizados: successCount,
      exito: successCount > 0
    });

    return successCount > 0;
  } catch (error: any) {
    console.error("[voucherExport.ts] ❌ CORRECCIÓN: ERROR CRÍTICO en updatePaymentReceiptUrlForParticipant:", error?.message || error);
    return false;
  }
};

// FUNCIÓN PARA AUTO-GUARDAR VOUCHER EXCLUSIVAMENTE EN payment_receipt_url
export const ensureReceiptSavedForParticipant = async (
  printRef: React.RefObject<HTMLDivElement>,
  raffleDetails: any | undefined,
  participantId: string,
  raffleId: string,
  sellerId: string,
  participantNumbers: string[],
  clickedButtonType?: string
): Promise<string | null> => {
  console.log('[voucherExport.ts] 💾 AUTO-GUARDADO: Iniciando guardado automático de VOUCHER en payment_receipt_url...');
  console.log('[voucherExport.ts] 📋 Datos para auto-guardado:', { participantId, clickedButtonType, participantNumbers, sellerId });
  
  if (!printRef.current || !raffleDetails || !participantId) {
    console.error('[voucherExport.ts] ❌ Error: No hay referencia al comprobante o detalles de rifa para auto-guardado');
    return null;
  }
  
  try {
    // Generate the voucher image
    const imgData = await exportVoucherAsImage(printRef.current, '');
    if (!imgData) {
      console.error("[voucherExport.ts] ❌ Error: No se pudo generar la imagen del VOUCHER para auto-guardado");
      return null;
    }
    
    // Create a unique receipt ID for voucher
    const receiptId = `auto_voucher_${new Date().getTime()}_${participantId}`;
    
    // Upload voucher to EXCLUSIVE storage bucket
    console.log('[voucherExport.ts] 📤 AUTO-GUARDADO: Preparando subida de VOUCHER a bucket exclusivo paymentreceipturl...');
    const imageUrl = await uploadVoucherToStorage(
      imgData, 
      raffleDetails.title, 
      receiptId
    );
    
    if (imageUrl) {
      console.log('[voucherExport.ts] ✅ AUTO-GUARDADO: VOUCHER subido correctamente a bucket exclusivo:', imageUrl);
      
      // Save VOUCHER URL to payment_receipt_url using specific numbers
      const success = await updatePaymentReceiptUrlForParticipant(
        imageUrl,
        participantId,
        raffleId,
        sellerId,
        clickedButtonType,
        participantNumbers
      );
      
      if (success) {
        console.log('[voucherExport.ts] ✅ AUTO-GUARDADO: VOUCHER guardado correctamente en payment_receipt_url');
        console.log('[voucherExport.ts] ✅ AUTO-GUARDADO: Finalizando guardado automático de VOUCHER');
        toast.success('Comprobante guardado automáticamente', {
          id: 'receipt-saved-toast',
          duration: 3000
        });
        return imageUrl;
      } else {
        console.error("[voucherExport.ts] ❌ Error al guardar URL del VOUCHER en payment_receipt_url durante auto-guardado");
        return null;
      }
    } else {
      console.error("[voucherExport.ts] ❌ Error al subir la imagen del VOUCHER durante auto-guardado");
      return null;
    }
  } catch (error: any) {
    console.error("[voucherExport.ts] ❌ Error FATAL en auto-guardado de VOUCHER:", error?.message || error);
    return null;
  }
};
