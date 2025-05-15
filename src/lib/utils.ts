
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to consistently handle conflicts with numbers
export function handleNumberConflict(conflictingNumbers: string[]) {
  if (!conflictingNumbers || conflictingNumbers.length === 0) return false;
  
  toast.error(`Estos números ya pertenecen a otro participante: ${conflictingNumbers.join(', ')}. Por favor elija otros números.`);
  return true;
}

