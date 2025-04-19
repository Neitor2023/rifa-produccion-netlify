
import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const PaymentModalHeader = () => {
  return (
    <DialogHeader className="pt-6">
      <DialogTitle className="text-xl font-bold text-center text-gray-800">
        Completa tu información en pantalla
      </DialogTitle>
      <DialogDescription className="text-center">
        Completa tu información para finalizar la compra
      </DialogDescription>
    </DialogHeader>
  );
};
