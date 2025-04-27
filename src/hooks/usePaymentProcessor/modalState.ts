
export function useModalState() {
  const [isNewPaymentOpen, setIsNewPaymentOpen]         = useState(false);
  const [isCompletePaymentOpen, setIsCompletePaymentOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen]               = useState(false);
  return {
    isNewPaymentOpen,
    setIsNewPaymentOpen,
    isCompletePaymentOpen,
    setIsCompletePaymentOpen,
    isVoucherOpen,
    setIsVoucherOpen
  };
}
