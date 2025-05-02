export interface Prize {
  id: string;
  raffle_id: string;
  name: string;
  description: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface PrizeImage {
  id: string;
  prize_id: string;
  image_url: string;  // The field used in the database
  url_image?: string; // Keep this for backward compatibility
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Organization {
  id: string;
  name: string;
  logo: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  created_at: string;
  updated_at: string;
}
