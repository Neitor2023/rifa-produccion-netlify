
declare global {
  interface Window {
    ENV?: {
      SUPABASE_URL?: string;
      SUPABASE_KEY?: string;
      BUCKET_PAYMENT_PROOFS?: string;
      SHOW_DEV_NOTICE?: string;
    };
  }
}

export {};
