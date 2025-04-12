
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaymentFormData } from '@/components/PaymentModal';
import { toast } from 'sonner';

interface UsePaymentProcessorProps {
  raffleSeller: {
    id: string;
    seller_id: string;
  } | null;
  raffleId: string;
  raffleNumbers: any[];
  refetchRaffleNumbers: () => Promise<any>;
}

export function usePaymentProcessor({
  raffleSeller,
  raffleId,
  raffleNumbers,
  refetchRaffleNumbers
}: UsePaymentProcessorProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null);

  const handleReserveNumbers = async (numbers: string[]) => {
    if (!raffleSeller?.seller_id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    
    try {
      const updatePromises = numbers.map(async (numStr) => {
        const num = parseInt(numStr);
        const existingNumber = raffleNumbers?.find(n => n.number === num);
        
        if (existingNumber) {
          const { error } = await supabase
            .from('raffle_numbers')
            .update({ 
              status: 'reserved', 
              seller_id: raffleSeller.seller_id,
              reservation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('id', existingNumber.id);
          
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('raffle_numbers')
            .insert({ 
              raffle_id: raffleId, 
              number: num, 
              status: 'reserved', 
              seller_id: raffleSeller.seller_id,
              reservation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });
          
          if (error) throw error;
        }
      });
      
      await Promise.all(updatePromises);
      
      await refetchRaffleNumbers();
      
      setSelectedNumbers([]);
      toast.success(`${numbers.length} número(s) apartados exitosamente`);
    } catch (error) {
      console.error('Error reserving numbers:', error);
      toast.error('Error al apartar números');
    }
  };
  
  const handleProceedToPayment = (numbers: string[]) => {
    if (numbers.length === 0) {
      toast.error('Seleccione al menos un número para comprar');
      return;
    }
    
    const unavailableNumbers = numbers.filter(numStr => {
      const num = parseInt(numStr);
      const existingNumber = raffleNumbers?.find(n => n.number === num);
      return existingNumber && 
             existingNumber.status !== 'available' && 
             (existingNumber.status !== 'reserved' || existingNumber.seller_id !== raffleSeller?.seller_id);
    });
    
    if (unavailableNumbers.length > 0) {
      toast.error(`Números ${unavailableNumbers.join(', ')} no están disponibles`);
      return;
    }
    
    setSelectedNumbers(numbers);
    setIsPaymentModalOpen(true);
  };
  
  const handleCompletePayment = async (data: PaymentFormData) => {
    if (!raffleSeller?.seller_id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    
    try {
      let paymentProofUrl = null;
      
      if (data.paymentProof && data.paymentProof instanceof File) {
        const fileName = `${raffleId}_${Date.now()}_${data.paymentProof.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment_proofs')
          .upload(fileName, data.paymentProof);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('payment_proofs')
          .getPublicUrl(fileName);
          
        paymentProofUrl = urlData.publicUrl;
      }
      
      let participantId = null;
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id')
        .eq('phone', data.buyerPhone)
        .eq('raffle_id', raffleId)
        .maybeSingle();
      
      if (existingParticipant) {
        participantId = existingParticipant.id;
        
        await supabase
          .from('participants')
          .update({ name: data.buyerName })
          .eq('id', participantId);
      } else {
        const { data: newParticipant, error: participantError } = await supabase
          .from('participants')
          .insert({
            name: data.buyerName,
            phone: data.buyerPhone,
            email: '',
            raffle_id: raffleId,
            seller_id: raffleSeller.seller_id
          })
          .select('id')
          .single();
        
        if (participantError) throw participantError;
        
        participantId = newParticipant.id;
      }
      
      const updatePromises = selectedNumbers.map(async (numStr) => {
        const num = parseInt(numStr);
        const existingNumber = raffleNumbers?.find(n => n.number === num);
        
        if (existingNumber) {
          // If there's already a payment proof, don't overwrite it
          const proofToUse = paymentProofUrl || existingNumber.payment_proof;
          
          const { error } = await supabase
            .from('raffle_numbers')
            .update({ 
              status: 'sold', 
              seller_id: raffleSeller.seller_id,
              participant_id: participantId,
              payment_proof: proofToUse,
              payment_approved: true,
              reservation_expires_at: null
            })
            .eq('id', existingNumber.id);
          
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('raffle_numbers')
            .insert({ 
              raffle_id: raffleId, 
              number: num, 
              status: 'sold', 
              seller_id: raffleSeller.seller_id,
              participant_id: participantId,
              payment_proof: paymentProofUrl,
              payment_approved: true
            });
          
          if (error) throw error;
        }
      });
      
      await Promise.all(updatePromises);
      
      await refetchRaffleNumbers();
      
      setPaymentData({
        ...data,
        paymentProof: paymentProofUrl
      });
      
      setIsPaymentModalOpen(false);
      setIsVoucherOpen(true);
      
      toast.success('Pago completado exitosamente');
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.error('Error al completar el pago');
    }
  };

  return {
    selectedNumbers,
    setSelectedNumbers,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isVoucherOpen,
    setIsVoucherOpen,
    paymentData,
    setPaymentData,
    handleReserveNumbers,
    handleProceedToPayment,
    handleCompletePayment
  };
}
