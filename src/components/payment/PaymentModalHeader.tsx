
import React from 'react';
import {
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader } from "@/components/ui/card";

export const PaymentModalHeader = () => {
  return (
    <DialogHeader className="pt-6">
      <Card className="bg-[#9b87f5] dark:bg-[#7E69AB] shadow-md border-0">
        <CardHeader className="py-3 px-4">
          <DialogTitle className="text-xl text-white font-bold text-center">
            COMPLETA LOS DATOS PARA CONTINUAR
          </DialogTitle>
        </CardHeader>
      </Card>
    </DialogHeader>
  );
};
