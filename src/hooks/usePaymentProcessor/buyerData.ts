
import { useState } from "react";
import { ValidatedBuyerInfo } from '@/types/participant';

export function useBuyerData() {
  const [validatedBuyerData, setValidatedBuyerData] = useState<ValidatedBuyerInfo | null>(null);
  return { validatedBuyerData, setValidatedBuyerData };
}
