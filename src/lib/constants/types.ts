// Type definitions
export interface Organization {
  organization_logo_url: string;
  organization_name: string;
  org_photo: string;
  org_name: string;
  org_phone_number: string;
  admin_photo: string;
  admin_name: string;
  admin_phone_number: string;
  imagen_publicitaria?: string;
  image_checklist?: string;
  image_apartado?: string; // For the Apartar button
  imagen_pago?: string;   // For the Pagar button
  imagen_pago_apartado?: string; // For the Pagar Apartados button
  imagen_limpiar?: string; // For the Limpiar button
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  price_per_number: number;
  organization_id: string;
  total_numbers?: number; // Añadido para especificar la cantidad total de números
}

export interface Prize {
  id: string;
  name: string;
  description: string;
  detail?: string;
  value: number;
  url_image: string;
  raffle_id: string;
  private_note?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface PrizeImage {
  id: string;
  prize_id: string;
  url_image: string;
  image_url: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Seller {
  id: string;
  name: string;
  photo_url: string;
  phone_number: string;
}

export interface RaffleSeller {
  id: string;
  raffle_id: string;
  seller_id: string;
  active: boolean;
  cant_max: number;
}

export interface RaffleNumber {
  id: string;
  raffle_id: string;
  number: string;
  status: "available" | "reserved" | "sold";
  seller_id: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  payment_method: "cash" | "transfer" | null;
  payment_proof: string | null;
  payment_date: string | null;
}
