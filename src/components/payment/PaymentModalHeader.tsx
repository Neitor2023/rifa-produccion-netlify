
import React from 'react';
import {
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const PaymentModalHeader = () => {
  return (
    <DialogHeader className="pt-6">
      <DialogTitle className="text-xl text-white font-bold text-center">
        COMPLETA LOS DATOS PARA CONTINUAR
      </DialogTitle>
    </DialogHeader>
  );
};
