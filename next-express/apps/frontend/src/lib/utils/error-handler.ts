import { toast } from 'sonner';

/**
 * A standard shape for API errors from the backend.
 */
export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

/**
 * Handles errors gracefully by parsing them and displaying a toast notification.
 * Works with both standard Error objects and custom API errors.
 */
export function handleError(error: unknown, fallbackMessage = 'Something went wrong. Please try again.') {
  if (error instanceof Error) {
    // Standard JS error
    toast.error(error.message || fallbackMessage);
    return;
  }

  // Handle expected API errors (if your fetch wrapper throws them as objects)
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const apiError = error as ApiError;
    
    // If there are validation errors, we could map them or just show the main message
    if (apiError.errors && Object.keys(apiError.errors).length > 0) {
      const firstErrorKey = Object.keys(apiError.errors)[0];
      const firstErrorMessage = apiError.errors[firstErrorKey][0];
      toast.error(`${apiError.message}: ${firstErrorMessage}`);
    } else {
      toast.error(apiError.message || fallbackMessage);
    }
    return;
  }

  // Fallback for unknown error shapes
  if (typeof error === 'string') {
    toast.error(error);
    return;
  }

  toast.error(fallbackMessage);
}
