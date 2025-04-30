
import { toast } from 'sonner';

export const handleError = (context: string, error: unknown) => {
  console.error(`▶️ errorHandling.ts: ${context}`, error);
  
  // Handle the error based on its type
  if (error instanceof Error) {
    toast.error(error.message);
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    toast.error(String((error as any).message));
  } else {
    toast.error(`Ha ocurrido un error: ${String(error)}`);
  }
};
