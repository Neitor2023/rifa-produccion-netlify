
import { toast } from "sonner";
import type { ExternalToast } from "sonner";

export { toast };
export type { ExternalToast };

// This is a wrapper around sonner's toast that provides a compatible interface
// with the shadcn toast component
export function useToast() {
  return {
    toast,
    // Create a mock toasts array to satisfy the Toaster component
    toasts: []
  };
}
