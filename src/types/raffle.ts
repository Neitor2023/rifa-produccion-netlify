
export interface RaffleNumber {
  id: string;
  raffle_id: string;
  number: string;
  status: 'available' | 'reserved' | 'sold';
  seller_id: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  payment_method: string | null;
  payment_proof: string | null;
  payment_date: string | null;
  participant_id?: string;
  participant_name?: string;
  participant_phone?: string;
  participant_cedula?: string;
  payment_approved?: boolean;
  reservation_expires_at?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
