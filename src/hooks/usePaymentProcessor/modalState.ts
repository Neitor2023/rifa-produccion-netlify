
import { useState } from "react";
export function useModalState() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  return { isPaymentModalOpen, setIsPaymentModalOpen, isVoucherOpen, setIsVoucherOpen };
}
