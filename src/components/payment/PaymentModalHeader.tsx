
import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const PaymentModalHeader = () => {
  return (
    <DialogHeader className="pt-6">
      <DialogTitle className="text-xl text-white font-bold text-center">
        COMPLETA LOS SIGUIENTES DATOS
      </DialogTitle>
      <DialogDescription className="text-xl text-white font-bold text-center">
        PARA FINALIZAR LA COMPRA
      </DialogDescription>
    </DialogHeader>
  );
};
