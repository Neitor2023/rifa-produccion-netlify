
import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

export const PaymentModalHeader = () => {
  return (
    <DialogHeader className="pt-6">
      <Card className="bg-rifa-purple shadow-md">
        <CardContent className="p-4">
          <DialogTitle className="text-xl text-white font-bold text-center">
            COMPLETA LOS SIGUIENTES DATOS
          </DialogTitle>
          <DialogDescription className="text-xl text-white font-bold text-center">
            PARA FINALIZAR LA COMPRA
          </DialogDescription>
        </CardContent>
      </Card>
    </DialogHeader>
  );
};
