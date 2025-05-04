// Global constants
export const SELLER_ID = "0102030405";
export const RAFFLE_ID = "fd6bd3bc-d81f-48a9-be58-8880293a0472";

// Mock data for development (will be replaced with Supabase data)
export interface Organization {
  organization_logo_url: string;
  organization_name: string;
  org_photo: string;
  org_name: string;
  org_phone_number: string;
  admin_photo: string;
  admin_name: string;
  admin_phone_number: string;
  imagen_publicitaria?: string; // Added this property
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  price_per_number: number;
  organization_id: string;
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

// Mock data
export const mockOrganization: Organization = {
  organization_logo_url: "https://via.placeholder.com/100x100.png?text=RR",
  organization_name: "Romy Rifa",
  org_photo: "https://via.placeholder.com/100x100.png?text=Org",
  org_name: "Organización Benéfica",
  org_phone_number: "555-123-4567",
  admin_photo: "https://via.placeholder.com/100x100.png?text=Admin",
  admin_name: "Juan Pérez",
  admin_phone_number: "555-987-6543",
  imagen_publicitaria: "https://via.placeholder.com/100x100.png?text=Imagen+Publicitaria"
};

export const mockRaffle: Raffle = {
  id: RAFFLE_ID,
  title: "Gran Rifa Benéfica 2025",
  description: "Rifa a beneficio de la comunidad",
  start_date: "2025-01-01",
  end_date: "2025-12-31",
  price_per_number: 100,
  organization_id: "org-123"
};

export const mockPrizes: Prize[] = [
  {
    id: "prize-1",
    name: "Automóvil 0KM",
    description: "Flamante automóvil último modelo",
    detail: "Automóvil sedan 4 puertas, transmisión automática, color rojo, modelo 2025, incluye seguro por un año",
    value: 1000,
    url_image: "https://via.placeholder.com/800x600.png?text=Auto+0KM",
    raffle_id: RAFFLE_ID
  },
  {
    id: "prize-2",
    name: "Viaje Todo Pagado",
    description: "Viaje para dos personas",
    detail: "Viaje todo incluido para dos personas a Cancún por 7 días y 6 noches, incluye vuelos, hotel 5 estrellas, alimentación y tours",
    value: 500,
    url_image: "https://via.placeholder.com/800x600.png?text=Viaje",
    raffle_id: RAFFLE_ID
  },
  {
    id: "prize-3",
    name: "iPhone 16 Pro",
    description: "Último modelo de smartphone",
    detail: "iPhone 16 Pro con 512GB de almacenamiento, color titanio, incluye garantía extendida por 2 años y accesorios premium",
    value: 1500,
    url_image: "https://via.placeholder.com/800x600.png?text=iPhone",
    raffle_id: RAFFLE_ID
  }
];

export const mockPrizeImages: PrizeImage[] = [
  {
    id: "img-1",
    prize_id: "prize-1",
    url_image: "https://via.placeholder.com/800x600.png?text=Auto+1",
    image_url: "https://via.placeholder.com/800x600.png?text=Auto+1"
  },
  {
    id: "img-2",
    prize_id: "prize-1",
    url_image: "https://via.placeholder.com/800x600.png?text=Auto+2",
    image_url: "https://via.placeholder.com/800x600.png?text=Auto+2"
  },
  {
    id: "img-3",
    prize_id: "prize-1",
    url_image: "https://via.placeholder.com/800x600.png?text=Auto+3",
    image_url: "https://via.placeholder.com/800x600.png?text=Auto+3"
  },
  {
    id: "img-4",
    prize_id: "prize-2",
    url_image: "https://via.placeholder.com/800x600.png?text=Viaje+1",
    image_url: "https://via.placeholder.com/800x600.png?text=Viaje+1"
  },
  {
    id: "img-5",
    prize_id: "prize-2",
    url_image: "https://via.placeholder.com/800x600.png?text=Viaje+2",
    image_url: "https://via.placeholder.com/800x600.png?text=Viaje+2"
  },
  {
    id: "img-6",
    prize_id: "prize-3",
    url_image: "https://via.placeholder.com/800x600.png?text=iPhone+1",
    image_url: "https://via.placeholder.com/800x600.png?text=iPhone+1"
  },
  {
    id: "img-7",
    prize_id: "prize-3",
    url_image: "https://via.placeholder.com/800x600.png?text=iPhone+2",
    image_url: "https://via.placeholder.com/800x600.png?text=iPhone+2"
  }
];

export const mockSeller: Seller = {
  id: SELLER_ID,
  name: "María López",
  photo_url: "https://via.placeholder.com/100x100.png?text=Vendedor",
  phone_number: "555-111-2222"
};

export const mockRaffleSeller: RaffleSeller = {
  id: "rs-1",
  raffle_id: RAFFLE_ID,
  seller_id: SELLER_ID,
  active: true,
  cant_max: 20
};

// Generate mock raffle numbers
export const generateMockRaffleNumbers = (): RaffleNumber[] => {
  const numbers: RaffleNumber[] = [];
  for (let i = 0; i < 100; i++) {
    const numberStr = i.toString().padStart(2, '0');
    // Make some numbers reserved or sold to simulate real data
    const status = i % 10 === 0 ? "sold" : i % 5 === 0 ? "reserved" : "available";
    
    numbers.push({
      id: `num-${numberStr}`,
      raffle_id: RAFFLE_ID,
      number: numberStr,
      status,
      seller_id: status !== "available" ? SELLER_ID : null,
      buyer_name: status === "sold" ? "Comprador Ejemplo" : null,
      buyer_phone: status === "sold" ? "555-555-5555" : null,
      payment_method: status === "sold" ? (i % 2 === 0 ? "cash" : "transfer") : null,
      payment_proof: status === "sold" ? "https://via.placeholder.com/300x400.png?text=Comprobante" : null,
      payment_date: status === "sold" ? new Date().toISOString() : null
    });
  }
  return numbers;
};

export const mockRaffleNumbers = generateMockRaffleNumbers();
