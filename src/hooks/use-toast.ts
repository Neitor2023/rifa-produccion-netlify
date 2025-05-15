
import { toast as sonnerToast } from "sonner";

// Re-export the sonner toast function as our toast
export const toast = sonnerToast;

// Re-export useToast hook
export const useToast = () => {
  return {
    toast: sonnerToast,
  };
};

// Export the sonner toast types
export type { ExternalToast } from "sonner";
