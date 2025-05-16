
import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface LoadingModalProps {
  isOpen: boolean;
  message: string;
  title?: string; // Make the title optional
}

const LoadingModal: React.FC<LoadingModalProps> = ({ 
  isOpen, 
  title = "Procesando", // Default title if not provided
  message 
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-center">{message}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LoadingModal;
