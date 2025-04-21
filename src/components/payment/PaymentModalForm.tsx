
import React from 'react';
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from '../PaymentModal';

interface PaymentModalFormProps {
  form: UseFormReturn<PaymentFormData>;
  onSubmit: (values: PaymentFormData) => void;
  children: React.ReactNode;
}

const PaymentModalForm: React.FC<PaymentModalFormProps> = ({ form, onSubmit, children }) => (
  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">{children}</form>
);

export default PaymentModalForm;
