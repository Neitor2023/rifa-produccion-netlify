
export interface Prize {
  id: string;
  raffle_id: string;
  name: string;
  description: string | null;
  order: number;
  created_at: string;
  updated_at: string;
  url_image?: string; // Add this for backward compatibility
  detail?: string;    // Add this for backward compatibility
  value?: number;     // Add this for backward compatibility
  private_note?: string; // Add this for backward compatibility
  deleted_at?: string | null; // Add this for backward compatibility
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
  // Additional fields used in OrganizerInfo and RaffleHeader components
  organization_name?: string;
  organization_logo_url?: string;
  org_name?: string;
  org_photo?: string;
  org_phone_number?: string;
  admin_name?: string;
  admin_photo?: string;
  admin_phone_number?: string;
  background_color?: string;
  select_language?: string;
  modal?: string;
}
