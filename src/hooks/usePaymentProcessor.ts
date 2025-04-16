
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
  // State management
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null);
  const [validatedBuyerData, setValidatedBuyerData] = useState<{ name: string, phone: string } | null>(null);

  // Participant management
  const findOrCreateParticipant = async (phone: string, name?: string): Promise<string | null> => {
    try {
      console.log('Finding or creating participant:', { phone, name, raffle_id: raffleId });
      
      // First try to find an existing participant with this phone number in this raffle
      const { data: existingParticipant, error: searchError } = await supabase
        .from('participants')
        .select('id, name')
        .eq('phone', phone)
        .eq('raffle_id', raffleId)
        .maybeSingle();
      
      if (searchError) {
        console.error('Error searching for participant:', searchError);
        return null;
      }
      
      // If participant exists, return their ID
      if (existingParticipant) {
        console.log('Found existing participant:', existingParticipant);
        
        // If we have a name and it's different from the existing one, update it
        if (name && name !== existingParticipant.name) {
          const { error: updateError } = await supabase
            .from('participants')
            .update({ name: name })
            .eq('id', existingParticipant.id);
          
          if (updateError) {
            console.error('Error updating participant name:', updateError);
          }
        }
        
        return existingParticipant.id;
      }
      
      // If no participant exists and we have a name, create a new one
      if (name) {
        console.log('Creating new participant:', { name, phone, raffle_id: raffleId, seller_id: raffleSeller?.seller_id });
        
        const { data: newParticipant, error: createError } = await supabase
          .from('participants')
          .insert({
            name: name,
            phone: phone,
            email: '', // Required field, but not available at reservation time
            raffle_id: raffleId,
            seller_id: raffleSeller?.seller_id
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error('Error creating participant:', createError);
          toast.error('Error al crear participante: ' + createError.message);
          return null;
        }
        
        console.log('Created new participant with ID:', newParticipant?.id);
        return newParticipant?.id || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error in findOrCreateParticipant:', error);
      toast.error('Error al buscar o crear participante');
      return null;
    }
  };

  // Reserve numbers
  const handleReserveNumbers = async (numbers: string[], buyerPhone?: string, buyerName?: string) => {
    if (!raffleSeller?.seller_id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    
    try {
      console.log('Reserve numbers called with:', { numbers, buyerPhone, buyerName });
      
      // Validate required fields
      if (!buyerPhone || !buyerName) {
        toast.error('Nombre y teléfono son obligatorios para apartar números');
        return;
      }
      
      // Find or create participant
      const participantId = await findOrCreateParticipant(buyerPhone, buyerName);
      console.log('Participant ID for reservation:', participantId);
      
      if (!participantId) {
        toast.error('No se pudo crear o encontrar al participante');
        return;
      }
      
      // Update or insert raffle numbers
      await updateRaffleNumbersStatus(numbers, 'reserved', participantId);
      
      // Refresh data and reset selection
      await refetchRaffleNumbers();
      setSelectedNumbers([]);
      
      toast.success(`${numbers.length} número(s) apartados exitosamente`);
    } catch (error) {
      console.error('Error reserving numbers:', error);
      toast.error('Error al apartar números');
    }
  };
  
  // Update raffle numbers status
  const updateRaffleNumbersStatus = async (numbers: string[], status: string, participantId: string | null = null) => {
    if (!raffleSeller?.seller_id) {
      throw new Error('Seller ID not available');
    }
    
    const updatePromises = numbers.map(async (numStr) => {
      const num = parseInt(numStr);
      const existingNumber = raffleNumbers?.find(n => n.number === num);
      
      const updateData: any = { 
        status, 
        seller_id: raffleSeller.seller_id
      };
      
      // Add participant_id if available
      if (participantId) {
        updateData.participant_id = participantId;
      }
      
      // Add or remove expiration date based on status
      if (status === 'reserved') {
        updateData.reservation_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (status === 'sold') {
        updateData.reservation_expires_at = null;
      }
      
      if (existingNumber) {
        const { error } = await supabase
          .from('raffle_numbers')
          .update(updateData)
          .eq('id', existingNumber.id);
        
        if (error) throw error;
      } else {
        const insertData = { 
          ...updateData,
          raffle_id: raffleId, 
          number: num
        };
        
        const { error } = await supabase
          .from('raffle_numbers')
          .insert(insertData);
        
        if (error) throw error;
      }
    });
    
    await Promise.all(updatePromises);
  };
  
  // Payment process
  const handleProceedToPayment = async (numbers: string[]) => {
    if (numbers.length === 0) {
      toast.error('Seleccione al menos un número para comprar');
      return;
    }
    
    try {
      // Check number availability
      const unavailableNumbers = await checkNumbersAvailability(numbers);
      
      if (unavailableNumbers.length > 0) {
        toast.error(`Números ${unavailableNumbers.join(', ')} no están disponibles`);
        return;
      }
      
      // Check for existing participant on reserved numbers
      await checkReservedNumbersParticipant(numbers);
      
      // Proceed with payment
      setSelectedNumbers(numbers);
      setIsPaymentModalOpen(true);
    } catch (error) {
      console.error('Error proceeding to payment:', error);
      toast.error('Error al procesar el pago');
    }
  };
  
  // Check number availability
  const checkNumbersAvailability = async (numbers: string[]): Promise<string[]> => {
    return numbers.filter(numStr => {
      const num = parseInt(numStr);
      const existingNumber = raffleNumbers?.find(n => n.number === num);
      return existingNumber && 
             existingNumber.status !== 'available' && 
             (existingNumber.status !== 'reserved' || existingNumber.seller_id !== raffleSeller?.seller_id);
    });
  };
  
  // Check reserved numbers for participant
  const checkReservedNumbersParticipant = async (numbers: string[]) => {
    // Check if we're processing a reserved number with an existing participant_id
    const reservedNumbers = numbers.map(numStr => parseInt(numStr)).filter(num => {
      const existingNumber = raffleNumbers?.find(n => n.number === num);
      return existingNumber && existingNumber.status === 'reserved' && existingNumber.participant_id;
    });
    
    if (reservedNumbers.length > 0) {
      try {
        // Get the first reserved number to check the participant info
        const firstNum = reservedNumbers[0];
        const existingNumber = raffleNumbers?.find(n => n.number === firstNum);
        
        if (existingNumber && existingNumber.participant_id) {
          // Get participant info
          const { data: participant, error } = await supabase
            .from('participants')
            .select('name, phone')
            .eq('id', existingNumber.participant_id)
            .single();
          
          if (error) throw error;
          
          if (participant) {
            // Set validated buyer data
            setValidatedBuyerData({
              name: participant.name,
              phone: participant.phone
            });
          }
        }
      } catch (error) {
        console.error('Error fetching participant info:', error);
        // Don't throw here, as we want to proceed with payment even if this fails
      }
    } else {
      // Reset validated buyer data if there are no reserved numbers
      setValidatedBuyerData(null);
    }
  };
  
  // Complete payment
  const handleCompletePayment = async (data: PaymentFormData) => {
    if (!raffleSeller?.seller_id) {
      toast.error('Información del vendedor no disponible');
      return;
    }
    
    try {
      // Upload payment proof if available
      const paymentProofUrl = await uploadPaymentProof(data.paymentProof);
      
      // Find or create participant
      const participantId = await processParticipant(data);
      
      if (!participantId) {
        toast.error('Error al procesar la información del participante');
        return;
      }
      
      // Update numbers to sold status
      await updateNumbersToSold(selectedNumbers, participantId, paymentProofUrl);
      
      // Refresh data
      await refetchRaffleNumbers();
      
      // Set payment data and show voucher
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
  
  // Upload payment proof
  const uploadPaymentProof = async (paymentProof: File | string | null): Promise<string | null> => {
    if (!paymentProof || !(paymentProof instanceof File)) {
      return typeof paymentProof === 'string' ? paymentProof : null;
    }
    
    try {
      const fileName = `${raffleId}_${Date.now()}_${paymentProof.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(fileName);
        
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      throw error;
    }
  };
  
  // Process participant data
  const processParticipant = async (data: PaymentFormData): Promise<string | null> => {
    try {
      // Check for existing participant
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id')
        .eq('phone', data.buyerPhone)
        .eq('raffle_id', raffleId)
        .maybeSingle();
      
      // Update existing participant
      if (existingParticipant) {
        const participantId = existingParticipant.id;
        
        await supabase
          .from('participants')
          .update({ name: data.buyerName })
          .eq('id', participantId);
          
        return participantId;
      } 
      
      // Create new participant
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
      
      return newParticipant.id;
    } catch (error) {
      console.error('Error processing participant:', error);
      throw error;
    }
  };
  
  // Update numbers to sold status
  const updateNumbersToSold = async (numbers: string[], participantId: string, paymentProofUrl: string | null) => {
    const updatePromises = numbers.map(async (numStr) => {
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
    validatedBuyerData,
    handleReserveNumbers,
    handleProceedToPayment,
    handleCompletePayment,
    findOrCreateParticipant
  };
}
