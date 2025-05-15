
// This file now just re-exports from the hooks directly
// We're using the hook implementation from @/hooks/use-toast
import { toast, useToast } from "@/hooks/use-toast";
import type { ExternalToast } from "@/hooks/use-toast";

export { useToast, toast };
export type { ExternalToast };
