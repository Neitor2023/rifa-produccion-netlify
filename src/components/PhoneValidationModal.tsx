import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ValidatedBuyerInfo } from '@/types/participant';

interface PhoneValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneValidationSuccess: (
    validatedNumber: string,
    participantId: string,
    buyerInfo?: ValidatedBuyerInfo
  ) => void;
  selectedNumber: string | null;
  raffleNumbers: any[];
  raffleSellerId: string;
  raffleId: string;
  debugMode?: boolean;
}

const PhoneValidationModal: React.FC<PhoneValidationModalProps> = ({
  isOpen,
  onClose,
  onPhoneValidationSuccess,
  selectedNumber,
  raffleNumbers,
  raffleSellerId,
  raffleId,
  debugMode = false
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleValidatePhone = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    setIsLoading(true);

    try {
      if (debugMode) {
        console.log('PhoneValidationModal: Validating phone number:', phoneNumber);
      }

      // Query Supabase to find a participant with the provided phone number
      const { data: participants, error } = await supabase
        .from('participants')
        .select('*')
        .eq('phone', phoneNumber)
        .eq('raffle_id', raffleId);

      if (error) {
        console.error('PhoneValidationModal: Error querying Supabase:', error);
        toast.error('Error validating phone number');
        return;
      }

      if (participants && participants.length > 0) {
        // If a participant is found, extract the participant ID and buyer information
        const participant = participants[0];
        const participantId = participant.id;

        // Construct the buyer information object
        const buyerInfo: ValidatedBuyerInfo = {
          id: participant.id,
          name: participant.name,
          phone: participant.phone,
          cedula: participant.cedula || '',
          direccion: participant.direccion || '',
          sugerencia_producto: participant.sugerencia_producto || '',
          email: participant.email || ''
        };

        if (debugMode) {
          console.log('PhoneValidationModal: Participant found:', participant);
          console.log('PhoneValidationModal: Participant ID:', participantId);
          console.log('PhoneValidationModal: Buyer Info:', buyerInfo);
        }

        // Call the onPhoneValidationSuccess callback with the validated number,
        // participant ID, and buyer information
        onPhoneValidationSuccess(selectedNumber || '', participantId, buyerInfo);
        toast.success('Phone number validated successfully');
        onClose();
      } else {
        // If no participant is found, show an error message
        toast.error('No participant found with this phone number');
      }
    } catch (error) {
      console.error('PhoneValidationModal: Error validating phone number:', error);
      toast.error('Error validating phone number');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Validate Phone Number</DialogTitle>
          <DialogDescription>
            Enter the phone number to validate the reserved number.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone Number
            </Label>
            <Input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <Button onClick={handleValidatePhone} disabled={isLoading}>
          {isLoading ? 'Validating...' : 'Validate'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneValidationModal;
